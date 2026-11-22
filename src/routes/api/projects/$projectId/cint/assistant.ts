import { createFileRoute } from "@tanstack/react-router";
import { withSentryApiRoute } from "@/lib/monitoring/withSentryApiRoute";
import type {
  CintAssistantGroundingDep,
  CintAssistantGroundingEvidence,
  CintAssistantGroundingFinding,
} from "@/lib/cint/cintAssistantGrounding";
import { completeCintAssistantChat } from "@/lib/cint/cintLlmChat";
import { isCintLlmConfigured, CINT_LLM_NOT_CONFIGURED_CODE } from "@/lib/cint/cintLlmConfig";
import {
  enforceRateLimitPlaceholder,
  isProduction,
  serverLogError,
} from "@/serverFns/security.server";

const PATH = "/api/projects/$projectId/cint/assistant";

export const Route = createFileRoute("/api/projects/$projectId/cint/assistant")({
  server: {
    handlers: {
      POST: withSentryApiRoute(PATH, async ({ request, params }) => {
        const projectId = params?.projectId?.trim();
        if (!projectId) {
          return Response.json({ ok: false, error: "missing_project" }, { status: 400 });
        }
        if (!isCintLlmConfigured()) {
          return Response.json(
            {
              ok: false,
              code: CINT_LLM_NOT_CONFIGURED_CODE,
              error: "Set CINT_ANTHROPIC_API_KEY (preferred) or CINT_LLM_API_KEY on the host.",
            },
            { status: 503 },
          );
        }
        try {
          await enforceRateLimitPlaceholder(`cint-assistant:${projectId}`, "project:cint");
          const body = (await request.json().catch(() => ({}))) as {
            question?: string;
            q?: string;
            repository?: string;
            commitSha?: string;
            contextNotes?: string;
            grounding?: {
              repository?: string;
              commitSha?: string;
              contextNotes?: string;
              findings?: unknown[];
              evidence?: unknown[];
              dependencies?: unknown[];
              analysisId?: string;
              live?: boolean;
            };
            findings?: unknown[];
            evidence?: unknown[];
            dependencies?: unknown[];
            analysisId?: string;
            live?: boolean;
          };
          const question = (body.question || body.q || "").trim();
          if (!question) {
            return Response.json({ ok: false, error: "question_required" }, { status: 400 });
          }
          const grounding = {
            repository: body.grounding?.repository ?? body.repository,
            commitSha: body.grounding?.commitSha ?? body.commitSha,
            contextNotes: body.grounding?.contextNotes ?? body.contextNotes,
            findings: (body.grounding?.findings ?? body.findings) as
              | CintAssistantGroundingFinding[]
              | undefined,
            evidence: (body.grounding?.evidence ?? body.evidence) as
              | CintAssistantGroundingEvidence[]
              | undefined,
            dependencies: (body.grounding?.dependencies ?? body.dependencies) as
              | CintAssistantGroundingDep[]
              | undefined,
            analysisId: body.grounding?.analysisId ?? body.analysisId,
            live: body.grounding?.live ?? body.live,
          };
          const result = await completeCintAssistantChat({
            question,
            repository: body.repository,
            commitSha: body.commitSha,
            contextNotes: body.contextNotes,
            grounding,
          });
          if (!result.ok) {
            return Response.json(
              { ok: false, code: result.code, error: result.message },
              { status: result.status && result.status >= 400 ? result.status : 502 },
            );
          }
          return Response.json({
            ok: true,
            answer: result.text,
            provider: result.provider,
            model: result.model,
            grounded: result.grounded,
            projectId,
            live: true,
          });
        } catch (error) {
          if (!isProduction()) {
            serverLogError(
              "projects/cint/assistant",
              error instanceof Error ? error.message : String(error),
            );
          }
          return Response.json({ ok: false, error: "assistant_failed" }, { status: 500 });
        }
      }),
    },
  },
});
