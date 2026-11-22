import { createFileRoute } from "@tanstack/react-router";
import { withSentryApiRoute } from "@/lib/monitoring/withSentryApiRoute";
import { handleCintGitHubOAuthCallback } from "@/lib/cint/cintGitHubOAuthCallback";

const PATH = "/api/cint/github/callback";

export const Route = createFileRoute("/api/cint/github/callback")({
  server: {
    handlers: {
      GET: withSentryApiRoute(PATH, async ({ request }) => handleCintGitHubOAuthCallback(request)),
    },
  },
});
