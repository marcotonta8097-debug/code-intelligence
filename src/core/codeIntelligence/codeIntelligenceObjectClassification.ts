/**
 * Phase E / K3 — Deterministic object classification.
 * Rules only — never LLM-as-authority. Labels are report fields, not honestLabel.
 */

import type { CintObjectKind } from "@/core/codeIntelligence/codeIntelligenceObjectIdentity";
import type { CintObjectRegistryEntry } from "@/core/codeIntelligence/codeIntelligenceObjectRegistry";
import type { CintObjectRegistry } from "@/core/codeIntelligence/codeIntelligenceObjectRegistry";

export const CINT_OBJECT_CLASSIFICATION_VERSION = "CINT-OC-1.0" as const;

export const CINT_OBJECT_CLASSES = [
  "Security",
  "Quality",
  "Dependency",
  "Architecture",
  "Documentation",
  "Operational",
  "Knowledge",
  "Governance",
] as const;

export type CintObjectClass = (typeof CINT_OBJECT_CLASSES)[number];

export type CintObjectClassification = Readonly<{
  class: CintObjectClass;
  labels: readonly string[];
  reason: string;
  version: typeof CINT_OBJECT_CLASSIFICATION_VERSION;
}>;

export type CintClassifiedRegistryEntry = CintObjectRegistryEntry & {
  classification: CintObjectClassification;
};

export type CintClassifiedRegistry = Readonly<{
  version: typeof CINT_OBJECT_CLASSIFICATION_VERSION;
  registryVersion: string;
  byId: Readonly<Record<string, CintClassifiedRegistryEntry>>;
  byKind: Readonly<Record<CintObjectKind, readonly string[]>>;
  byClass: Readonly<Record<CintObjectClass, readonly string[]>>;
  count: number;
}>;

const SECURITY_TOKENS = /\b(SECRET|SECRETS|AUTH|ACCESS|TLS|SEC|SECURITY|CONFIG)\b/i;
const QUALITY_TOKENS = /\b(DEAD|LARGE|DUP|CYCLE|UNUSEDEP|COMPLEX|MAINT|PERF|QUALITY|TEST)\b/i;
const ARCH_TOKENS = /\b(ARCH|ARCHITECTURE|MODULE|GRAPH)\b/i;
const DOC_TOKENS = /\b(DOC|DOCUMENT)\b/i;

function classFromFindingId(id: string, title: string): CintObjectClassification {
  const hay = `${id} ${title}`;
  if (SECURITY_TOKENS.test(hay)) {
    return {
      class: "Security",
      labels: ["finding", "security"],
      reason: "Finding id/title matches security family tokens",
      version: CINT_OBJECT_CLASSIFICATION_VERSION,
    };
  }
  if (DOC_TOKENS.test(hay)) {
    return {
      class: "Documentation",
      labels: ["finding", "documentation"],
      reason: "Finding id/title matches documentation tokens",
      version: CINT_OBJECT_CLASSIFICATION_VERSION,
    };
  }
  if (ARCH_TOKENS.test(hay)) {
    return {
      class: "Architecture",
      labels: ["finding", "architecture"],
      reason: "Finding id/title matches architecture tokens",
      version: CINT_OBJECT_CLASSIFICATION_VERSION,
    };
  }
  if (QUALITY_TOKENS.test(hay) || /\bF-(DEAD|LARGE|DUP|CYCLE|UNUSEDEP)-/i.test(id)) {
    return {
      class: "Quality",
      labels: ["finding", "quality"],
      reason: "Finding id/title matches quality/debt family tokens",
      version: CINT_OBJECT_CLASSIFICATION_VERSION,
    };
  }
  return {
    class: "Operational",
    labels: ["finding"],
    reason: "Finding without a stronger family match",
    version: CINT_OBJECT_CLASSIFICATION_VERSION,
  };
}

export function classifyCintObject(entry: CintObjectRegistryEntry): CintObjectClassification {
  switch (entry.kind) {
    case "finding":
      return classFromFindingId(entry.id, entry.title);
    case "evidence":
      return {
        class: "Operational",
        labels: ["evidence"],
        reason: "Evidence supports a finding workflow",
        version: CINT_OBJECT_CLASSIFICATION_VERSION,
      };
    case "remediation":
      return {
        class: "Operational",
        labels: ["remediation"],
        reason: "Remediation is an action object",
        version: CINT_OBJECT_CLASSIFICATION_VERSION,
      };
    case "analysis_run":
      return {
        class: "Governance",
        labels: ["analysis_run"],
        reason: "Analysis run is a governance ledger object",
        version: CINT_OBJECT_CLASSIFICATION_VERSION,
      };
    case "dependency":
      return {
        class: "Dependency",
        labels: ["dependency"],
        reason: "Dependency graph node",
        version: CINT_OBJECT_CLASSIFICATION_VERSION,
      };
    case "artifact":
      return {
        class: "Operational",
        labels: ["artifact"],
        reason: "Delivery/export artifact",
        version: CINT_OBJECT_CLASSIFICATION_VERSION,
      };
    case "knowledge_note":
      return {
        class: "Knowledge",
        labels: ["knowledge_note"],
        reason: "Curated knowledge note",
        version: CINT_OBJECT_CLASSIFICATION_VERSION,
      };
    default:
      return {
        class: "Operational",
        labels: [],
        reason: "Unmapped kind",
        version: CINT_OBJECT_CLASSIFICATION_VERSION,
      };
  }
}

export function classifyCintObjectRegistry(registry: CintObjectRegistry): CintClassifiedRegistry {
  const byId: Record<string, CintClassifiedRegistryEntry> = {};
  const byClass = Object.fromEntries(
    CINT_OBJECT_CLASSES.map((c) => [c, [] as string[]]),
  ) as Record<CintObjectClass, string[]>;

  for (const id of Object.keys(registry.byId)) {
    const entry = registry.byId[id]!;
    const classification = classifyCintObject(entry);
    byId[id] = { ...entry, classification };
    byClass[classification.class].push(id);
  }

  return {
    version: CINT_OBJECT_CLASSIFICATION_VERSION,
    registryVersion: registry.version,
    byId,
    byKind: registry.byKind,
    byClass,
    count: registry.count,
  };
}
