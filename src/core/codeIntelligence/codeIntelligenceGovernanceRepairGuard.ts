/**
 * cint.governance.repair.guard.v1 — Phase 19 Self-Healing Governance.
 *
 * Prevent repairs from creating new damage.
 * Flow: Repair Proposed → Evidence → Governance → Impact → Risk → Approval → Repair.
 * Extends existing gates + recovery — does NOT invent a parallel Repair pipeline.
 * Requires Phase 18 Architecture Intelligence sealed.
 */

import { isCodeIntelligenceArchitectureIntelligenceSealed } from "@/core/codeIntelligence/codeIntelligenceArchitectureIntelligence";
import { isCodeIntelligenceEvidenceGateSealed } from "@/core/codeIntelligence/codeIntelligenceEvidenceEnforcement";
import { isCodeIntelligenceGovernanceGatesSealed } from "@/core/codeIntelligence/codeIntelligenceGovernanceGates";
import { isCodeIntelligenceImpactAnalysisSealed } from "@/core/codeIntelligence/codeIntelligenceImpactAnalysis";
import { isCodeIntelligencePredictiveRiskSealed } from "@/core/codeIntelligence/codeIntelligencePredictiveRisk";
import {
  assertMutateAllowed,
  isCodeIntelligenceRollbackEngineSealed,
} from "@/core/codeIntelligence/codeIntelligenceRollbackEngine";
import type { ImpactRiskLevel } from "@/core/codeIntelligence/codeIntelligenceImpactAnalysis";

export const CINT_GOVERNANCE_REPAIR_GUARD_KEY = "cint.governance.repair.guard.v1" as const;
export const CINT_GOVERNANCE_REPAIR_GUARD_VERSION = "CINT-GRG-1.0" as const;

export type RepairGuardStage =
  | "proposed"
  | "evidence_review"
  | "governance_review"
  | "impact_analysis"
  | "risk_review"
  | "approval"
  | "repair";

export type RepairGuardEvaluation = Readonly<{
  allowed: boolean;
  failedStage: RepairGuardStage | null;
  stagesPassed: readonly RepairGuardStage[];
  blockers: readonly string[];
  rule: "No repair executes without passing all gates";
}>;

export type CodeIntelligenceGovernanceRepairGuardAuthority = Readonly<{
  version: "cint.governance.repair.guard.v1";
  sealed: boolean;
  sealedAt: string | null;
  guardVersion: typeof CINT_GOVERNANCE_REPAIR_GUARD_VERSION;
  inventPages: false;
  requiredFlow: readonly RepairGuardStage[];
  rule: "No repair executes without passing all gates";
  constitution: readonly string[];
}>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export const CINT_REPAIR_GUARD_FLOW: readonly RepairGuardStage[] = [
  "proposed",
  "evidence_review",
  "governance_review",
  "impact_analysis",
  "risk_review",
  "approval",
  "repair",
] as const;

export function buildCodeIntelligenceGovernanceRepairGuardAuthority(options?: {
  sealed?: boolean;
}): CodeIntelligenceGovernanceRepairGuardAuthority {
  const sealed = options?.sealed === true;
  return {
    version: "cint.governance.repair.guard.v1",
    sealed,
    sealedAt: sealed ? new Date().toISOString() : null,
    guardVersion: CINT_GOVERNANCE_REPAIR_GUARD_VERSION,
    inventPages: false,
    requiredFlow: CINT_REPAIR_GUARD_FLOW,
    rule: "No repair executes without passing all gates",
    constitution: [
      "Phase 19 — Self-Healing Governance after Architecture Intelligence (Phase 18)",
      "Does not replace Replica Repair workflow — adds CI mutate gate only",
      "Requires recovery point + L4/L5 human approval for execute",
      "Connector freeze remains ON",
      "inventPages=false",
    ],
  };
}

