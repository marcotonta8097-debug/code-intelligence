import { createFileRoute } from "@tanstack/react-router";
import { withSentryApiRoute } from "@/lib/monitoring/withSentryApiRoute";
import { analyzeCodeIntelligenceSnapshot } from "@/core/codeIntelligence/codeIntelligenceAnalysis";
import {
  isCodeIntelligenceAgentRuntimeSealed,
  runCodeIntelligenceLiveAgentPass,
} from "@/core/codeIntelligence/codeIntelligenceAgentRuntime";
import {
  loadCintProjectMetadata,
  loadCintSyncedTree,
  persistCintAnalysisResults,
  serializeCintAnalysisForClient,
} from "@/lib/cint/cintLiveWorkspace";
import {
  enforceRateLimitPlaceholder,
  isProduction,
  serverLogError,
} from "@/serverFns/security.server";

const PATH = "/api/projects/$projectId/cint/agents/run";

export const Route = createFileRoute("/api/projects/$projectId/cint/agents/run")({
  server: {
    handlers: {
      POST: withSentryApiRoute(PATH, async ({ request, params }) => {
        const projectId = params?.projectId?.trim();
        if (!projectId) {
          return Response.json({ ok: false, error: "missing_project" }, { status: 400 });
        }
        try {
          await enforceRateLimitPlaceholder(`cint-agents:${projectId}`, "project:cint");
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
                error: "No synced repository tree. Sync a GitHub repo before running live agents.",
              },
              { status: 409 },
            );
          }

          const startedAt = Date.now();
          const metadata = await loadCintProjectMetadata(projectId);
          const runtimeSealed = isCodeIntelligenceAgentRuntimeSealed(metadata);

          if (runtimeSealed) {
            const pass = runCodeIntelligenceLiveAgentPass({
              metadata,
              tree: loaded.tree,
            });
            if (pass.blockedReason) {
              return Response.json(
                { ok: false, code: "cint_agents_blocked", error: pass.blockedReason },
                { status: 409 },
              );
            }
            const persistQueued = body.persist !== false && !!pass.analysis;
            if (persistQueued && pass.analysis) {
              void persistCintAnalysisResults({
                repository: loaded.repository,
                commitSha: loaded.commitSha,
                analysis: pass.analysis,
              }).catch(() => {});
            }
            return Response.json({
              ok: true,
              live: true,
              mode: "governed_agents",
              repository: loaded.repository,
              commitSha: loaded.commitSha,
              fileCount: loaded.tree.files.length,
              durationMs: Date.now() - startedAt,
              persistQueued,
              agents: pass.results.map((r) => ({
                agentId: r.agentId,
                ok: r.ok,
                level: r.level,
                summary: r.summary,
                blockers: r.blockers,
                engine: r.engine,
              })),
              analysis: pass.analysis
                ? serializeCintAnalysisForClient(pass.analysis, {
                    runId: `A-${startedAt.toString(36)}`,
                  })
                : null,
              result: pass.analysis
                ? serializeCintAnalysisForClient(pass.analysis, {
                    runId: `A-${startedAt.toString(36)}`,
                  })
                : null,
              counts: pass.analysis
                ? {
                    findings: pass.analysis.findings.length,
                    evidence: pass.analysis.evidence.length,
                    investigations: pass.analysis.investigations.length,
                    remediations: pass.analysis.remediations.length,
                  }
                : undefined,
              okCount: pass.results.filter((r) => r.ok).length,
              blockedCount: pass.results.filter((r) => !r.ok).length,
            });
          }

          // Engine pass when seals not yet on project row — still real tree analysis (not demo).
          const analysis = analyzeCodeIntelligenceSnapshot(loaded.tree);
          const persistQueued = body.persist !== false;
          if (persistQueued) {
            void persistCintAnalysisResults({
              repository: loaded.repository,
              commitSha: loaded.commitSha,
              analysis,
            }).catch(() => {});
          }
          return Response.json({
            ok: true,
            live: true,
            mode: "engine_pass",
            note:
              "Agent government runtime not sealed on project metadata — ran live engine pass on synced tree. Seal agent runtime in factory for governed L1–L6 dispatch.",
            repository: loaded.repository,
            commitSha: loaded.commitSha,
            fileCount: loaded.tree.files.length,
            persistQueued,
            counts: {
              findings: analysis.findings.length,
              evidence: analysis.evidence.length,
              investigations: analysis.investigations.length,
              remediations: analysis.remediations.length,
            },
            durationMs: Date.now() - startedAt,
            agents: [
              {
                agentId: "repository_intelligence",
                ok: true,
                level: "L1",
                summary: `Profiled ${analysis.intelligence.profile.fileCount} files`,
                blockers: [],
                engine: "repositoryIntelligenceEngine",
              },
              {
                agentId: "finding_engine",
                ok: true,
                level: "L2",
                summary: `${analysis.findings.length} findings`,
                blockers: [],
                engine: "findingEngine",
              },
              {
                agentId: "evidence_explorer",
                ok: true,
                level: "L2",
                summary: `${analysis.evidence.length} evidence records`,
                blockers: [],
                engine: "evidenceExplorer",
              },
              {
                agentId: "investigation_engine",
                ok: true,
                level: "L3",
                summary: `${analysis.investigations.length} investigations`,
                blockers: [],
                engine: "investigationEngine",
              },
              {
                agentId: "remediation_engine",
                ok: true,
                level: "L3",
                summary: `${analysis.remediations.length} remediation proposals`,
                blockers: [],
                engine: "remediationEngine",
              },
            ],
            analysis: serializeCintAnalysisForClient(analysis, {
              runId: `A-${startedAt.toString(36)}`,
            }),
            result: serializeCintAnalysisForClient(analysis, {
              runId: `A-${startedAt.toString(36)}`,
            }),
            okCount: 5,
            blockedCount: 0,
          });
        } catch (error) {
          if (!isProduction()) {
            serverLogError(
              "projects/cint/agents/run",
              error instanceof Error ? error.message : String(error),
            );
          }
          return Response.json(
            { ok: false, error: error instanceof Error ? error.message : "agents_failed" },
            { status: 500 },
          );
        }
      }),
    },
  },
});
