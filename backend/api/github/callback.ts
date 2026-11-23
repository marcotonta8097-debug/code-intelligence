import { createFileRoute } from "@tanstack/react-router";
import { withSentryApiRoute } from "@/lib/monitoring/withSentryApiRoute";
import { handleCintGitHubOAuthCallback } from "@/lib/cint/cintGitHubOAuthCallback";

const PATH = "/api/projects/$projectId/cint/github/callback";

/** Legacy per-project path — same handler; authorize now uses /api/cint/github/callback. */
export const Route = createFileRoute("/api/projects/$projectId/cint/github/callback")({
  server: {
    handlers: {
      GET: withSentryApiRoute(PATH, async ({ request }) => handleCintGitHubOAuthCallback(request)),
    },
  },
});
