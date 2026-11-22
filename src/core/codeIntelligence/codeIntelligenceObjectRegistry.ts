/**
 * Phase E / K2 — Object registry (catalog only).
 * Indexes existing intelligence objects by K1 identity. Not a second store,
 * not auto-expanding, not LLM-backed. Engines remain producers; this catalogs.
 */

import {
  stampCintObjectGovernance,
  type CintObjectGovernance,
} from "@/core/codeIntelligence/codeIntelligenceObjectGovernance";
import {
  CINT_OBJECT_IDENTITY_VERSION,
  buildDependencyId,
  isCintObjectId,
  type CintObjectKind,
} from "@/core/codeIntelligence/codeIntelligenceObjectIdentity";

export const CINT_OBJECT_REGISTRY_VERSION = "CINT-OR-1.0" as const;

/** Minimal analysis shape — avoids circular import with codeIntelligenceAnalysis. */
export type CintRegistryAnalysisInput = Readonly<{
  findings: readonly {
    id: string;
    title: string;
    confidence?: unknown;
    provenance?: unknown;
    evidence: readonly { id: string }[];
  }[];
  evidence: readonly {
    id: string;
    findingId: string;
    summary?: string;
    provenance?: unknown;
  }[];
  remediations: readonly {
    id: string;
    title: string;
    findingId: string;
    evidenceIds: readonly string[];
    provenance?: unknown;
  }[];
  intelligence: Readonly<{
    dependencies: Readonly<{ nodes: readonly { name: string }[] }>;
  }>;
}>;

export type CintObjectRegistryEntry = Readonly<{
  id: string;
  kind: CintObjectKind;
  title: string;
  governance: CintObjectGovernance;
  refs: Readonly<{
    findingId?: string;
    evidenceIds?: readonly string[];
    remediationId?: string;
    runId?: string;
  }>;
}>;

export type CintObjectRegistry = Readonly<{
  version: typeof CINT_OBJECT_REGISTRY_VERSION;
  identityVersion: typeof CINT_OBJECT_IDENTITY_VERSION;
  byId: Readonly<Record<string, CintObjectRegistryEntry>>;
  byKind: Readonly<Record<CintObjectKind, readonly string[]>>;
  count: number;
}>;

function emptyByKind(): Record<CintObjectKind, string[]> {
  return {
    finding: [],
    evidence: [],
    remediation: [],
    analysis_run: [],
    dependency: [],
    artifact: [],
    knowledge_note: [],
  };
}

function put(
  byId: Record<string, CintObjectRegistryEntry>,
  byKind: Record<CintObjectKind, string[]>,
  entry: CintObjectRegistryEntry,
): void {
  if (!isCintObjectId(entry.id, entry.kind)) return;
  if (byId[entry.id]) return;
  byId[entry.id] = entry;
  byKind[entry.kind].push(entry.id);
}

/** Catalog objects from a sealed analysis snapshot (read-only index). */
export function buildCintObjectRegistryFromAnalysis(
  analysis: CintRegistryAnalysisInput,
  options?: { runId?: string | null },
): CintObjectRegistry {
  const byId: Record<string, CintObjectRegistryEntry> = {};
  const byKind = emptyByKind();
  const runId = options?.runId?.trim() || undefined;

  if (runId && isCintObjectId(runId, "analysis_run")) {
    put(byId, byKind, {
      id: runId,
      kind: "analysis_run",
      title: `Analysis run ${runId}`,
      governance: stampCintObjectGovernance({ provenance: "Engine" }),
      refs: { runId },
    });
  }

  for (const finding of analysis.findings) {
    put(byId, byKind, {
      id: finding.id,
      kind: "finding",
      title: finding.title,
      governance: stampCintObjectGovernance({
        confidence: finding.confidence,
        engineProvenance: finding.provenance,
      }),
      refs: {
        findingId: finding.id,
        evidenceIds: finding.evidence.map((e) => e.id),
        runId,
      },
    });
  }

  for (const row of analysis.evidence) {
    put(byId, byKind, {
      id: row.id,
      kind: "evidence",
      title: row.summary || row.id,
      governance: stampCintObjectGovernance({
        engineProvenance: row.provenance,
      }),
      refs: { findingId: row.findingId, runId },
    });
  }

  for (const plan of analysis.remediations) {
    put(byId, byKind, {
      id: plan.id,
      kind: "remediation",
      title: plan.title,
      governance: stampCintObjectGovernance({
        engineProvenance: plan.provenance,
      }),
      refs: {
        findingId: plan.findingId,
        evidenceIds: plan.evidenceIds,
        remediationId: plan.id,
        runId,
      },
    });
  }

  for (const node of analysis.intelligence.dependencies.nodes) {
    const depId = buildDependencyId(node.name);
    put(byId, byKind, {
      id: depId,
      kind: "dependency",
      title: node.name,
      governance: stampCintObjectGovernance({ provenance: "Engine" }),
      refs: { runId },
    });
  }

  return {
    version: CINT_OBJECT_REGISTRY_VERSION,
    identityVersion: CINT_OBJECT_IDENTITY_VERSION,
    byId,
    byKind,
    count: Object.keys(byId).length,
  };
}

export function lookupCintObject(
  registry: CintObjectRegistry,
  id: string,
): CintObjectRegistryEntry | null {
  return registry.byId[String(id || "").trim()] ?? null;
}

export function listCintObjectsByKind(
  registry: CintObjectRegistry,
  kind: CintObjectKind,
): readonly CintObjectRegistryEntry[] {
  return (registry.byKind[kind] || []).map((id) => registry.byId[id]!).filter(Boolean);
}
