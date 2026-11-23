/**
 * cint.operations.center.v1 — Phase 20 Platform Operations Centre.
 *
 * Single command dashboard report over sealed CI telemetry.
 * Presentation only — inventPages=false; does not invent Ops page into FPT.
 * Requires Phase 19 Repair Guard sealed.
 */

import { isCodeIntelligenceGovernanceRepairGuardSealed } from "@/core/codeIntelligence/codeIntelligenceGovernanceRepairGuard";
import { readCodeIntelligenceSealValidation } from "@/core/codeIntelligence/codeIntelligenceSealValidation";
import { readCodeIntelligenceTrustEngine } from "@/core/codeIntelligence/codeIntelligenceTrustEngine";
import { readCodeIntelligencePredictiveRisk } from "@/core/codeIntelligence/codeIntelligencePredictiveRisk";
import { readCodeIntelligenceMemoryEngine } from "@/core/codeIntelligence/codeIntelligenceMemoryEngine";
import { readCodeIntelligenceAuditEmergency } from "@/core/codeIntelligence/codeIntelligenceAuditEmergency";
import { isCodeIntelligenceGovernanceGatesSealed } from "@/core/codeIntelligence/codeIntelligenceGovernanceGates";
import { isCodeIntelligenceEvidenceGateSealed } from "@/core/codeIntelligence/codeIntelligenceEvidenceEnforcement";
import { isCodeIntelligenceRollbackEngineSealed } from "@/core/codeIntelligence/codeIntelligenceRollbackEngine";
import { isCodeIntelligenceArchitectureIntelligenceSealed } from "@/core/codeIntelligence/codeIntelligenceArchitectureIntelligence";
import type { ImpactRiskLevel } from "@/core/codeIntelligence/codeIntelligenceImpactAnalysis";

export const CINT_OPERATIONS_CENTER_KEY = "cint.operations.center.v1" as const;
export const CINT_OPERATIONS_CENTER_VERSION = "CINT-OPS-1.0" as const;

export type PlatformHealthStatus = "HEALTHY" | "DEGRADED" | "CRITICAL" | "UNKNOWN";

export type OperationsCenterExecutiveSummary = Readonly<{
  platformStatus: PlatformHealthStatus;
  trust: number;
  risk: ImpactRiskLevel;
  outstandingIssues: number;
  failedVerifications: number;
}>;

export type CodeIntelligenceOperationsCenterAuthority = Readonly<{
  version: "cint.operations.center.v1";
  sealed: boolean;
  sealedAt: string | null;
  opsVersion: typeof CINT_OPERATIONS_CENTER_VERSION;
  inventPages: false;
  panels: readonly string[];
  executive: OperationsCenterExecutiveSummary;
  rule: "Ops Centre aggregates sealed telemetry — not a new truth or honestLabel authority";
  constitution: readonly string[];
}>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function buildOperationsExecutiveSummary(
  metadata?: unknown,
): OperationsCenterExecutiveSummary {
  const trust = readCodeIntelligenceTrustEngine(metadata)?.overallProjectTrust ?? 0;
  const seal = readCodeIntelligenceSealValidation(metadata);
  const predictive = readCodeIntelligencePredictiveRisk(metadata);
  const memory = readCodeIntelligenceMemoryEngine(metadata);
  const topProb = predictive?.signals[0]?.probability ?? 0;
  const topSev = predictive?.signals[0]?.severity ?? "LOW";
  let risk: ImpactRiskLevel = topSev;
  if (topProb >= 85 && risk === "MEDIUM") risk = "HIGH";

  const outstandingIssues =
    memory?.entries.filter((e) => e.kind === "known_issue" || e.kind === "previous_failure")
      .length ?? 0;
  const failedVerifications = seal
    ? seal.checks.filter((c) => !c.valid).length + seal.bypassAttempts.length
    : 9;

  let platformStatus: PlatformHealthStatus = "UNKNOWN";
  if (trust >= 85 && failedVerifications === 0 && risk !== "CRITICAL" && risk !== "HIGH") {
    platformStatus = "HEALTHY";
  } else if (trust >= 60 && risk !== "CRITICAL") {
    platformStatus = "DEGRADED";
  } else if (trust > 0) {
    platformStatus = "CRITICAL";
  }

  return {
    platformStatus,
    trust,
    risk,
    outstandingIssues,
    failedVerifications,
  };
}

