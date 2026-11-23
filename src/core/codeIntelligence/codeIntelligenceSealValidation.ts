/**
 * cint.seal.validation.v1 — Phase 13 Seal Validation Engine.
 *
 * Prove operational seals work and cannot be silently bypassed.
 * Report-only integrity score — not a parallel completion or honestLabel authority.
 * Requires Phase 12 Recovery sealed. Connector freeze remains ON.
 */

import { isCodeIntelligenceEvidenceGateSealed } from "@/core/codeIntelligence/codeIntelligenceEvidenceEnforcement";
import { isCodeIntelligenceGovernanceGatesSealed } from "@/core/codeIntelligence/codeIntelligenceGovernanceGates";
import {
  isCodeIntelligenceAuditEmergencySealed,
  readCodeIntelligenceAuditEmergency,
} from "@/core/codeIntelligence/codeIntelligenceAuditEmergency";
import { isCodeIntelligenceDeliverySchemaSealed } from "@/core/codeIntelligence/codeIntelligenceDeliverySchema";
import {
  isCodeIntelligenceRollbackEngineSealed,
  readCodeIntelligenceRollbackEngine,
} from "@/core/codeIntelligence/codeIntelligenceRollbackEngine";
import { isCodeIntelligenceAgentGovernmentSealed } from "@/core/codeIntelligence/codeIntelligenceAgentGovernment";
import { isCodeIntelligencePlatformConstitutionSealed } from "@/core/codeIntelligence/codeIntelligencePlatformConstitution";

export const CINT_SEAL_VALIDATION_KEY = "cint.seal.validation.v1" as const;
export const CINT_SEAL_VALIDATION_VERSION = "CINT-SV-1.0" as const;

export type SealCheckId =
  | "evidence"
  | "governance"
  | "audit"
  | "delivery"
  | "rollback"
  | "agents"
  | "constitution"
  | "audit_chain"
  | "rollback_recovery_gate";

export type SealCheckResult = Readonly<{
  id: SealCheckId;
  label: string;
  valid: boolean;
  detail: string;
}>;

export type SealBypassAttempt = Readonly<{
  code: string;
  detail: string;
}>;

