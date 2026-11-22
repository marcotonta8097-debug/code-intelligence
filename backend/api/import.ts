import { createFileRoute } from "@tanstack/react-router";
import { withSentryApiRoute } from "@/lib/monitoring/withSentryApiRoute";
import { cintEntityStore } from "@/lib/cint/cintEntityStore";
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
import {
  assessCintIngressEgressReadiness,
  ingestLocalSnapshotTree,
  registerCintUpload,
} from "@/lib/cint/cintIngressEgressPipeline";
import { selfLoadCintProductSource } from "@/lib/cint/cintProductPublish";
import type { RepositoryTreeSnapshot } from "@/core/codeIntelligence/repositoryIntelligenceEngine";
import {
  enforceRateLimitPlaceholder,
  isProduction,
  serverLogError,
} from "@/serverFns/security.server";

const PATH = "/api/projects/$projectId/cint/import";

export const Route = createFileRoute("/api/projects/$projectId/cint/import")({
  server: {
    handlers: {
      GET: withSentryApiRoute(PATH, async ({ params }) => {
        const projectId = params?.projectId?.trim();
        if (!projectId) {
          return Response.json({ ok: false, error: "missing_project" }, { status: 400 });
        }
        return Response.json({
          ok: true,
          readiness: assessCintIngressEgressReadiness(),
          providers: {
            github: "oauth_required",
            local_snapshot: "live_offline",
            local_repository: "live_offline",
            zip_upload: "register_plus_optional_local_extract",
            json: "bundle_rows",
            cint_product: "standalone_product_self_load",
          },
        });
      }),
      POST: withSentryApiRoute(PATH, async ({ request, params }) => {
        const projectId = params?.projectId?.trim();
        if (!projectId) {
          return Response.json({ ok: false, error: "missing_project" }, { status: 400 });
        }
        try {
          await enforceRateLimitPlaceholder(`cint-import:${projectId}`, "project:cint");
          const body = (await request.json().catch(() => ({}))) as {
            provider?: string;
            source?: string;
            repository?: string;
            repositoryId?: string;
            branch?: string;
            filename?: string;
            tree?: RepositoryTreeSnapshot;
            bundle?: {
              findings?: Record<string, unknown>[];
              evidence?: Record<string, unknown>[];
              investigations?: Record<string, unknown>[];
              remediation?: Record<string, unknown>[];
              repositories?: Record<string, unknown>[];
            };
          };

          const provider = (body.provider || "github").toLowerCase();
          const sourceRaw = (body.source || body.repository || body.repositoryId || "").trim();

          if (provider === "github" || provider === "github_read") {
            const source = normalizeCintGitHubFullName(sourceRaw);
            if (!source) {
              return Response.json(
                {
                  ok: false,
                  error: "repository_required",
                  detail: "Import GitHub with owner/repo or https://github.com/owner/repo",
                },
                { status: 400 },
              );
            }
            const conn = await getCintGitHubConnection(projectId);
            if (!conn?.accessToken) {
              return Response.json(
                {
                  ok: false,
                  code: "cint_github_not_connected",
                  error: "Connect GitHub OAuth before importing a repository",
                  readiness: assessCintIngressEgressReadiness(),
                },
                { status: 401 },
              );
            }
            const synced = await syncCintGitHubRepositoryTree(conn.accessToken, source);
            const updated = await upsertCintGitHubConnection({
              ...conn,
              selectedRepo: source,
              defaultBranch: synced.defaultBranch,
              lastSyncedAt: new Date().toISOString(),
              syncCommitSha: synced.commitSha,
              syncFileCount: synced.tree.files.length,
            });
            await cintEntityStore.upsert("repositories", {
              id: `repo_${source.replace(/[^\w.-]+/g, "_")}`,
              name: source,
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
              live: true,
              provider: "github_read",
              repository: source,
              commitSha: synced.commitSha,
              fileCount: synced.tree.files.length,
              liveIndex,
              metadataPersisted,
              metadataStamp: { [CINT_LIVE_INDEX_KEY]: liveIndex },
              readiness: assessCintIngressEgressReadiness(),
            });
          }

          if (
            provider === "cint_product" ||
            provider === "code_intelligence" ||
            provider === "cint_self"
          ) {
            const result = await selfLoadCintProductSource(projectId);
            return Response.json({
              ...result,
              live: true,
              provider: "cint_product",
              readiness: assessCintIngressEgressReadiness(),
            });
          }

          if (
            provider === "local_snapshot" ||
            provider === "local_repository" ||
            provider === "local"
          ) {
            const repositoryId = (body.repositoryId || sourceRaw || "payments-api").trim();
            const result = await ingestLocalSnapshotTree({
              projectId,
              repositoryId,
              tree: body.tree,
            });
            return Response.json({
              ...result,
              live: true,
              provider: "local_snapshot",
              readiness: assessCintIngressEgressReadiness(),
            });
          }

          if (provider === "zip_upload") {
            const filename = (body.filename || sourceRaw || "archive.zip").trim() || "archive.zip";
            const upload = registerCintUpload({
              projectId,
              kind: "zip",
              filename,
            });
            const repositoryId = (body.repositoryId || "").trim();
            if (repositoryId || body.tree) {
              const extracted = await ingestLocalSnapshotTree({
                projectId,
                repositoryId: repositoryId || "payments-api",
                tree: body.tree,
              });
              return Response.json({
                ok: true,
                live: true,
                provider: "zip_upload",
                upload,
                extracted: true,
                repository: extracted.repository,
                commitSha: extracted.commitSha,
                fileCount: extracted.fileCount,
                liveIndex: extracted.liveIndex,
                metadataPersisted: extracted.metadataPersisted,
                metadataStamp: extracted.metadataStamp,
                readiness: assessCintIngressEgressReadiness(),
              });
            }
            return Response.json({
              ok: true,
              live: true,
              provider: "zip_upload",
              upload,
              extracted: false,
              detail:
                "ZIP registered on upload ledger. Pass repositoryId (e.g. payments-api) or tree to extract without GitHub OAuth.",
              readiness: assessCintIngressEgressReadiness(),
            });
          }

          if (provider === "json" || provider === "bundle") {
            const bundle = body.bundle || {};
            let imported = 0;
            for (const [table, rows] of [
              ["repositories", bundle.repositories],
              ["findings", bundle.findings],
              ["evidence", bundle.evidence],
              ["investigations", bundle.investigations],
              ["remediation", bundle.remediation],
            ] as const) {
              for (const row of rows || []) {
                if (!row || typeof row !== "object") continue;
                await cintEntityStore.create(table, row as Record<string, unknown>);
                imported += 1;
              }
            }
            return Response.json({
              ok: true,
              live: true,
              provider: "json",
              imported,
              readiness: assessCintIngressEgressReadiness(),
            });
          }

          return Response.json(
            {
              ok: false,
              error: "unsupported_provider",
              detail:
                "Use provider=github | cint_product | local_snapshot | local_repository | zip_upload | json",
              readiness: assessCintIngressEgressReadiness(),
            },
            { status: 400 },
          );
        } catch (error) {
          if (!isProduction()) {
            serverLogError(
              "projects/cint/import",
              error instanceof Error ? error.message : String(error),
            );
          }
          return Response.json(
            { ok: false, error: error instanceof Error ? error.message : "import_failed" },
            { status: 500 },
          );
        }
      }),
    },
  },
});