export function buildCodeIntelligenceOperationsCenterAuthority(options?: {
  sealed?: boolean;
  metadata?: unknown;
}): CodeIntelligenceOperationsCenterAuthority {
  const sealed = options?.sealed === true;
  const executive = buildOperationsExecutiveSummary(options?.metadata);
  return {
    version: "cint.operations.center.v1",
    sealed,
    sealedAt: sealed ? new Date().toISOString() : null,
    opsVersion: CINT_OPERATIONS_CENTER_VERSION,
    inventPages: false,
    panels: [
      "System Health",
      "Trust",
      "Risk",
      "Audit",
      "Governance",
      "Repairs",
      "Evidence",
      "Memory",
      "Architecture",
    ],
    executive,
    rule: "Ops Centre aggregates sealed telemetry — not a new truth or honestLabel authority",
    constitution: [
      "Phase 20 — Operations Centre after Repair Guard (Phase 19)",
      "FEATURE report only — inventPages=false (no FPT page invent)",
      `Evidence sealed=${isCodeIntelligenceEvidenceGateSealed(options?.metadata)}`,
      `Governance sealed=${isCodeIntelligenceGovernanceGatesSealed(options?.metadata)}`,
      `Audit sealed=${Boolean(readCodeIntelligenceAuditEmergency(options?.metadata)?.sealed)}`,
      `Recovery sealed=${isCodeIntelligenceRollbackEngineSealed(options?.metadata)}`,
      `Architecture sealed=${isCodeIntelligenceArchitectureIntelligenceSealed(options?.metadata)}`,
      "Connector freeze remains ON until human lift",
    ],
  };
}

export function sealCodeIntelligenceOperationsCenter(metadata: unknown): {
  metadata: Record<string, unknown>;
  ops: CodeIntelligenceOperationsCenterAuthority;
  blockedReason?: string;
} {
  const base = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  if (!isCodeIntelligenceGovernanceRepairGuardSealed(base)) {
    return {
      metadata: base,
      ops: buildCodeIntelligenceOperationsCenterAuthority({ sealed: false, metadata: base }),
      blockedReason: "Phase 19 Repair Guard must be sealed before Phase 20 Operations Centre.",
    };
  }
  const ops = buildCodeIntelligenceOperationsCenterAuthority({ sealed: true, metadata: base });
  base[CINT_OPERATIONS_CENTER_KEY] = ops;
  return { metadata: base, ops };
}

export function readCodeIntelligenceOperationsCenter(
  metadata?: unknown,
): CodeIntelligenceOperationsCenterAuthority | null {
  const block = asRecord(asRecord(metadata)?.[CINT_OPERATIONS_CENTER_KEY]);
  if (!block || block.version !== "cint.operations.center.v1") return null;
  return block as CodeIntelligenceOperationsCenterAuthority;
}

export function isCodeIntelligenceOperationsCenterSealed(metadata?: unknown): boolean {
  const o = readCodeIntelligenceOperationsCenter(metadata);
  return Boolean(o?.sealed && o.sealedAt);
}

export function detectCodeIntelligenceOperationsCenterSealIntent(text: string): boolean {
  const t = text.toLowerCase();
  return (
    /\bphase\s*20\b/.test(t) ||
    /\boperations centre\b/.test(t) ||
    /\boperations center\b/.test(t) ||
    /\bcint\.operations\.center\.v1\b/.test(t) ||
    /\bplatform status\b/.test(t)
  );
}

export function formatCodeIntelligenceOperationsCenterSummaryLines(
  ops: CodeIntelligenceOperationsCenterAuthority,
): string[] {
  const e = ops.executive;
  return [
    `${ops.sealed ? "✓" : "○"} Operations Centre ${ops.opsVersion} (${CINT_OPERATIONS_CENTER_KEY})`,
    `○ Platform Status: ${e.platformStatus} · Trust: ${e.trust}% · Risk: ${e.risk}`,
    `○ Outstanding Issues: ${e.outstandingIssues} · Failed Verifications: ${e.failedVerifications}`,
    `○ Panels: ${ops.panels.join(" · ")}`,
  ];
}