export type CodeIntelligenceSealValidationReport = Readonly<{
  version: "cint.seal.validation.v1";
  sealed: boolean;
  sealedAt: string | null;
  validationVersion: typeof CINT_SEAL_VALIDATION_VERSION;
  inventPages: false;
  checks: readonly SealCheckResult[];
  bypassAttempts: readonly SealBypassAttempt[];
  missingDependencies: readonly string[];
  brokenChains: readonly string[];
  integrityScore: number;
  evidenceValid: boolean;
  governanceValid: boolean;
  auditValid: boolean;
  rule: "No phase complete if required seal missing — integrity is report-only";
  constitution: readonly string[];
}>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function evaluateCodeIntelligenceSealValidation(
  metadata: unknown,
): Omit<CodeIntelligenceSealValidationReport, "sealed" | "sealedAt"> & {
  sealed: false;
  sealedAt: null;
} {
  const checks: SealCheckResult[] = [];
  const bypassAttempts: SealBypassAttempt[] = [];
  const missingDependencies: string[] = [];
  const brokenChains: string[] = [];

  const evidence = isCodeIntelligenceEvidenceGateSealed(metadata);
  const governance = isCodeIntelligenceGovernanceGatesSealed(metadata);
  const audit = isCodeIntelligenceAuditEmergencySealed(metadata);
  const delivery = isCodeIntelligenceDeliverySchemaSealed(metadata);
  const rollback = isCodeIntelligenceRollbackEngineSealed(metadata);
  const agents = isCodeIntelligenceAgentGovernmentSealed(metadata);
  const constitution = isCodeIntelligencePlatformConstitutionSealed(metadata);

  checks.push({
    id: "evidence",
    label: "Evidence Gate",
    valid: evidence,
    detail: evidence ? "cint.evidence.gate.v1 sealed" : "Missing Evidence seal",
  });
  checks.push({
    id: "governance",
    label: "Governance Gates",
    valid: governance,
    detail: governance ? "cint.governance.gates.v1 sealed" : "Missing Governance seal",
  });
  checks.push({
    id: "audit",
    label: "Audit / Emergency",
    valid: audit,
    detail: audit ? "cint.audit.v1 sealed" : "Missing Audit seal",
  });
  checks.push({
    id: "delivery",
    label: "Delivery Schema",
    valid: delivery,
    detail: delivery ? "cint.delivery.schema.v1 sealed" : "Missing Delivery Schema seal",
  });
  checks.push({
    id: "rollback",
    label: "Recovery & Rollback",
    valid: rollback,
    detail: rollback ? "cint.rollback.engine.v1 sealed" : "Missing Rollback seal",
  });
  checks.push({
    id: "agents",
    label: "Agent Government",
    valid: agents,
    detail: agents ? "cint.agents.v1 sealed" : "Missing Agent Government seal",
  });
  checks.push({
    id: "constitution",
    label: "Platform Constitution",
    valid: constitution,
    detail: constitution ? "cint.constitution.v1 sealed" : "Missing Constitution seal",
  });

  if (!evidence) missingDependencies.push("cint.evidence.gate.v1");
  if (!governance) missingDependencies.push("cint.governance.gates.v1");
  if (!audit) missingDependencies.push("cint.audit.v1");
  if (!delivery) missingDependencies.push("cint.delivery.schema.v1");
  if (!rollback) missingDependencies.push("cint.rollback.engine.v1");

  if (governance && !evidence) {
    brokenChains.push("Governance sealed without Evidence — Evidence → Governance chain broken");
    bypassAttempts.push({
      code: "BYPASS_EVIDENCE_BEFORE_GOVERNANCE",
      detail: "Governance must not outrun Evidence Enforcement",
    });
  }
  if (audit && (!evidence || !governance)) {
    brokenChains.push("Audit sealed without Evidence→Governance priors");
    bypassAttempts.push({
      code: "BYPASS_AUDIT_CHAIN",
      detail: "Audit/Emergency requires Evidence and Governance first",
    });
  }
  if (delivery && (!evidence || !governance || !audit)) {
    brokenChains.push("Delivery Schema sealed without Phases 8–10");
    bypassAttempts.push({
      code: "BYPASS_DELIVERY_PRIORS",
      detail: "Phase 11 requires Phases 8–10",
    });
  }
  if (rollback && !delivery) {
    brokenChains.push("Rollback sealed without Delivery Schema");
    bypassAttempts.push({
      code: "BYPASS_ROLLBACK_PRIORS",
      detail: "Phase 12 requires Phase 11",
    });
  }

  const auditAuth = readCodeIntelligenceAuditEmergency(metadata);
  const chainOk =
    !auditAuth ||
    auditAuth.ledger.length === 0 ||
    auditAuth.ledger.every((e, i) => {
      if (i === 0) return e.prevId === null;
      return e.prevId === auditAuth.ledger[i - 1]?.id;
    });
  checks.push({
    id: "audit_chain",
    label: "Audit Ledger Chain",
    valid: Boolean(audit && chainOk),
    detail: !audit
      ? "Audit not sealed"
      : chainOk
        ? "Ledger prevId chain intact"
        : "Broken audit ledger chain",
  });
  if (audit && !chainOk) {
    brokenChains.push("Audit ledger prevId chain broken");
    bypassAttempts.push({
      code: "AUDIT_CHAIN_TAMPER",
      detail: "Immutable ledger linkage failed validation",
    });
  }

  const rb = readCodeIntelligenceRollbackEngine(metadata);
  const recoveryGateOk = Boolean(
    rb?.sealed && rb.maxims.some((m) => /NO AI ACTION WITHOUT RECOVERY/i.test(m)),
  );
  checks.push({
    id: "rollback_recovery_gate",
    label: "Recovery Mutate Gate",
    valid: recoveryGateOk,
    detail: recoveryGateOk
      ? "Recovery maxim present on sealed rollback engine"
      : "Recovery mutate gate missing",
  });

  const validCount = checks.filter((c) => c.valid).length;
  const integrityScore = Math.round((validCount / checks.length) * 100);

  return {
    version: "cint.seal.validation.v1",
    sealed: false,
    sealedAt: null,
    validationVersion: CINT_SEAL_VALIDATION_VERSION,
    inventPages: false,
    checks,
    bypassAttempts,
    missingDependencies,
    brokenChains,
    integrityScore,
    evidenceValid: evidence && !bypassAttempts.some((b) => b.code.includes("EVIDENCE")),
    governanceValid: governance && evidence,
    auditValid: audit && evidence && governance && chainOk,
    rule: "No phase complete if required seal missing — integrity is report-only",
    constitution: [
      "Phase 13 — Seal Validation after Recovery (Phase 12)",
      "Does not write GoldenPathStatus.honestLabel",
      "Does not invent pages or lift connector freeze",
    ],
  };
}

