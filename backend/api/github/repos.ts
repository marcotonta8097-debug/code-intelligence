import { createFileRoute } from "@tanstack/react-router";
import { withSentryApiRoute } from "@/lib/monitoring/withSentryApiRoute";
import { getCintGitHubConnection } from "@/lib/cint/cintGitHubConnectionStore";
import { listCintGitHubRepos } from "@/lib/cint/cintGitHubRepoOps";

const PATH = "/api/projects/$projectId/cint/github/repos";

export const Route = createFileRoute("/api/projects/$projectId/cint/github/repos")({
  server: {
    handlers: {
      GET: withSentryApiRoute(PATH, async ({ params }) => {
        const projectId = params?.projectId?.trim();
        if (!projectId) {
          return Response.json({ ok: false, error: "missing_project" }, { status: 400 });
        }
        const conn = await getCintGitHubConnection(projectId);
        if (!conn?.accessToken) {
          return Response.json(
            { ok: false, error: "not_connected", code: "cint_github_not_connected" },
            { status: 401 },
          );
        }
        try {
          const repos = await listCintGitHubRepos(conn.accessToken);
          return Response.json({
            ok: true,
            data: repos.map((r) => ({
              id: r.id,
              fullName: r.full_name,
              name: r.name,
              private: r.private,
              defaultBranch: r.default_branch,
              htmlUrl: r.html_url,
            })),
          });
        } catch (e) {
          return Response.json(
            { ok: false, error: e instanceof Error ? e.message : "repos_failed" },
            { status: 500 },
          );
        }
      }),
    },
  },
});
