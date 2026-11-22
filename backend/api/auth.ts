/**
 * Code Intelligence product auth — single-segment route (B1).
 */
import { createFileRoute } from "@tanstack/react-router";
import { handleCintAuthGet, handleCintAuthPost } from "@/lib/cint/cintAuthHttp";
import { withSentryApiRoute } from "@/lib/monitoring/withSentryApiRoute";

const PATH = "/api/projects/$projectId/cint/auth";

export const Route = createFileRoute("/api/projects/$projectId/cint/auth")({
  server: {
    handlers: {
      GET: withSentryApiRoute(PATH, async ({ request, params }) => {
        const projectId = params?.projectId?.trim();
        if (!projectId) {
          return Response.json({ ok: false, error: "missing_project" }, { status: 400 });
        }
        return handleCintAuthGet(request, projectId);
      }),
      POST: withSentryApiRoute(PATH, async ({ request, params }) => {
        const projectId = params?.projectId?.trim();
        if (!projectId) {
          return Response.json({ ok: false, error: "missing_project" }, { status: 400 });
        }
        return handleCintAuthPost(request, projectId);
      }),
    },
  },
});
