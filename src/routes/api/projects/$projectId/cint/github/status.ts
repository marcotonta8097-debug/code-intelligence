import { createFileRoute } from "@tanstack/react-router";
import { withSentryApiRoute } from "@/lib/monitoring/withSentryApiRoute";
import {
  connectionToLiveIndexEvidence,
  getCintGitHubConnection,
  getCintGitHubTokenDurability,
} from "@/lib/cint/cintGitHubConnectionStore";
import { isCintGitHubOAuthConfigured } from "@/lib/cint/cintGitHubConfig";
import { isCintSupabaseConfigured } from "@/lib/cint/cintSupabaseConfig";

const PATH = "/api/projects/$projectId/cint/github/status";

export const Route = createFileRoute("/api/projects/$projectId/cint/github/status")({
  server: {
    handlers: {
      GET: withSentryApiRoute(PATH, async ({ params }) => {
        const projectId = params?.projectId?.trim();
        if (!projectId) {
          return Response.json({ ok: false, error: "missing_project" }, { status: 400 });
        }
        const conn = await getCintGitHubConnection(projectId);
        const evidence = connectionToLiveIndexEvidence(conn);
        return Response.json({
          ok: true,
          oauthConfigured: isCintGitHubOAuthConfigured(),
          connected: Boolean(conn?.accessToken),
          accountLogin: conn?.accountLogin ?? null,
          selectedRepo: conn?.selectedRepo ?? null,
          defaultBranch: conn?.defaultBranch ?? null,
          lastSyncedAt: conn?.lastSyncedAt ?? null,
          liveIndex: evidence,
          tokenDurability: getCintGitHubTokenDurability(),
          cintSupabaseConfigured: isCintSupabaseConfigured(),
        });
      }),
    },
  },
});
