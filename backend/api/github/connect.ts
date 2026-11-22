import { createFileRoute } from "@tanstack/react-router";
import { withSentryApiRoute } from "@/lib/monitoring/withSentryApiRoute";
import {
  buildCintGitHubAuthorizeUrl,
  cintGitHubNotConfiguredMessage,
  cintGitHubOAuthRedirectUri,
  isCintGitHubOAuthConfigured,
  CINT_GITHUB_NOT_CONFIGURED_CODE,
} from "@/lib/cint/cintGitHubConfig";
import { signCintGitHubOAuthState } from "@/lib/cint/cintOAuthState";

const PATH = "/api/projects/$projectId/cint/github/connect";

export const Route = createFileRoute("/api/projects/$projectId/cint/github/connect")({
  server: {
    handlers: {
      POST: withSentryApiRoute(PATH, async ({ request, params }) => {
        const projectId = params?.projectId?.trim();
        if (!projectId) {
          return Response.json({ ok: false, error: "missing_project" }, { status: 400 });
        }
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
          // Always return into this CI project on the Replica host after GitHub authorizes.
          const returnPath =
            body.returnPath?.startsWith(`/projects/${projectId}`) ||
            body.returnPath?.startsWith(`/deploy/${projectId}`)
              ? body.returnPath
              : `/projects/${encodeURIComponent(projectId)}?tab=generator`;
          const state = signCintGitHubOAuthState(projectId, returnPath);
          const redirectUrl = buildCintGitHubAuthorizeUrl(
            state,
            cintGitHubOAuthRedirectUri(),
          );
          return Response.json({
            ok: true,
            redirectUrl,
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
