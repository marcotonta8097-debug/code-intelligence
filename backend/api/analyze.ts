import { createFileRoute } from "@tanstack/react-router";
import { withSentryApiRoute } from "@/lib/monitoring/withSentryApiRoute";
import { analyzeCodeIntelligenceSnapshot } from "@/core/codeIntelligence/codeIntelligenceAnalysis";
import {
  loadCintSyncedTree,
  persistCintAnalysisResults,
  serializeCintAnalysisForClient,
} from "@/lib/cint/cintLiveWorkspace";
import {
  enforceRateLimitPlaceholder,
  isProduction,
  serverLogError,
} from "@/serverFns/security.server";

const PATH = "/api/projects/$projectId/cint/analyze";

export const Route = createFileRoute("/api/projects/$projectId/cint/analyze")({
  server: {
    handlers: {
      POST: withSentryApiRoute(PATH, async ({ request, params }) => {
        const projectId = params?.projectId?.trim();
        if (!projectId) {
          return Response.json({ ok: false, error: "missing_project" }, { status: 400 });
        }
        try {
          await enforceRateLimitPlaceholder(`cint-analyze:${projectId}`, "project:cint");
          const body = (await request.json().catch(() => ({}))) as {
            repository?: string;
            persist?: boolean;
          };
          const loaded = await loadCintSyncedTree(projectId, body.repository);
          if (!loaded) {
            return Response.json(
              {
                ok: false,
                code: "cint_no_live_tree",
                error:
                  "No synced repository tree. Connect GitHub and Sync owner/repo first (Repositories page).",
              },
              { status: 409 },
            );
          }

          const startedAt = Date.now();
          const analysis = analyzeCodeIntelligenceSnapshot(loaded.tree);
          const analyzeMs = Date.now() - startedAt;
          const counts = {
            findings: analysis.findings.length,
            evidence: analysis.evidence.length,
            investigations: analysis.investigations.length,
            remediations: analysis.remediations.length,
          };
          // Persist must not block the client response — sequential Supabase writes
          // were hanging the UI past 90–120s with zero findings delivered.
          const persist = body.persist !== false;
          const runId = `A-${Date.now().toString(36)}`;
          const durationMs = Date.now() - startedAt;
          if (persist) {
            void persistCintAnalysisResults({
              repository: loaded.repository,
              commitSha: loaded.commitSha,
              analysis,
              runId,
              durationMs,
              state: "COMPLETED",
            }).catch((persistErr) => {
              if (!isProduction()) {
                serverLogError(
                  "projects/cint/analyze persist",
                  persistErr instanceof Error ? persistErr.message : String(persistErr),
                );
              }
            });
          }

          return Response.json({
            ok: true,
            live: true,
            demo: false,
            repository: loaded.repository,
            commitSha: loaded.commitSha,
            defaultBranch: loaded.defaultBranch,
            fileCount: loaded.tree.files.length,
            durationMs,
            analyzeMs,
            persistQueued: persist,
            counts,
            result: serializeCintAnalysisForClient(analysis, { runId }),
            runId,
            state: "COMPLETED",
          });
        } catch (error) {
          if (!isProduction()) {
            serverLogError(
              "projects/cint/analyze",
              error instanceof Error ? error.message : String(error),
            );
          }
          return Response.json(
            { ok: false, error: error instanceof Error ? error.message : "analyze_failed" },
            { status: 500 },
          );
        }
      }),
    },
  },
});
