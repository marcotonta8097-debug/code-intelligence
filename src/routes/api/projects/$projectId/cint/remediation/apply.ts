import { createFileRoute } from "@tanstack/react-router";
import { withSentryApiRoute } from "@/lib/monitoring/withSentryApiRoute";
import { getCintGitHubConnection } from "@/lib/cint/cintGitHubConnectionStore";
import { applyCintGitHubPullRequest } from "@/lib/cint/cintGitHubRepoOps";
import { cintEntityStore } from "@/lib/cint/cintEntityStore";
import { isCintAuthConfigured } from "@/lib/cint/cintAuthService";
import { requireCintProductAuth } from "@/lib/cint/requireCintProductAuth";
import {
  enforceRateLimitPlaceholder,
  isProduction,
  serverLogError,
} from "@/serverFns/security.server";

const PATH = "/api/projects/$projectId/cint/remediation/apply";

export const Route = createFileRoute("/api/projects/$projectId/cint/remediation/apply")({
  server: {
    handlers: {
      POST: withSentryApiRoute(PATH, async ({ request, params }) => {
        const projectId = params?.projectId?.trim();
        if (!projectId) {
          return Response.json({ ok: false, error: "missing_project" }, { status: 400 });
        }
        try {
          await enforceRateLimitPlaceholder(`cint-apply:${projectId}`, "project:cint");

          // B1: when IdP is configured, Approve requires remediation.approve (Admin/Architect).
          // When IdP is absent, keep L4/L5 human gate only (honest interactive_prototype).
          let actorRole: string | undefined;
          if (isCintAuthConfigured()) {
            const gate = await requireCintProductAuth(request, "remediation.approve");
            if (!gate.ok) return gate.response;
            actorRole = gate.session.role;
          } else if (isProduction()) {
            return Response.json(
              {
                ok: false,
                code: "cint_auth_not_configured",
                error:
                  "Production remediation approve requires Code Intelligence IdP (CINT_SUPABASE_URL + anon key).",
              },
              { status: 503 },
            );
          }

          const body = (await request.json().catch(() => ({}))) as {
            humanApproved?: boolean;
            recoverySnapshotId?: string;
            findingId?: string;
            proposal?: string;
            title?: string;
            files?: Array<{ path: string; content: string }>;
            repository?: string;
            branchName?: string;
          };

          if (!body.humanApproved) {
            return Response.json(
              { ok: false, error: "L4_L5_HUMAN_REQUIRED", code: "L4_L5_HUMAN_AND_RECOVERY_REQUIRED" },
              { status: 403 },
            );
          }
          if (!body.recoverySnapshotId?.trim()) {
            return Response.json(
              {
                ok: false,
                error: "recovery_snapshot_required",
                code: "L4_L5_HUMAN_AND_RECOVERY_REQUIRED",
              },
              { status: 403 },
            );
          }
          const files = Array.isArray(body.files)
            ? body.files.filter((f) => f?.path && typeof f.content === "string")
            : [];
          if (!files.length) {
            return Response.json(
              { ok: false, error: "files_required", detail: "Provide at least one path/content patch" },
              { status: 400 },
            );
          }

          const conn = await getCintGitHubConnection(projectId);
          if (!conn?.accessToken) {
            return Response.json(
              { ok: false, error: "not_connected", code: "cint_github_not_connected" },
              { status: 401 },
            );
          }
          const fullName = (body.repository || conn.selectedRepo || "").trim();
          if (!fullName.includes("/")) {
            return Response.json(
              { ok: false, error: "repository_required" },
              { status: 400 },
            );
          }

          const branchName =
            body.branchName?.trim() ||
            `cint/remediation-${Date.now().toString(36)}`;
          const title =
            body.title?.trim() ||
            body.proposal?.trim() ||
            `CI remediation: ${files[0]!.path}`;
          const pr = await applyCintGitHubPullRequest(conn.accessToken, fullName, {
            branchName,
            title,
            body: [
              "Opened by Code Intelligence Remediation Engineer.",
              body.findingId ? `Finding: ${body.findingId}` : null,
              body.proposal ? `Proposal: ${body.proposal}` : null,
              `Recovery snapshot: ${body.recoverySnapshotId}`,
              "Requires human merge review.",
            ]
              .filter(Boolean)
              .join("\n\n"),
            files,
            commitMessage: title.slice(0, 72),
          });

          const record = await cintEntityStore.create("remediation", {
            findingId: body.findingId || "authorized",
            proposal: body.proposal || title,
            risk: "HIGH",
            approvalLevel: "L4",
            humanApprovalId: "human_operator",
            executionStatus: "applied",
            writesSource: true,
            recoverySnapshotId: body.recoverySnapshotId,
            appliedAt: new Date().toISOString(),
            agentId: "remediation_engineer",
            prUrl: pr.prUrl,
            prNumber: pr.prNumber,
            branch: pr.branch,
            commitSha: pr.commitSha,
            repository: fullName,
          });

          return Response.json({
            ok: true,
            writesSource: true,
            neverWritesSource: false,
            remediationId: record.id,
            prUrl: pr.prUrl,
            prNumber: pr.prNumber,
            branch: pr.branch,
            commitSha: pr.commitSha,
            repository: fullName,
            actorRole: actorRole || null,
          });
        } catch (error) {
          if (!isProduction()) {
            serverLogError(
              "projects/cint/remediation/apply",
              error instanceof Error ? error.message : String(error),
            );
          }
          return Response.json(
            { ok: false, error: error instanceof Error ? error.message : "apply_failed" },
            { status: 500 },
          );
        }
      }),
    },
  },
});
