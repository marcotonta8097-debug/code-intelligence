/**
 * Pack 08 — Architecture / Knowledge Graph Engine.
 * Deterministic module + relationship graph from repository snapshots.
 * No live tooling, no PAGE invent — feeds Architecture panel + Overview knowledge.
 */

import type { RepositoryTreeSnapshot } from "@/core/codeIntelligence/repositoryIntelligenceEngine";

export const ARCHITECTURE_KNOWLEDGE_ENGINE_VERSION = "CINT-AKE-1.0" as const;

export type ArchitectureNodeKind =
  | "module"
  | "entry"
  | "data"
  | "auth"
  | "api"
  | "config"
  | "test"
  | "docs";

export type ArchitectureGraphNode = Readonly<{
  id: string;
  label: string;
  kind: ArchitectureNodeKind;
  path: string;
  flow: "auth" | "api" | "data" | "ops" | "shared";
}>;

export type ArchitectureGraphEdge = Readonly<{
  from: string;
  to: string;
  type: "imports" | "depends_on" | "owns" | "related";
}>;

export type ArchitectureDecision = Readonly<{
  id: string;
  title: string;
  rationale: string;
  nodeIds: readonly string[];
}>;

export type KnowledgeGraphNode = Readonly<{
  id: string;
  label: string;
  kind: "repository" | "module" | "finding_anchor" | "decision" | "doc";
  refs: readonly string[];
}>;

export type ArchitectureKnowledgeSnapshot = Readonly<{
  repositoryId: string;
  nodes: readonly ArchitectureGraphNode[];
  edges: readonly ArchitectureGraphEdge[];
  decisions: readonly ArchitectureDecision[];
  knowledge: readonly KnowledgeGraphNode[];
  intendedVsObserved: readonly string[];
  provenance: "deterministic_scan";
}>;

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/");
}

function topFolder(path: string): string {
  const parts = normalizePath(path).split("/").filter(Boolean);
  return parts.length > 1 ? parts[0]! : parts[0] || "root";
}

function kindFor(path: string): ArchitectureNodeKind {
  const p = normalizePath(path).toLowerCase();
  const base = p.split("/").pop() ?? p;
  if (/(^|\/)(main|index|server|app|cmd)\.[a-z]+$/i.test(p) || base === "main.go") return "entry";
  if (/auth|session|login|jwt|oauth/.test(p)) return "auth";
  if (/db|sql|migration|redis|postgres|mongo|store|ledger/.test(p)) return "data";
  if (/api|route|handler|controller|http/.test(p)) return "api";
  if (/\.(ya?ml|toml|json|env|ini)$/i.test(base) || /config|dockerfile/.test(p)) return "config";
  if (/test|spec|_test\./.test(p)) return "test";
  if (/readme|docs?\//.test(p)) return "docs";
  return "module";
}

function flowFor(kind: ArchitectureNodeKind): ArchitectureGraphNode["flow"] {
  if (kind === "auth") return "auth";
  if (kind === "data") return "data";
  if (kind === "api" || kind === "entry") return "api";
  if (kind === "config" || kind === "docs") return "ops";
  return "shared";
}

export function buildArchitectureKnowledge(
  tree: RepositoryTreeSnapshot,
): ArchitectureKnowledgeSnapshot {
  const folders = new Map<string, string[]>();
  for (const file of tree.files) {
    const folder = topFolder(file.path);
    const list = folders.get(folder) ?? [];
    list.push(normalizePath(file.path));
    folders.set(folder, list);
  }

  const nodes: ArchitectureGraphNode[] = [];
  for (const [folder, paths] of [...folders.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const sample = paths[0] ?? folder;
    const kind = kindFor(sample);
    nodes.push({
      id: `MOD-${folder}`,
      label: folder,
      kind,
      path: folder,
      flow: flowFor(kind),
    });
  }

  // Entry anchors from notable files.
  for (const file of tree.files) {
    const kind = kindFor(file.path);
    if (kind !== "entry" && kind !== "auth" && kind !== "data") continue;
    const id = `FILE-${normalizePath(file.path).replace(/[^A-Za-z0-9]+/g, "-").toUpperCase()}`;
    if (nodes.some((n) => n.id === id)) continue;
    nodes.push({
      id,
      label: normalizePath(file.path).split("/").pop() ?? file.path,
      kind,
      path: normalizePath(file.path),
      flow: flowFor(kind),
    });
  }

  const edges: ArchitectureGraphEdge[] = [];
  const byFlow = (flow: ArchitectureGraphNode["flow"]) => nodes.filter((n) => n.flow === flow);
  const auth = byFlow("auth");
  const api = byFlow("api");
  const data = byFlow("data");
  for (const a of api.slice(0, 4)) {
    for (const b of auth.slice(0, 2)) {
      edges.push({ from: a.id, to: b.id, type: "depends_on" });
    }
    for (const d of data.slice(0, 2)) {
      edges.push({ from: a.id, to: d.id, type: "depends_on" });
    }
  }
  for (let i = 0; i < nodes.length - 1 && edges.length < 24; i += 1) {
    const left = nodes[i]!;
    const right = nodes[i + 1]!;
    if (left.flow === right.flow) {
      edges.push({ from: left.id, to: right.id, type: "related" });
    }
  }

  const decisions: ArchitectureDecision[] = [
    {
      id: `AD-${tree.id}-BOUNDARY`,
      title: "Module boundary from folder layout",
      rationale: "Observed folders become architecture nodes; no invented services.",
      nodeIds: nodes.filter((n) => n.kind === "module").slice(0, 6).map((n) => n.id),
    },
    {
      id: `AD-${tree.id}-AUTH-DATA`,
      title: "Auth and data flows inferred from path signals",
      rationale: "Path heuristics classify auth/data/api — evidence for Architecture page only.",
      nodeIds: [...auth, ...data].slice(0, 6).map((n) => n.id),
    },
  ];

  const knowledge: KnowledgeGraphNode[] = [
    {
      id: `KG-REPO-${tree.id}`,
      label: tree.id,
      kind: "repository",
      refs: nodes.slice(0, 8).map((n) => n.id),
    },
    ...decisions.map((d) => ({
      id: `KG-${d.id}`,
      label: d.title,
      kind: "decision" as const,
      refs: d.nodeIds,
    })),
    ...nodes.slice(0, 10).map((n) => ({
      id: `KG-${n.id}`,
      label: n.label,
      kind: "module" as const,
      refs: [n.id],
    })),
  ];

  const intendedVsObserved = [
    `Intended: modular ${tree.id} with clear auth/data/api boundaries`,
    `Observed: ${nodes.length} architecture nodes · ${edges.length} relationships from snapshot`,
    auth.length === 0 ? "Observed gap: no auth-path signals in snapshot" : "Observed: auth-path signals present",
    data.length === 0 ? "Observed gap: no data-store path signals" : "Observed: data-path signals present",
  ];

  return {
    repositoryId: tree.id,
    nodes,
    edges,
    decisions,
    knowledge,
    intendedVsObserved,
    provenance: "deterministic_scan",
  };
}

export function buildDemoArchitectureKnowledge(
  trees: Readonly<Record<string, RepositoryTreeSnapshot>>,
): Record<string, ArchitectureKnowledgeSnapshot> {
  return Object.fromEntries(
    Object.entries(trees).map(([id, tree]) => [id, buildArchitectureKnowledge(tree)]),
  );
}
