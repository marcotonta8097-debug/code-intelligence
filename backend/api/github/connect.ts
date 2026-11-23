import { createFileRoute } from "@tanstack/react-router";
import { withSentryApiRoute } from "@/lib/monitoring/withSentryApiRoute";
import {
  buildCintGitHubAuthorizeUrl,
  cintGitHubNotConfiguredMessage,
  cintGitHubOAuthRedirectUri,
  cintGitHubRedirectUriRegistrationHint,
  isCintGitHubOAuthConfigured,
  normalizeCintOAuthReturnPath,
  CINT_GITHUB_NOT_CONFIGURED_CODE,
} from "@/lib/cint/cintGitHubConfig";
import { signCintGitHubOAuthState } from "@/lib/cint/cintOAuthState";
import { requireCintProductAuth } from "@/lib/cint/requireCintProductAuth";

const PATH = "/api/projects/$projectId/cint/github/connect";

export const Route = createFileRoute("/api/projects/$projectId/cint/github/connect")({
  server: {
    handlers: {
      POST: withSentryApiRoute(PATH, async ({ request, params }) => {
        const projectId = params?.projectId?.trim();
        if (!projectId) {
          return Response.json({ ok: false, error: "missing_project" }, { status: 400 });
        }
        const gate = await requireCintProductAuth(request, "integrations.manage");
        if (!gate.ok) return gate.response;
        if (!isCintGitHubOAuthConfigured()) {
          return Response.json(
            {
              ok: false,
              code: CINT_GITHUB_NOT_CONFIGURED_CODE,
              error: cintGitHubNotConfiguredMessage(),
            },
            { status: 503 },
          );
        }
        try {
          if (projectId === "local" || projectId === "oauth") {
            return Response.json(
              {
                ok: false,
                error:
                  "Connect requires a real Code Intelligence project id in the URL (/projects/<uuid>). Live preview must resolve the host project id.",
              },
              { status: 400 },
            );
          }
          const body = (await request.json().catch(() => ({}))) as { returnPath?: string };
          // Tier 1: return to published CINT surface — never Replica generator chrome.
          const returnPath = normalizeCintOAuthReturnPath(projectId, body.returnPath);
          const state = signCintGitHubOAuthState(projectId, returnPath);
          const redirectUri = cintGitHubOAuthRedirectUri(projectId, request);
          const redirectUrl = buildCintGitHubAuthorizeUrl(state, redirectUri);
          return Response.json({
            ok: true,
            redirectUrl,
            redirectUri,
            registrationHint: cintGitHubRedirectUriRegistrationHint(request),
            provider: "github_read",
            projectId,
            returnPath,
          });
        } catch (e) {
          const message = e instanceof Error ? e.message : "Connect failed";
          return Response.json({ ok: false, error: message }, { status: 500 });
        }
      }),
    },
  },
});
