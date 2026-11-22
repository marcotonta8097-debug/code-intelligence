/**
 * cint.architecture.intelligence.v1 — Phase 18 Architecture Intelligence.
 *
 * Seals authority over dependency/service/flow/database/API map posture.
 * Extends Pack 08 architectureKnowledgeEngine — does not invent a parallel graph authority.
 * Requires Phase 17 Predictive Risk sealed.
 */

import { isCodeIntelligencePredictiveRiskSealed } from "@/core/codeIntelligence/codeIntelligencePredictiveRisk";
import { ARCHITECTURE_KNOWLEDGE_ENGINE_VERSION } from "@/core/codeIntelligence/architectureKnowledgeEngine";

export const CINT_ARCHITECTURE_INTELLIGENCE_KEY = "cint.architecture.intelligence.v1" as const;
export const CINT_ARCHITECTURE_INTELLIGENCE_VERSION = "CINT-AI-1.0" as const;

export type ArchitectureMapKind =
  | "dependency"
  | "service"
  | "flow"
  | "database"
  | "api";

export type ArchitectureMapContract = Readonly<{
  kind: ArchitectureMapKind;
  purpose: string;
  ownerEngine: typeof ARCHITECTURE_KNOWLEDGE_ENGINE_VERSION;
}>;

export type CodeIntelligenceArchitectureIntelligenceAuthority = Readonly<{
  version: "cint.architecture.intelligence.v1";
  sealed: boolean;
  sealedAt: string | null;
  architectureVersion: typeof CINT_ARCHITECTURE_INTELLIGENCE_VERSION;
  inventPages: false;
  maps: readonly ArchitectureMapContract[];
  understands: readonly string[];
  rule: "Architecture maps project structure — do not invent pages or product family";
  constitution: readonly string[];
}>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export const CINT_ARCHITECTURE_MAPS: readonly ArchitectureMapContract[] = [
  {
    kind: "dependency",
    purpose: "What depends on what",
    ownerEngine: ARCHITECTURE_KNOWLEDGE_ENGINE_VERSION,
  },
  {
    kind: "service",
    purpose: "Service / module boundaries",
    ownerEngine: ARCHITECTURE_KNOWLEDGE_ENGINE_VERSION,
  },
  {
    kind: "flow",
    purpose: "Auth / API / data / ops flows",
    ownerEngine: ARCHITECTURE_KNOWLEDGE_ENGINE_VERSION,
  },
  {
    kind: "database",
    purpose: "Data store touchpoints observed in snapshot",
    ownerEngine: ARCHITECTURE_KNOWLEDGE_ENGINE_VERSION,
  },
  {
    kind: "api",
    purpose: "API surface and consumers",
    ownerEngine: ARCHITECTURE_KNOWLEDGE_ENGINE_VERSION,
  },
] as const;

export function buildCodeIntelligenceArchitectureIntelligenceAuthority(options?: {
  sealed?: boolean;
}): CodeIntelligenceArchitectureIntelligenceAuthority {
  const sealed = options?.sealed === true;
  return {
    version: "cint.architecture.intelligence.v1",
    sealed,
    sealedAt: sealed ? new Date().toISOString() : null,
    architectureVersion: CINT_ARCHITECTURE_INTELLIGENCE_VERSION,
    inventPages: false,
    maps: CINT_ARCHITECTURE_MAPS,
    understands: [
      "What exists",
      "Where it lives",
      "What it depends on",
      "What will break",
    ],
    rule: "Architecture maps project structure — do not invent pages or product family",
    constitution: [
      "Phase 18 — Architecture Intelligence after Predictive Risk (Phase 17)",
      `Graph owner remains ${ARCHITECTURE_KNOWLEDGE_ENGINE_VERSION} — no parallel graph authority`,
      "Connector freeze remains ON",
      "inventPages=false",
    ],
  };
}

export function sealCodeIntelligenceArchitectureIntelligence(metadata: unknown): {
  metadata: Record<string, unknown>;
  architecture: CodeIntelligenceArchitectureIntelligenceAuthority;
  blockedReason?: string;
} {
  const base = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  if (!isCodeIntelligencePredictiveRiskSealed(base)) {
    return {
      metadata: base,
      architecture: buildCodeIntelligenceArchitectureIntelligenceAuthority({ sealed: false }),
      blockedReason:
        "Phase 17 Predictive Risk must be sealed before Phase 18 Architecture Intelligence.",
    };
  }
  const architecture = buildCodeIntelligenceArchitectureIntelligenceAuthority({ sealed: true });
  base[CINT_ARCHITECTURE_INTELLIGENCE_KEY] = architecture;
  return { metadata: base, architecture };
}

export function readCodeIntelligenceArchitectureIntelligence(
  metadata?: unknown,
): CodeIntelligenceArchitectureIntelligenceAuthority | null {
  const block = asRecord(asRecord(metadata)?.[CINT_ARCHITECTURE_INTELLIGENCE_KEY]);
  if (!block || block.version !== "cint.architecture.intelligence.v1") return null;
  return block as CodeIntelligenceArchitectureIntelligenceAuthority;
}

export function isCodeIntelligenceArchitectureIntelligenceSealed(metadata?: unknown): boolean {
  const a = readCodeIntelligenceArchitectureIntelligence(metadata);
  return Boolean(a?.sealed && a.sealedAt);
}

export function detectCodeIntelligenceArchitectureIntelligenceSealIntent(text: string): boolean {
  const t = text.toLowerCase();
  return (
    /\bphase\s*18\b/.test(t) ||
    /\barchitecture intelligence\b/.test(t) ||
    /\bcint\.architecture\.intelligence\.v1\b/.test(t) ||
    /\bdependency maps?\b/.test(t)
  );
}

export function formatCodeIntelligenceArchitectureIntelligenceSummaryLines(
  architecture: CodeIntelligenceArchitectureIntelligenceAuthority,
): string[] {
  return [
    `${architecture.sealed ? "✓" : "○"} Architecture Intelligence ${architecture.architectureVersion} (${CINT_ARCHITECTURE_INTELLIGENCE_KEY})`,
    `○ Maps: ${architecture.maps.map((m) => m.kind).join(" · ")}`,
    `○ Understands: ${architecture.understands.join(" · ")}`,
  ];
}
