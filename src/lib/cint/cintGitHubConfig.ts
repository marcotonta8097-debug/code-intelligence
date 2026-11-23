/**
 * Code Intelligence GitHub OAuth — product-owned credentials only.
 * Tier 1: no factory GITHUB_* fallback (credential governance).
 */

export const CINT_GITHUB_NOT_CONFIGURED_CODE = "cint_github_not_configured" as const;

export function readCintGitHubClientId(): string | undefined {
  return process.env.CINT_GITHUB_CLIENT_ID?.trim() || undefined;
}

export function readCintGitHubClientSecret(): string | undefined {
  return process.env.CINT_GITHUB_CLIENT_SECRET?.trim() || undefined;
}

export function isCintGitHubOAuthConfigured(): boolean {
  return Boolean(readCintGitHubClientId() && readCintGitHubClientSecret());
}

/** Strip trailing slash so redirect_uri never drifts from GitHub App registration. */
function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * Public origin used to build the OAuth Redirect URI.
 * Prefer explicit CINT_GITHUB_CALLBACK_BASE_URL in production; request origin for local.
 */
export function cintGitHubCallbackBaseUrl(request?: Request): string {
  const fromEnv =
    process.env.CINT_GITHUB_CALLBACK_BASE_URL?.trim() ||
    process.env.INTEGRATIONS_CALLBACK_BASE_URL?.trim() ||
    process.env.VITE_APP_URL?.trim();
  if (fromEnv) return stripTrailingSlash(fromEnv);
  if (request) {
    try {
      const url = new URL(request.url);
      const xfHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
      const xfProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
      if (xfHost) {
        return stripTrailingSlash(`${xfProto || url.protocol.replace(":", "")}://${xfHost}`);
      }
      return stripTrailingSlash(url.origin);
    } catch {
      /* fall through */
    }
  }
  return "http://localhost:5173";
}

/** Canonical path registered on the CINT GitHub OAuth App. */
export const CINT_GITHUB_OAUTH_CALLBACK_PATH = "/api/cint/github/callback" as const;

/**
 * Single Redirect URI for all CI projects — project id is carried in signed OAuth state.
 * Register exactly this URL on the CINT GitHub OAuth App (Authorization callback URL).
 * Optional full override: CINT_GITHUB_OAUTH_REDIRECT_URI (for already-registered legacy URIs).
 */
export function cintGitHubOAuthRedirectUri(_projectId?: string, request?: Request): string {
  const fullOverride = process.env.CINT_GITHUB_OAUTH_REDIRECT_URI?.trim();
  if (fullOverride) return stripTrailingSlash(fullOverride);
  return `${cintGitHubCallbackBaseUrl(request)}${CINT_GITHUB_OAUTH_CALLBACK_PATH}`;
}

/** Operator hint when GitHub returns redirect_uri mismatch. */
export function cintGitHubRedirectUriRegistrationHint(request?: Request): string {
  const uri = cintGitHubOAuthRedirectUri(undefined, request);
  return `Register this Authorization callback URL on the CINT GitHub OAuth App: ${uri}`;
}

export function cintGitHubNotConfiguredMessage(): string {
  return "Code Intelligence GitHub OAuth is not configured (set CINT_GITHUB_CLIENT_ID / CINT_GITHUB_CLIENT_SECRET — factory GITHUB_* is not used).";
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Browser return after CINT GitHub OAuth.
 * `/deploy/{slug}` is a published deployment slug — never a project UUID.
 * Unpublished projects must return to the workspace so Sync/Analyze stay usable.
 */
export function normalizeCintOAuthReturnPath(projectId: string, raw?: string | null): string {
  const id = projectId.trim();
  const workspace = `/projects/${encodeURIComponent(id)}?tab=generator`;
  const trimmed = (raw || "").trim();
  if (!trimmed) return workspace;

  if (trimmed.startsWith("/deploy/")) {
    const slug = decodeURIComponent(trimmed.slice("/deploy/".length).split(/[?#]/)[0] || "");
    // Real published slug only — /deploy/{projectUuid} is not a live link.
    if (slug && slug !== id && !UUID_RE.test(slug)) return trimmed;
    return workspace;
  }

  if (trimmed.startsWith(`/projects/${id}`) || trimmed.startsWith(`/projects/${encodeURIComponent(id)}`)) {
    if (/[?&]tab=/.test(trimmed)) return trimmed;
    const sep = trimmed.includes("?") ? "&" : "?";
    return `${trimmed}${sep}tab=generator`;
  }

  // Preview / other host chrome → workspace (CINT product ops, not marketing deploy).
  if (trimmed.startsWith("/")) return workspace;
  return workspace;
}

export function buildCintGitHubAuthorizeUrl(state: string, redirectUri: string): string {
  const clientId = readCintGitHubClientId();
  if (!clientId) throw new Error(cintGitHubNotConfiguredMessage());
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "read:user repo",
    state,
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function exchangeCintGitHubCode(
  code: string,
  redirectUri: string,
): Promise<{ access_token: string; token_type: string; scope: string }> {
  const clientId = readCintGitHubClientId();
  const clientSecret = readCintGitHubClientSecret();
  if (!clientId || !clientSecret) throw new Error(cintGitHubNotConfiguredMessage());

  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) throw new Error(`GitHub token exchange failed (${res.status})`);
  const data = (await res.json()) as {
    access_token?: string;
    token_type?: string;
    scope?: string;
    error?: string;
  };
  if (data.error || !data.access_token) {
    throw new Error(data.error ?? "GitHub did not return an access token");
  }
  return {
    access_token: data.access_token,
    token_type: data.token_type ?? "bearer",
    scope: data.scope ?? "",
  };
}
