/**
 * cint.trust.engine.v1 — Phase 14 System Trust Engine.
 *
 * Platform-wide confidence scoring for CI surfaces.
 * Report-only — NEVER writes GoldenPathStatus.honestLabel (PDS-1.0 sole ship claim).
 * Requires Phase 13 Seal Validation sealed.
 */

import {
  isCodeIntelligenceSealValidationSealed,
  readCodeIntelligenceSealValidation,
} from "@/core/codeIntelligence/codeIntelligenceSealValidation";
import { isCodeIntelligenceRollbackEngineSealed } from "@/core/codeIntelligence/codeIntelligenceRollbackEngine";
import { isCodeIntelligenceAuditEmergencySealed } from "@/core/codeIntelligence/codeIntelligenceAuditEmergency";
import { isCodeIntelligenceGovernanceGatesSealed } from "@/core/codeIntelligence/codeIntelligenceGovernanceGates";
import { evaluateCodeIntelligenceDeliverySpine } from "@/core/codeIntelligence/codeIntelligenceDeliverySpine";

export const CINT_TRUST_ENGINE_KEY = "cint.trust.engine.v1" as const;
export const CINT_TRUST_ENGINE_VERSION = "CINT-TE-1.0" as const;

export type TrustDimension =
  | "repository"
  | "architecture"
  | "documentation"
  | "repair"
  | "audit"
  | "governance";

export type TrustScore = Readonly<{
  dimension: TrustDimension;
  score: number;
  detail: string;
}>;

export type CodeIntelligenceTrustEngineAuthority = Readonly<{
  version: "cint.trust.engine.v1";
  sealed: boolean;
  sealedAt: string | null;
  trustVersion: typeof CINT_TRUST_ENGINE_VERSION;
  inventPages: false;
  scores: readonly TrustScore[];
  overallProjectTrust: number;
  rule: "Trust scores are CI health reports — not honestLabel / production_candidate";
  constitution: readonly string[];
}>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function evaluateCodeIntelligenceTrustScores(input: {
  metadata?: unknown;
  html?: string;
}): {
  scores: TrustScore[];
  overallProjectTrust: number;
} {
  const seal = readCodeIntelligenceSealValidation(input.metadata);
  const integrity = seal?.integrityScore ?? (isCodeIntelligenceRollbackEngineSealed(input.metadata) ? 70 : 40);
  const spine = evaluateCodeIntelligenceDeliverySpine({
    metadata: input.metadata,
    html: input.html,
  });
  const deliveryBoost =
    spine.gates.pgms === "sealed"
      ? 10
      : spine.gates.pgms === "incomplete"
        ? 4
        : 0;

  const scores: TrustScore[] = [
    {
      dimension: "repository",
      score: clamp(integrity * 0.85 + deliveryBoost),
      detail: "Seal integrity + delivery foothold",
    },
    {
      dimension: "architecture",
      score: clamp(integrity * 0.8 + (seal?.checks.some((c) => c.id === "agents" && c.valid) ? 8 : 0)),
      detail: "Agent government + seal chain posture",
    },
    {
      dimension: "documentation",
      score: clamp(integrity * 0.75 + (seal?.constitution ? 5 : 0)),
      detail: "Constitution / sealed contract coverage",
    },
    {
      dimension: "repair",
      score: clamp(
        (isCodeIntelligenceRollbackEngineSealed(input.metadata) ? 88 : 35) +
          (spine.gates.scw === "sealed" ? 6 : spine.gates.scw === "incomplete" ? 2 : 0),
      ),
      detail: "Recovery capability before mutate",
    },
    {
      dimension: "audit",
      score: clamp(isCodeIntelligenceAuditEmergencySealed(input.metadata) ? 92 : 30),
      detail: "Immutable ledger + emergency controls",
    },
    {
      dimension: "governance",
      score: clamp(isCodeIntelligenceGovernanceGatesSealed(input.metadata) ? 94 : 30),
      detail: "L1–L5 gates + human L4/L5",
    },
  ];

  const overallProjectTrust = clamp(
    scores.reduce((sum, s) => sum + s.score, 0) / scores.length,
  );
  return { scores, overallProjectTrust };
}

