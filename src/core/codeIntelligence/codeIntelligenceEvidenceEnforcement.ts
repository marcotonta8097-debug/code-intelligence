/**
 * cint.evidence.gate.v1 — Phase 8 Evidence Enforcement.
 *
 * Evidence UI ≠ Evidence Enforcement.
 * No finding may become VERIFIED without: exists · current · relevant · complete · traceable.
 * Subordinate to cint.constitution.v1 Article II / P2 and Constitutional Compliance Agent.
 */

import type { CodeIntelligenceAgentId } from "@/core/codeIntelligence/codeIntelligenceAgentGovernment";

export const CINT_EVIDENCE_GATE_KEY = "cint.evidence.gate.v1" as const;
export const CINT_EVIDENCE_GATE_VERSION = "CINT-EG-1.0" as const;

export type FindingVerificationStatus =
  | "UNVERIFIED"
  | "EVIDENCE_INCOMPLETE"
  | "EVIDENCE_STALE"
  | "VERIFIED";

export type EvidenceEnforcementInput = Readonly<{
  findingId: string;
  evidenceIds?: readonly string[] | null;
  evidenceRefs?: readonly string[] | null;
  evidenceSummary?: string | null;
  /** ISO timestamp or demo clock — missing ⇒ not current. */
  evidenceTimestamp?: string | null;
  /** Finding / analysis clock for staleness compare (optional). */
  analysisTimestamp?: string | null;
  criteria?: string | null;
  confidence?: string | null;
  specialist?: string | null | CodeIntelligenceAgentId;
  location?: string | null;
  /** Explicit claim that conclusion is verified — gate may demote. */
  claimedVerified?: boolean;
}>;

export type EvidenceEnforcementCheck = Readonly<{
  id: "exists" | "current" | "relevant" | "complete" | "traceable";
  ok: boolean;
  detail: string;
}>;

export type EvidenceEnforcementResult = Readonly<{
  findingId: string;
  status: FindingVerificationStatus;
  checks: readonly EvidenceEnforcementCheck[];
  mayClaimVerified: boolean;
  blockers: readonly string[];
  enforcedBy: "constitutional_compliance" | "evidence_intelligence";
}>;

export type CodeIntelligenceEvidenceGateAuthority = Readonly<{
  version: "cint.evidence.gate.v1";
  sealed: boolean;
  sealedAt: string | null;
  gateVersion: typeof CINT_EVIDENCE_GATE_VERSION;
  rule: "No evidence — no verified conclusion";
  inventPages: false;
  constitution: readonly string[];
}>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function hasEvidencePayload(input: EvidenceEnforcementInput): boolean {
  const ids = [...(input.evidenceIds ?? []), ...(input.evidenceRefs ?? [])].filter(Boolean);
  if (ids.length > 0) return true;
  const summary = (input.evidenceSummary ?? "").trim();
  if (!summary) return false;
  if (/^(—|-|n\/?a|none|missing|unverified)$/i.test(summary)) return false;
  if (/no evidence/i.test(summary)) return false;
  return summary.length >= 3;
}

function isStale(input: EvidenceEnforcementInput): boolean {
  const ts = (input.evidenceTimestamp ?? "").trim();
  if (!ts) return true;
  if (/^demo-clock/i.test(ts)) return false;
  const evidenceMs = Date.parse(ts);
  if (Number.isNaN(evidenceMs)) return false;
  const analysis = (input.analysisTimestamp ?? "").trim();
  if (analysis) {
    const analysisMs = Date.parse(analysis);
    if (!Number.isNaN(analysisMs) && evidenceMs + 1 < analysisMs) return true;
  }
  // Absolute staleness: older than 90 days when both are real timestamps
  const ageMs = Date.now() - evidenceMs;
  return ageMs > 90 * 24 * 60 * 60 * 1000;
}

/**
 * Evidence Gate — demotes claimed VERIFIED to UNVERIFIED / INCOMPLETE / STALE.
 */
