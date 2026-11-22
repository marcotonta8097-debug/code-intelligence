/**
 * Phase E / K5 — Retrieval over classified registry.
 * Default search excludes Archived. No graph DB / no LLM ranking.
 */

import type { CintObjectKind } from "@/core/codeIntelligence/codeIntelligenceObjectIdentity";
import type {
  CintClassifiedRegistry,
  CintClassifiedRegistryEntry,
  CintObjectClass,
} from "@/core/codeIntelligence/codeIntelligenceObjectClassification";

export const CINT_OBJECT_RETRIEVAL_VERSION = "CINT-ORET-1.0" as const;

export type CintObjectRetrieveQuery = Readonly<{
  id?: string;
  kind?: CintObjectKind;
  class?: CintObjectClass;
  q?: string;
  status?: string;
  trust?: string;
  /** Default false — Archived objects excluded from browse. */
  includeArchived?: boolean;
  limit?: number;
}>;

export type CintObjectRetrieveResult = Readonly<{
  version: typeof CINT_OBJECT_RETRIEVAL_VERSION;
  query: CintObjectRetrieveQuery;
  total: number;
  hits: readonly CintClassifiedRegistryEntry[];
}>;

function matchesText(entry: CintClassifiedRegistryEntry, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const hay = [
    entry.id,
    entry.title,
    entry.kind,
    entry.classification.class,
    entry.classification.labels.join(" "),
    entry.governance.status,
    entry.governance.trust,
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(needle);
}

export function retrieveCintObjects(
  registry: CintClassifiedRegistry,
  query: CintObjectRetrieveQuery = {},
): CintObjectRetrieveResult {
  if (query.id) {
    const hit = registry.byId[query.id.trim()];
    return {
      version: CINT_OBJECT_RETRIEVAL_VERSION,
      query,
      total: hit ? 1 : 0,
      hits: hit ? [hit] : [],
    };
  }

  let ids: string[] = Object.keys(registry.byId);
  if (query.kind) {
    ids = [...(registry.byKind[query.kind] || [])];
  }
  if (query.class) {
    const classSet = new Set(registry.byClass[query.class] || []);
    ids = ids.filter((id) => classSet.has(id));
  }

  const includeArchived = query.includeArchived === true;
  const hits: CintClassifiedRegistryEntry[] = [];
  for (const id of ids) {
    const entry = registry.byId[id];
    if (!entry) continue;
    if (!includeArchived && entry.governance.status === "Archived") continue;
    if (query.status && entry.governance.status !== query.status) continue;
    if (query.trust && entry.governance.trust !== query.trust) continue;
    if (query.q && !matchesText(entry, query.q)) continue;
    hits.push(entry);
  }

  const limit = typeof query.limit === "number" && query.limit > 0 ? Math.floor(query.limit) : 200;
  return {
    version: CINT_OBJECT_RETRIEVAL_VERSION,
    query,
    total: hits.length,
    hits: hits.slice(0, limit),
  };
}
