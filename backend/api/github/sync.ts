import { createFileRoute } from "@tanstack/react-router";
import { withSentryApiRoute } from "@/lib/monitoring/withSentryApiRoute";
import {
  CINT_LIVE_INDEX_KEY,
  connectionToLiveIndexEvidence,
  getCintGitHubConnection,
  persistCintProjectLiveIndexMetadata,
  upsertCintGitHubConnection,
} from "@/lib/cint/cintGitHubConnectionStore";
import {
  normalizeCintGitHubFullName,
  syncCintGitHubRepositoryTree,
} from "@/lib/cint/cintGitHubRepoOps";
import { cintEntityStore } from "@/lib/cint/cintEntityStore";

const PATH = "/api/projects/$projectId/cint/github/sync";

export const Route = createFileRoute("/api/projects/$projectId/cint/github/sync")({
  server: {
    handlers: {
      POST: withSentryApiRoute(PATH, async ({ request, params }) => {
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
          const body = (await request.json().catch(() => ({}))) as {
            fullName?: string;
            repository?: string;
          };
          const raw = (body.fullName || body.repository || conn.selectedRepo || "").trim();
          const fullName = normalizeCintGitHubFullName(raw);
          if (!fullName) {
            return Response.json(
              {
                ok: false,
                error: "repository_required",
                detail: "Pass fullName like owner/repo or https://github.com/owner/repo",
              },
              { status: 400 },
            );
          }

          // Fast sync: inventory paths + small content sample (UI was hanging on 200 blob fetches).
          const synced = await syncCintGitHubRepositoryTree(conn.accessToken, fullName, {
            maxFiles: 400,
            maxContentFiles: 24,
          });
          const updated = await upsertCintGitHubConnection({
            ...conn,
            selectedRepo: fullName,
            defaultBranch: synced.defaultBranch,
            lastSyncedAt: new Date().toISOString(),
            syncCommitSha: synced.commitSha,
            syncFileCount: synced.tree.files.length,
          });

          await cintEntityStore.upsert("repositories", {
            id: `repo_${fullName.replace(/[^\w.-]+/g, "_")}`,
            name: fullName,
            url: synced.htmlUrl,
            provider: "github_read",
            lastSyncedAt: updated.lastSyncedAt,
            defaultBranch: synced.defaultBranch,
            commitSha: synced.commitSha,
            fileCount: synced.tree.files.length,
            tree: synced.tree,
          });

          const liveIndex = connectionToLiveIndexEvidence(updated);
          const metadataPersisted = await persistCintProjectLiveIndexMetadata(projectId, liveIndex);
          return Response.json({
            ok: true,
            repository: fullName,
            commitSha: synced.commitSha,
            defaultBranch: synced.defaultBranch,
            fileCount: synced.tree.files.length,
            liveIndex,
            metadataPersisted,
            /** Client / factory can merge when project id is a deploy slug. */
            metadataStamp: { [CINT_LIVE_INDEX_KEY]: liveIndex },
          });
        } catch (e) {
          return Response.json(
            { ok: false, error: e instanceof Error ? e.message : "sync_failed" },
            { status: 500 },
          );
        }
      }),
    },
  },
});