export function enforceFindingEvidence(
  input: EvidenceEnforcementInput,
): EvidenceEnforcementResult {
  const exists = hasEvidencePayload(input);
  const current = exists && !isStale(input);
  const relevant =
    exists &&
    Boolean(
      (input.criteria ?? "").trim() ||
        (input.location ?? "").trim() ||
        (input.evidenceSummary ?? "").trim(),
    );
  const complete =
    exists &&
    Boolean((input.criteria ?? "").trim()) &&
    Boolean((input.confidence ?? "").trim()) &&
    Boolean((input.specialist ?? "").toString().trim()) &&
    Boolean((input.evidenceTimestamp ?? "").trim());
  const traceable =
    exists &&
    ([...(input.evidenceIds ?? []), ...(input.evidenceRefs ?? [])].some(Boolean) ||
      Boolean((input.location ?? "").trim()));

  const checks: EvidenceEnforcementCheck[] = [
    {
      id: "exists",
      ok: exists,
      detail: exists ? "Evidence reference or summary present" : "No evidence — cannot verify",
    },
    {
      id: "current",
      ok: current,
      detail: current
        ? "Evidence timestamp acceptable"
        : exists
          ? "Evidence missing timestamp or stale vs analysis"
          : "N/A — no evidence",
    },
    {
      id: "relevant",
      ok: relevant,
      detail: relevant
        ? "Criteria/location/summary ties evidence to finding"
        : "Relevance not established",
    },
    {
      id: "complete",
      ok: complete,
      detail: complete
        ? "Criteria · confidence · specialist · timestamp present"
        : "Constitutional evidence fields incomplete",
    },
    {
      id: "traceable",
      ok: traceable,
      detail: traceable ? "Evidence id/ref or location present" : "Not traceable",
    },
  ];

  const blockers = checks.filter((c) => !c.ok).map((c) => `${c.id}: ${c.detail}`);
  let status: FindingVerificationStatus = "UNVERIFIED";
  if (!exists) status = "UNVERIFIED";
  else if (!current) status = "EVIDENCE_STALE";
  else if (!complete || !relevant || !traceable) status = "EVIDENCE_INCOMPLETE";
  else status = "VERIFIED";

  const mayClaimVerified = status === "VERIFIED";
  if (input.claimedVerified && !mayClaimVerified) {
    blockers.push("claimedVerified demoted by Evidence Gate");
  }

  return {
    findingId: input.findingId,
    status,
    checks,
    mayClaimVerified,
    blockers,
    enforcedBy: "constitutional_compliance",
  };
}

/** Batch gate for demo/runtime finding rows. */
export function enforceFindingsEvidenceBatch(
  findings: readonly EvidenceEnforcementInput[],
): readonly EvidenceEnforcementResult[] {
  return findings.map((f) => enforceFindingEvidence(f));
}

export function buildCodeIntelligenceEvidenceGateAuthority(options?: {
  sealed?: boolean;
}): CodeIntelligenceEvidenceGateAuthority {
  const sealed = options?.sealed === true;
  return {
    version: "cint.evidence.gate.v1",
    sealed,
    sealedAt: sealed ? new Date().toISOString() : null,
    gateVersion: CINT_EVIDENCE_GATE_VERSION,
    rule: "No evidence — no verified conclusion",
    inventPages: false,
    constitution: [
      "Article II Principle 2 — Evidence Before Conclusions",
      "Constitutional Compliance Agent enforces gate; does not report to PM",
      "Verified requires exists · current · relevant · complete · traceable",
      "UI evidence explorer is not enforcement — this gate is",
    ],
  };
}

export function sealCodeIntelligenceEvidenceGate(metadata: unknown): {
  metadata: Record<string, unknown>;
  gate: CodeIntelligenceEvidenceGateAuthority;
} {
  const base = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  const gate = buildCodeIntelligenceEvidenceGateAuthority({ sealed: true });
  base[CINT_EVIDENCE_GATE_KEY] = gate;
  return { metadata: base, gate };
}

export function isCodeIntelligenceEvidenceGateSealed(metadata?: unknown): boolean {
  const block = asRecord(asRecord(metadata)?.[CINT_EVIDENCE_GATE_KEY]);
  return Boolean(block?.sealed && block.sealedAt);
}

export function detectCodeIntelligenceEvidenceGateSealIntent(text: string): boolean {
  const t = text.toLowerCase();
  return (
    /\bphase\s*8\b/.test(t) ||
    /\bevidence enforcement\b/.test(t) ||
    /\bevidence gate\b/.test(t) ||
    /\bcint\.evidence\.gate\.v1\b/.test(t) ||
    /\bseal\b.*\bevidence\b/.test(t)
  );
}

export function formatCodeIntelligenceEvidenceGateSummaryLines(
  gate: CodeIntelligenceEvidenceGateAuthority,
): string[] {
  return [
    `${gate.sealed ? "✓" : "○"} Evidence Gate ${gate.gateVersion} (${CINT_EVIDENCE_GATE_KEY})`,
    `○ Rule: ${gate.rule}`,
    `○ Checks: exists · current · relevant · complete · traceable`,
  ];
}
