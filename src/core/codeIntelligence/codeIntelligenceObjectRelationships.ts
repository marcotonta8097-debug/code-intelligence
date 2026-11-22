/**
 * Phase E / K4 — Relationships between catalogued objects.
 * Derived from sealed refs — not a graph database, not invented edges.
 */

import type { CintClassifiedRegistry } from "@/core/codeIntelligence/codeIntelligenceObjectClassification";

export const CINT_OBJECT_RELATIONSHIPS_VERSION = "CINT-OREL-1.0" as const;

export const CINT_OBJECT_EDGE_TYPES = [
  "has_evidence",
  "evidenced_by",
  "has_remediation",
  "remediates",
  "part_of_run",
  "run_includes",
] as const;

export type CintObjectEdgeType = (typeof CINT_OBJECT_EDGE_TYPES)[number];

export type CintObjectEdge = Readonly<{
  id: string;
  type: CintObjectEdgeType;
  from: string;
  to: string;
}>;

export type CintObjectRelationshipGraph = Readonly<{
  version: typeof CINT_OBJECT_RELATIONSHIPS_VERSION;
  edges: readonly CintObjectEdge[];
  byFrom: Readonly<Record<string, readonly CintObjectEdge[]>>;
  byTo: Readonly<Record<string, readonly CintObjectEdge[]>>;
  count: number;
}>;

function edgeId(type: CintObjectEdgeType, from: string, to: string): string {
  return `${type}:${from}->${to}`;
}

export function buildCintObjectRelationships(
  registry: CintClassifiedRegistry,
): CintObjectRelationshipGraph {
  const edges: CintObjectEdge[] = [];
  const seen = new Set<string>();

  const add = (type: CintObjectEdgeType, from: string, to: string) => {
    if (!registry.byId[from] || !registry.byId[to]) return;
    const id = edgeId(type, from, to);
    if (seen.has(id)) return;
    seen.add(id);
    edges.push({ id, type, from, to });
  };

  for (const entry of Object.values(registry.byId)) {
    const findingId = entry.refs.findingId;
    const runId = entry.refs.runId;

    if (entry.kind === "finding") {
      for (const eid of entry.refs.evidenceIds || []) {
        add("has_evidence", entry.id, eid);
        add("evidenced_by", eid, entry.id);
      }
      if (runId) {
        add("part_of_run", entry.id, runId);
        add("run_includes", runId, entry.id);
      }
    }

    if (entry.kind === "evidence" && findingId) {
      add("evidenced_by", entry.id, findingId);
      add("has_evidence", findingId, entry.id);
      if (runId) {
        add("part_of_run", entry.id, runId);
        add("run_includes", runId, entry.id);
      }
    }

    if (entry.kind === "remediation" && findingId) {
      add("remediates", entry.id, findingId);
      add("has_remediation", findingId, entry.id);
      for (const eid of entry.refs.evidenceIds || []) {
        add("has_evidence", entry.id, eid);
      }
      if (runId) {
        add("part_of_run", entry.id, runId);
        add("run_includes", runId, entry.id);
      }
    }

    if (entry.kind === "dependency" && runId) {
      add("part_of_run", entry.id, runId);
      add("run_includes", runId, entry.id);
    }
  }

  const byFrom: Record<string, CintObjectEdge[]> = {};
  const byTo: Record<string, CintObjectEdge[]> = {};
  for (const edge of edges) {
    (byFrom[edge.from] ||= []).push(edge);
    (byTo[edge.to] ||= []).push(edge);
  }

  return {
    version: CINT_OBJECT_RELATIONSHIPS_VERSION,
    edges,
    byFrom,
    byTo,
    count: edges.length,
  };
}

export function edgesForObject(
  graph: CintObjectRelationshipGraph,
  id: string,
): readonly CintObjectEdge[] {
  const key = String(id || "").trim();
  const out = [...(graph.byFrom[key] || []), ...(graph.byTo[key] || [])];
  const seen = new Set<string>();
  return out.filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
}