export function buildCodeIntelligenceSealValidationAuthority(options?: {
  sealed?: boolean;
  metadata?: unknown;
}): CodeIntelligenceSealValidationReport {
  const report = evaluateCodeIntelligenceSealValidation(options?.metadata);
  const sealed = options?.sealed === true;
  if (!sealed) return report;
  return {
    ...report,
    sealed: true,
    sealedAt: new Date().toISOString(),
  };
}

export function sealCodeIntelligenceSealValidation(metadata: unknown): {
  metadata: Record<string, unknown>;
  validation: CodeIntelligenceSealValidationReport;
  blockedReason?: string;
} {
  const base = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  if (!isCodeIntelligenceRollbackEngineSealed(base)) {
    return {
      metadata: base,
      validation: buildCodeIntelligenceSealValidationAuthority({ sealed: false, metadata: base }),
      blockedReason: "Phase 12 Recovery & Rollback must be sealed before Phase 13 Seal Validation.",
    };
  }
  const validation = buildCodeIntelligenceSealValidationAuthority({
    sealed: true,
    metadata: base,
  });
  base[CINT_SEAL_VALIDATION_KEY] = validation;
  return { metadata: base, validation };
}

export function readCodeIntelligenceSealValidation(
  metadata?: unknown,
): CodeIntelligenceSealValidationReport | null {
  const block = asRecord(asRecord(metadata)?.[CINT_SEAL_VALIDATION_KEY]);
  if (!block || block.version !== "cint.seal.validation.v1") return null;
  return block as CodeIntelligenceSealValidationReport;
}

export function isCodeIntelligenceSealValidationSealed(metadata?: unknown): boolean {
  const v = readCodeIntelligenceSealValidation(metadata);
  return Boolean(v?.sealed && v.sealedAt);
}

export function detectCodeIntelligenceSealValidationSealIntent(text: string): boolean {
  const t = text.toLowerCase();
  return (
    /\bphase\s*13\b/.test(t) ||
    /\bseal validation\b/.test(t) ||
    /\bcint\.seal\.validation\.v1\b/.test(t) ||
    /\bseal integrity\b/.test(t) ||
    /\bvalidate\b.{0,20}\bseals?\b/.test(t)
  );
}

export function formatCodeIntelligenceSealValidationSummaryLines(
  v: CodeIntelligenceSealValidationReport,
): string[] {
  return [
    `${v.sealed ? "✓" : "○"} Seal Validation ${v.validationVersion} (${CINT_SEAL_VALIDATION_KEY})`,
    `${v.evidenceValid ? "✓" : "✕"} Evidence Valid · ${v.governanceValid ? "✓" : "✕"} Governance Valid · ${v.auditValid ? "✓" : "✕"} Audit Valid`,
    `○ Seal Integrity Score: ${v.integrityScore}%`,
    v.bypassAttempts.length
      ? `✕ Bypass signals: ${v.bypassAttempts.map((b) => b.code).join(", ")}`
      : "○ No bypass attempts detected",
  ];
}
