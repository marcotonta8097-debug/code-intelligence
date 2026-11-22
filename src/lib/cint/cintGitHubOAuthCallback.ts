/**
 * Shared CI GitHub OAuth callback.
 *
 * GitHub Redirect URI (stable API): /api/projects/oauth/cint/github/callback
 * Browser return (must be a real CI project on the Replica host):
 *   /projects/{cintProjectId}?…&cint_github=connected
 *
 * Project id is carried in signed OAuth state (and recovered from returnPath).
 */

import {
  cintGitHubCallbackBaseUrl,
  cintGitHubOAuthRedirectUri,
  exchangeCintGitHubCode,
  isCintGitHubOAuthConfigured,
} from "@/lib/cint/cintGitHubConfig";
import { verifyCintGitHubOAuthState } from "@/lib/cint/cintOAuthState";
import { upsertCintGitHubConnection } from "@/lib/cint/cintGitHubConnectionStore";
import { fetchCintGitHubUser } from "@/lib/cint/cintGitHubRepoOps";

function projectIdFromReturnPath(returnPath?: string): string | null {
  if (!returnPath?.startsWith("/")) return null;
  const m =
    returnPath.match(/^\/projects\/([^/?#]+)/) ||
    returnPath.match(/^\/deploy\/([^/?#]+)/);
  const id = m?.[1]?.trim() || "";
  if (!id || id === "local" || id === "oauth") return null;
  return id;
}

function resolveOAuthProjectId(payload: {
  projectId: string;
  returnPath?: string;
}): string {
  const raw = (payload.projectId || "").trim();
  if (raw && raw !== "local" && raw !== "oauth") return raw;
  return projectIdFromReturnPath(payload.returnPath) || "";
}

/** Node Response.redirect requires an absolute URL. */
function absoluteAppUrl(request: Request, pathAndQuery: string): string {
  const path = pathAndQuery.startsWith("/") ? pathAndQuery : `/${pathAndQuery}`;
  try {
    return new URL(path, request.url).toString();
  } catch {
    return `${cintGitHubCallbackBaseUrl().replace(/\/$/, "")}${path}`;
  }
}

function cintProjectHome(projectId: string, flag: "connected" | "error", reason?: string): string {
  const q = new URLSearchParams({ tab: "generator", cint_github: flag });
  if (reason) q.set("reason", reason);
  return `/projects/${encodeURIComponent(projectId)}?${q.toString()}`;
}

function redirectTo(request: Request, pathAndQuery: string): Response {
  return Response.redirect(absoluteAppUrl(request, pathAndQuery), 302);
}

export async function handleCintGitHubOAuthCallback(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  let projectId = "";
  let returnPathHint = "";
  try {
    if (state) {
      const early = verifyCintGitHubOAuthState(state);
      projectId = resolveOAuthProjectId(early);
      returnPathHint = early.returnPath || "";
    }
  } catch {
    projectId = "";
  }

  if (oauthError) {
    if (!projectId) return redirectTo(request, `/?cint_github=error&reason=${encodeURIComponent(oauthError)}`);
    return redirectTo(request, cintProjectHome(projectId, "error", oauthError));
  }
  if (!code || !state) {
    if (!projectId) return redirectTo(request, "/?cint_github=error&reason=missing_code");
    return redirectTo(request, cintProjectHome(projectId, "error", "missing_code"));
  }

  try {
    if (!isCintGitHubOAuthConfigured()) {
      if (!projectId) return redirectTo(request, "/?cint_github=error&reason=not_configured");
      return redirectTo(request, cintProjectHome(projectId, "error", "not_configured"));
    }

    const payload = verifyCintGitHubOAuthState(state);
    projectId = resolveOAuthProjectId(payload);
    if (!projectId) {
      return redirectTo(request, "/?cint_github=error&reason=missing_cint_project_id");
    }

    // Exchange must use the same Redirect URI registered on the GitHub OAuth App.
    const token = await exchangeCintGitHubCode(code, cintGitHubOAuthRedirectUri());
    const user = await fetchCintGitHubUser(token.access_token);
    await upsertCintGitHubConnection({
      projectId,
      accessToken: token.access_token,
      accountLogin: user.login,
      scope: token.scope,
      selectedRepo: null,
      defaultBranch: null,
      lastSyncedAt: null,
      syncCommitSha: null,
      syncFileCount: 0,
    });

    // Prefer returnPath only when it already points at this CI project on the Replica host.
    const preferred =
      payload.returnPath?.startsWith(`/projects/${projectId}`) ||
      payload.returnPath?.startsWith(`/deploy/${projectId}`)
        ? payload.returnPath
        : returnPathHint.startsWith(`/projects/${projectId}`) ||
            returnPathHint.startsWith(`/deploy/${projectId}`)
          ? returnPathHint
          : null;

    if (preferred) {
      const sep = preferred.includes("?") ? "&" : "?";
      const withFlag = /cint_github=/.test(preferred)
        ? preferred
        : `${preferred}${sep}cint_github=connected`;
      return redirectTo(request, withFlag);
    }

    return redirectTo(request, cintProjectHome(projectId, "connected"));
  } catch (e) {
    const message = e instanceof Error ? e.message : "callback_failed";
    if (!projectId) {
      return redirectTo(request, `/?cint_github=error&reason=${encodeURIComponent(message)}`);
    }
    return redirectTo(request, cintProjectHome(projectId, "error", message));
  }
}