export function buildCodeIntelligenceTrustEngineAuthority(options?: {
  sealed?: boolean;
  metadata?: unknown;
  html?: string;
}): CodeIntelligenceTrustEngineAuthority {
  const evaluated = evaluateCodeIntelligenceTrustScores({
    metadata: options?.metadata,
    html: options?.html,
  });
  const sealed = options?.sealed === true;
  return {
    version: "cint.trust.engine.v1",
    sealed,
    sealedAt: sealed ? new Date().toISOString() : null,
    trustVersion: CINT_TRUST_ENGINE_VERSION,
    inventPages: false,
    scores: evaluated.scores,
    overallProjectTrust: evaluated.overallProjectTrust,
    rule: "Trust scores are CI health reports — not honestLabel / production_candidate",
    constitution: [
      "Phase 14 — Trust Engine after Seal Validation (Phase 13)",
      "PDS-1.0 remains sole honestLabel owner",
      "Connector freeze remains ON",
      "inventPages=false",
    ],
  };
}

export function sealCodeIntelligenceTrustEngine(
  metadata: unknown,
  options?: { html?: string },
): {
  metadata: Record<string, unknown>;
  trust: CodeIntelligenceTrustEngineAuthority;
  blockedReason?: string;
} {
  const base = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  if (!isCodeIntelligenceSealValidationSealed(base)) {
    return {
      metadata: base,
      trust: buildCodeIntelligenceTrustEngineAuthority({ sealed: false, metadata: base }),
      blockedReason: "Phase 13 Seal Validation must be sealed before Phase 14 Trust Engine.",
    };
  }
  const trust = buildCodeIntelligenceTrustEngineAuthority({
    sealed: true,
    metadata: base,
    html: options?.html,
  });
  base[CINT_TRUST_ENGINE_KEY] = trust;
  return { metadata: base, trust };
}

export function readCodeIntelligenceTrustEngine(
  metadata?: unknown,
): CodeIntelligenceTrustEngineAuthority | null {
  const block = asRecord(asRecord(metadata)?.[CINT_TRUST_ENGINE_KEY]);
  if (!block || block.version !== "cint.trust.engine.v1") return null;
  return block as CodeIntelligenceTrustEngineAuthority;
}

export function isCodeIntelligenceTrustEngineSealed(metadata?: unknown): boolean {
  const t = readCodeIntelligenceTrustEngine(metadata);
  return Boolean(t?.sealed && t.sealedAt);
}

export function detectCodeIntelligenceTrustEngineSealIntent(text: string): boolean {
  const t = text.toLowerCase();
  return (
    /\bphase\s*14\b/.test(t) ||
    /\btrust engine\b/.test(t) ||
    /\bcint\.trust\.engine\.v1\b/.test(t) ||
    /\bproject trust\b/.test(t) ||
    /\bseal\b.{0,20}\btrust\b/.test(t)
  );
}

export function formatCodeIntelligenceTrustEngineSummaryLines(
  trust: CodeIntelligenceTrustEngineAuthority,
): string[] {
  const by = Object.fromEntries(trust.scores.map((s) => [s.dimension, s.score]));
  return [
    `${trust.sealed ? "✓" : "○"} Trust Engine ${trust.trustVersion} (${CINT_TRUST_ENGINE_KEY})`,
    `○ Repository ${by.repository ?? 0}% · Architecture ${by.architecture ?? 0}% · Repair ${by.repair ?? 0}%`,
    `○ Audit ${by.audit ?? 0}% · Governance ${by.governance ?? 0}% · Overall Project Trust: ${trust.overallProjectTrust}%`,
    `○ Rule: ${trust.rule}`,
  ];
}