export function evaluateRepairGuard(input: {
  metadata?: unknown;
  humanApproved?: boolean;
  recoverySnapshotId?: string | null;
  impactRisk?: ImpactRiskLevel | null;
}): RepairGuardEvaluation {
  const stagesPassed: RepairGuardStage[] = ["proposed"];
  const blockers: string[] = [];

  if (!isCodeIntelligenceGovernanceRepairGuardSealed(input.metadata)) {
    return {
      allowed: false,
      failedStage: "proposed",
      stagesPassed: [],
      blockers: ["CINT_REPAIR_GUARD_UNSEALED"],
      rule: "No repair executes without passing all gates",
    };
  }

  if (!isCodeIntelligenceEvidenceGateSealed(input.metadata)) {
    blockers.push("EVIDENCE_GATE_REQUIRED");
    return {
      allowed: false,
      failedStage: "evidence_review",
      stagesPassed,
      blockers,
      rule: "No repair executes without passing all gates",
    };
  }
  stagesPassed.push("evidence_review");

  if (!isCodeIntelligenceGovernanceGatesSealed(input.metadata)) {
    blockers.push("GOVERNANCE_GATES_REQUIRED");
    return {
      allowed: false,
      failedStage: "governance_review",
      stagesPassed,
      blockers,
      rule: "No repair executes without passing all gates",
    };
  }
  stagesPassed.push("governance_review");

  if (!isCodeIntelligenceImpactAnalysisSealed(input.metadata)) {
    blockers.push("IMPACT_ANALYSIS_REQUIRED");
    return {
      allowed: false,
      failedStage: "impact_analysis",
      stagesPassed,
      blockers,
      rule: "No repair executes without passing all gates",
    };
  }
  if (input.impactRisk === "CRITICAL" && !input.humanApproved) {
    blockers.push("CRITICAL_IMPACT_REQUIRES_HUMAN");
    return {
      allowed: false,
      failedStage: "impact_analysis",
      stagesPassed,
      blockers,
      rule: "No repair executes without passing all gates",
    };
  }
  stagesPassed.push("impact_analysis");

  if (!isCodeIntelligencePredictiveRiskSealed(input.metadata)) {
    blockers.push("PREDICTIVE_RISK_REQUIRED");
    return {
      allowed: false,
      failedStage: "risk_review",
      stagesPassed,
      blockers,
      rule: "No repair executes without passing all gates",
    };
  }
  stagesPassed.push("risk_review");

  if (!input.humanApproved) {
    blockers.push("HUMAN_APPROVAL_REQUIRED");
    return {
      allowed: false,
      failedStage: "approval",
      stagesPassed,
      blockers,
      rule: "No repair executes without passing all gates",
    };
  }
  stagesPassed.push("approval");

  if (!isCodeIntelligenceRollbackEngineSealed(input.metadata)) {
    blockers.push("RECOVERY_REQUIRED");
    return {
      allowed: false,
      failedStage: "repair",
      stagesPassed,
      blockers,
      rule: "No repair executes without passing all gates",
    };
  }
  const mutate = assertMutateAllowed({
    metadata: input.metadata,
    operation: "repair",
    recoverySnapshotId: input.recoverySnapshotId,
  });
  if (!mutate.allowed) {
    blockers.push(mutate.reason);
    return {
      allowed: false,
      failedStage: "repair",
      stagesPassed,
      blockers,
      rule: "No repair executes without passing all gates",
    };
  }
  stagesPassed.push("repair");

  return {
    allowed: true,
    failedStage: null,
    stagesPassed,
    blockers: [],
    rule: "No repair executes without passing all gates",
  };
}

export function sealCodeIntelligenceGovernanceRepairGuard(metadata: unknown): {
  metadata: Record<string, unknown>;
  guard: CodeIntelligenceGovernanceRepairGuardAuthority;
  blockedReason?: string;
} {
  const base = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  if (!isCodeIntelligenceArchitectureIntelligenceSealed(base)) {
    return {
      metadata: base,
      guard: buildCodeIntelligenceGovernanceRepairGuardAuthority({ sealed: false }),
      blockedReason:
        "Phase 18 Architecture Intelligence must be sealed before Phase 19 Repair Guard.",
    };
  }
  const guard = buildCodeIntelligenceGovernanceRepairGuardAuthority({ sealed: true });
  base[CINT_GOVERNANCE_REPAIR_GUARD_KEY] = guard;
  return { metadata: base, guard };
}

export function readCodeIntelligenceGovernanceRepairGuard(
  metadata?: unknown,
): CodeIntelligenceGovernanceRepairGuardAuthority | null {
  const block = asRecord(asRecord(metadata)?.[CINT_GOVERNANCE_REPAIR_GUARD_KEY]);
  if (!block || block.version !== "cint.governance.repair.guard.v1") return null;
  return block as CodeIntelligenceGovernanceRepairGuardAuthority;
}

export function isCodeIntelligenceGovernanceRepairGuardSealed(metadata?: unknown): boolean {
  const g = readCodeIntelligenceGovernanceRepairGuard(metadata);
  return Boolean(g?.sealed && g.sealedAt);
}

export function detectCodeIntelligenceGovernanceRepairGuardSealIntent(text: string): boolean {
  const t = text.toLowerCase();
  return (
    /\bphase\s*19\b/.test(t) ||
    /\bself-?healing governance\b/.test(t) ||
    /\brepair guard\b/.test(t) ||
    /\bcint\.governance\.repair\.guard\.v1\b/.test(t)
  );
}

export function formatCodeIntelligenceGovernanceRepairGuardSummaryLines(
  guard: CodeIntelligenceGovernanceRepairGuardAuthority,
): string[] {
  return [
    `${guard.sealed ? "✓" : "○"} Repair Guard ${guard.guardVersion} (${CINT_GOVERNANCE_REPAIR_GUARD_KEY})`,
    `○ Flow: ${guard.requiredFlow.join(" → ")}`,
    `○ Rule: ${guard.rule}`,
  ];
}
