/**
 * Phase E compose — K1→K2→K3→K5/K4 ready bundle for serialize + Knowledge UI.
 * Order: identity (assumed on objects) → registry → classify → relationships.
 * Retrieval is a function over the classified registry (K5).
 */

import {
  buildCintObjectRegistryFromAnalysis,
  type CintObjectRegistry,
  type CintRegistryAnalysisInput,
} from "@/core/codeIntelligence/codeIntelligenceObjectRegistry";
import {
  classifyCintObjectRegistry,
  type CintClassifiedRegistry,
} from "@/core/codeIntelligence/codeIntelligenceObjectClassification";
import {
  buildCintObjectRelationships,
  type CintObjectRelationshipGraph,
} from "@/core/codeIntelligence/codeIntelligenceObjectRelationships";
import {
  retrieveCintObjects,
  type CintObjectRetrieveQuery,
  type CintObjectRetrieveResult,
} from "@/core/codeIntelligence/codeIntelligenceObjectRetrieval";

export const CINT_KIL_BUNDLE_VERSION = "CINT-KIL-1.0" as const;

export type CintKilBundle = Readonly<{
  version: typeof CINT_KIL_BUNDLE_VERSION;
  registry: CintObjectRegistry;
  classified: CintClassifiedRegistry;
  relationships: CintObjectRelationshipGraph;
}>;

export function buildCintKilBundle(
  analysis: CintRegistryAnalysisInput,
  options?: { runId?: string | null },
): CintKilBundle {
  const registry = buildCintObjectRegistryFromAnalysis(analysis, options);
  const classified = classifyCintObjectRegistry(registry);
  const relationships = buildCintObjectRelationships(classified);
  return {
    version: CINT_KIL_BUNDLE_VERSION,
    registry,
    classified,
    relationships,
  };
}

export function retrieveFromKilBundle(
  bundle: CintKilBundle,
  query: CintObjectRetrieveQuery = {},
): CintObjectRetrieveResult {
  return retrieveCintObjects(bundle.classified, query);
}

/** Compact client payload — enough for read-only Knowledge UI. */
export function serializeCintKilForClient(bundle: CintKilBundle) {
  return {
    version: bundle.version,
    registry: {
      version: bundle.registry.version,
      identityVersion: bundle.registry.identityVersion,
      count: bundle.registry.count,
      byKind: bundle.registry.byKind,
      byId: bundle.registry.byId,
    },
    classified: {
      version: bundle.classified.version,
      count: bundle.classified.count,
      byClass: bundle.classified.byClass,
      byId: Object.fromEntries(
        Object.entries(bundle.classified.byId).map(([id, entry]) => [
          id,
          {
            id: entry.id,
            kind: entry.kind,
            title: entry.title,
            class: entry.classification.class,
            labels: entry.classification.labels,
            status: entry.governance.status,
            trust: entry.governance.trust,
            refs: entry.refs,
          },
        ]),
      ),
    },
    relationships: {
      version: bundle.relationships.version,
      count: bundle.relationships.count,
      edges: bundle.relationships.edges,
    },
  };
}
