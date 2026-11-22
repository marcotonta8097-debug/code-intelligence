/**
 * Phases 8–10 cascade seal — Evidence Gate → Governance Gates → Audit/Emergency.
 *
 * One Repair intent (“start next phases” / “phases 8 to 10”) seals all missing
 * authorities in order. Does not invent pages. Does not lift connector freeze.
 */

import {
  isCodeIntelligenceEvidenceGateSealed,
  sealCodeIntelligenceEvidenceGate,
} from "@/core/codeIntelligence/codeIntelligenceEvidenceEnforcement";
import {
  isCodeIntelligenceGovernanceGatesSealed,
  sealCodeIntelligenceGovernanceGates,
} from "@/core/codeIntelligence/codeIntelligenceGovernanceGates";
import {
  isCodeIntelligenceAuditEmergencySealed,
  sealCodeIntelligenceAuditEmergency,
} from "@/core/codeIntelligence/codeIntelligenceAuditEmergency";

export type CodeIntelligencePhases810SealResult = Readonly<{
  metadata: Record<string, unknown>;
  sealedNow: Readonly<{
    evidenceGate: boolean;
    governanceGates: boolean;
    auditEmergency: boolean;
  }>;
  alreadySealed: Readonly<{
    evidenceGate: boolean;
    governanceGates: boolean;
    auditEmergency: boolean;
  }>;
  complete: boolean;
  progressLines: readonly string[];
}>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** True for start-next / phases 8–10 / seal 8 to 10 completion intents. */
export function detectCodeIntelligencePhases810SealIntent(
  userPrompt?: string | null,
): boolean {
  const text = String(userPrompt || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return false;
  return (
    /\bstart\b.{0,40}\bnext\s+phases?\b/.test(text) ||
    /\bphases?\s*8\s*(to|through|-|–|—|and|&|\/)\s*1[01]\b/.test(text) ||
    /\bphase\s*8\b.{0,30}\bphase\s*1[01]\b/.test(text) ||
    /\bseal\b.{0,40}\bphases?\s*8/.test(text) ||
    /\bcomplete\b.{0,40}\bphases?\s*8/.test(text) ||
    /\boperational seals?\b.{0,20}\b(8|phases?)\b/.test(text)
  );
}

/**
 * Seal Phase 8 → 9 → 10 in order. Idempotent for already-sealed keys.
 * Connector freeze remains ON.
 */
export function sealCodeIntelligencePhases810Cascade(
  metadata: unknown,
): CodeIntelligencePhases810SealResult {
  let working = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  const progressLines: string[] = [];

  const alreadySealed = {
    evidenceGate: isCodeIntelligenceEvidenceGateSealed(working),
    governanceGates: isCodeIntelligenceGovernanceGatesSealed(working),
    auditEmergency: isCodeIntelligenceAuditEmergencySealed(working),
  };

  const sealedNow = {
    evidenceGate: false,
    governanceGates: false,
    auditEmergency: false,
  };

  if (!alreadySealed.evidenceGate) {
    const sealed = sealCodeIntelligenceEvidenceGate(working);
    working = sealed.metadata as Record<string, unknown>;
    sealedNow.evidenceGate = true;
    progressLines.push(
      "✓ cint.evidence.gate.v1 SEALED (Phase 8) — No evidence, no verified conclusion.",
    );
  } else {
    progressLines.push("○ cint.evidence.gate.v1 already sealed — Evidence Enforcement holds.");
  }

  if (!isCodeIntelligenceGovernanceGatesSealed(working)) {
    const sealed = sealCodeIntelligenceGovernanceGates(working);
    working = sealed.metadata as Record<string, unknown>;
    sealedNow.governanceGates = true;
    progressLines.push(
      "✓ cint.governance.gates.v1 SEALED (Phase 9) — L4/L5 execute requires human approval.",
    );
  } else {
    progressLines.push("○ cint.governance.gates.v1 already sealed — Governance Gates hold.");
  }

  if (!isCodeIntelligenceAuditEmergencySealed(working)) {
    const sealed = sealCodeIntelligenceAuditEmergency(working);
    working = sealed.metadata as Record<string, unknown>;
    sealedNow.auditEmergency = true;
    progressLines.push(
      "✓ cint.audit.v1 SEALED (Phase 10) — Immutable ledger + emergency freeze/stop/rollback.",
    );
  } else {
    progressLines.push("○ cint.audit.v1 already sealed — Audit/Emergency holds.");
  }

  const complete =
    isCodeIntelligenceEvidenceGateSealed(working) &&
    isCodeIntelligenceGovernanceGatesSealed(working) &&
    isCodeIntelligenceAuditEmergencySealed(working);

  if (complete) {
    progressLines.push(
      "✓ Phases 8–10 operational seals COMPLETE — connector freeze still ON until explicit human lift.",
    );
  }

  return {
    metadata: working,
    sealedNow,
    alreadySealed,
    complete,
    progressLines,
  };
}

export function areCodeIntelligencePhases810Sealed(metadata?: unknown): boolean {
  return (
    isCodeIntelligenceEvidenceGateSealed(metadata) &&
    isCodeIntelligenceGovernanceGatesSealed(metadata) &&
    isCodeIntelligenceAuditEmergencySealed(metadata)
  );
}
