/**
 * Pack 03 — Dependency Graph Engine.
 * Manifest → node → edge. Direct vs transitive. No GitHub, no CVE lookup.
 */

import type { RepoFileSnapshot, RepositoryTreeSnapshot } from "@/core/codeIntelligence/repositoryIntelligenceEngine";

export const DEPENDENCY_GRAPH_VERSION = "CINT-DGE-1.0" as const;

export type DependencyRelation = "direct" | "transitive";

export type DependencyNode = Readonly<{
  name: string;
  version: string;
  relation: DependencyRelation;
  manifest: string;
}>;

export type DependencyGraphEdge = Readonly<{
  from: string;
  type: "DependsOn";
  to: string;
  relation: DependencyRelation;
  manifest: string;
}>;

export type DependencyGraph = Readonly<{
  repositoryId: string;
  nodes: readonly DependencyNode[];
  edges: readonly DependencyGraphEdge[];
  cycles: readonly (readonly string[])[];
  provenance: "deterministic_scan";
}>;

function baseName(path: string): string {
  return path.replace(/\\/g, "/").split("/").pop() ?? path;
}

function parsePackageJsonDirect(content: string, manifest: string): DependencyNode[] {
  try {
    const parsed = JSON.parse(content) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const nodes: DependencyNode[] = [];
    for (const [name, version] of Object.entries(parsed.dependencies ?? {})) {
      nodes.push({ name, version: String(version), relation: "direct", manifest });
    }
    for (const [name, version] of Object.entries(parsed.devDependencies ?? {})) {
      nodes.push({ name, version: String(version), relation: "direct", manifest });
    }
    return nodes;
  } catch {
    return [];
  }
}

function parsePackageLock(content: string, manifest: string): { nodes: DependencyNode[]; edges: DependencyGraphEdge[] } {
  try {
    const parsed = JSON.parse(content) as {
      packages?: Record<string, { version?: string; dependencies?: Record<string, string> }>;
      dependencies?: Record<string, { version?: string; requires?: Record<string, string>; dependencies?: Record<string, unknown> }>;
    };
    const nodes: DependencyNode[] = [];
    const edges: DependencyGraphEdge[] = [];
    const seen = new Set<string>();
    const packages = parsed.packages ?? {};
    const rootDeps = new Set(Object.keys(packages[""]?.dependencies ?? {}));
    for (const [key, meta] of Object.entries(packages)) {
      if (!key.startsWith("node_modules/")) continue;
      const name = key.replace(/^node_modules\//, "");
      if (seen.has(name)) continue;
      seen.add(name);
      const relation: DependencyRelation = rootDeps.has(name) ? "direct" : "transitive";
      nodes.push({ name, version: String(meta.version ?? "unspecified"), relation, manifest });
      for (const child of Object.keys(meta.dependencies ?? {})) {
        edges.push({ from: name, type: "DependsOn", to: child, relation: "transitive", manifest });
      }
    }
    if (nodes.length > 0) return { nodes, edges };
    const walk = (bag: Record<string, { version?: string; requires?: Record<string, string>; dependencies?: Record<string, unknown> }> | undefined, parent: string | null) => {
      if (!bag) return;
      for (const [name, meta] of Object.entries(bag)) {
        const relation: DependencyRelation = parent ? "transitive" : "direct";
        if (!seen.has(name)) {
          seen.add(name);
          nodes.push({ name, version: String(meta.version ?? "unspecified"), relation, manifest });
        }
        if (parent) {
          edges.push({ from: parent, type: "DependsOn", to: name, relation: "transitive", manifest });
        }
        const nested = meta.dependencies as Record<string, { version?: string; requires?: Record<string, string>; dependencies?: Record<string, unknown> }> | undefined;
        walk(nested, name);
        for (const child of Object.keys(meta.requires ?? {})) {
          edges.push({ from: name, type: "DependsOn", to: child, relation: "transitive", manifest });
        }
      }
    };
    walk(parsed.dependencies, null);
    return { nodes, edges };
  } catch {
    return { nodes: [], edges: [] };
  }
}

function parseRequirements(content: string, manifest: string): DependencyNode[] {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const [name, version] = line.split(/[=<>~!]+/);
      return {
        name: (name ?? line).trim(),
        version: (version ?? "unspecified").trim() || "unspecified",
        relation: "direct" as const,
        manifest,
      };
    });
}

function parseGoMod(content: string, manifest: string): { nodes: DependencyNode[]; edges: DependencyGraphEdge[] } {
  const nodes: DependencyNode[] = [];
  const edges: DependencyGraphEdge[] = [];
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    const match = line.match(/^([a-zA-Z0-9./_-]+)\s+v([0-9][^\s]+)/);
    if (!match) continue;
    const indirect = /\/\/\s*indirect\b/i.test(line);
    const name = match[1]!;
    const version = `v${match[2]}`;
    nodes.push({
      name,
      version,
      relation: indirect ? "transitive" : "direct",
      manifest,
    });
    if (indirect) {
      edges.push({ from: "Repository", type: "DependsOn", to: name, relation: "transitive", manifest });
    }
  }
  return { nodes, edges };
}

function parsePom(content: string, manifest: string): DependencyNode[] {
  const nodes: DependencyNode[] = [];
  const blocks = content.match(/<dependency>[\s\S]*?<\/dependency>/gi) ?? [];
  for (const block of blocks) {
    const artifact = block.match(/<artifactId>([^<]+)<\/artifactId>/i)?.[1]?.trim();
    const version = block.match(/<version>([^<]+)<\/version>/i)?.[1]?.trim() ?? "unspecified";
    if (artifact) nodes.push({ name: artifact, version, relation: "direct", manifest });
  }
  return nodes;
}

function parseCargo(content: string, manifest: string): DependencyNode[] {
  const nodes: DependencyNode[] = [];
  let inDeps = false;
  for (const line of content.split(/\r?\n/)) {
    if (/^\[dependencies\]/i.test(line)) {
      inDeps = true;
      continue;
    }
    if (inDeps && /^\[/.test(line)) {
      inDeps = false;
      continue;
    }
    if (!inDeps) continue;
    const match = line.match(/^([A-Za-z0-9_-]+)\s*=\s*"([^"]+)"/);
    if (match) nodes.push({ name: match[1]!, version: match[2]!, relation: "direct", manifest });
  }
  return nodes;
}

function detectCycles(edges: readonly DependencyGraphEdge[]): string[][] {
  const adj = new Map<string, string[]>();
  for (const edge of edges) {
    if (edge.from === "Repository") continue;
    const list = adj.get(edge.from) ?? [];
    list.push(edge.to);
    adj.set(edge.from, list);
  }
  const cycles: string[][] = [];
  const stack: string[] = [];
  const onStack = new Set<string>();
  const seen = new Set<string>();
  const visit = (node: string) => {
    if (onStack.has(node)) {
      const start = stack.indexOf(node);
      if (start >= 0) cycles.push([...stack.slice(start), node]);
      return;
    }
    if (seen.has(node)) return;
    seen.add(node);
    onStack.add(node);
    stack.push(node);
    for (const next of adj.get(node) ?? []) visit(next);
    stack.pop();
    onStack.delete(node);
  };
  for (const node of adj.keys()) visit(node);
  return cycles;
}

function mergeNodes(into: Map<string, DependencyNode>, node: DependencyNode): void {
  const existing = into.get(node.name);
  if (!existing) {
    into.set(node.name, node);
    return;
  }
  if (existing.relation === "transitive" && node.relation === "direct") {
    into.set(node.name, { ...existing, relation: "direct", version: node.version, manifest: node.manifest });
  }
}

export function buildDependencyGraph(tree: RepositoryTreeSnapshot): DependencyGraph {
  const byName = new Map<string, DependencyNode>();
  const edges: DependencyGraphEdge[] = [];
  const files = tree.files;
  let lockApplied = false;

  for (const file of files) {
    const base = baseName(file.path);
    const content = file.content ?? "";
    if (base === "package-lock.json" || base === "npm-shrinkwrap.json") {
      const parsed = parsePackageLock(content, base);
      for (const node of parsed.nodes) mergeNodes(byName, node);
      edges.push(...parsed.edges);
      lockApplied = parsed.nodes.length > 0;
    }
  }

  for (const file of files) {
    const base = baseName(file.path);
    const content = file.content ?? "";
    if (base === "package.json") {
      for (const node of parsePackageJsonDirect(content, "package.json")) {
        mergeNodes(byName, node);
        edges.push({
          from: "Repository",
          type: "DependsOn",
          to: node.name,
          relation: "direct",
          manifest: "package.json",
        });
      }
    } else if (base === "requirements.txt") {
      for (const node of parseRequirements(content, "requirements.txt")) {
        mergeNodes(byName, node);
        edges.push({
          from: "Repository",
          type: "DependsOn",
          to: node.name,
          relation: "direct",
          manifest: "requirements.txt",
        });
      }
    } else if (base === "go.mod") {
      const parsed = parseGoMod(content, "go.mod");
      for (const node of parsed.nodes) {
        mergeNodes(byName, node);
        edges.push({
          from: "Repository",
          type: "DependsOn",
          to: node.name,
          relation: node.relation,
          manifest: "go.mod",
        });
      }
      edges.push(...parsed.edges.filter((edge) => edge.from !== "Repository"));
    } else if (base === "pom.xml") {
      for (const node of parsePom(content, "pom.xml")) {
        mergeNodes(byName, node);
        edges.push({
          from: "Repository",
          type: "DependsOn",
          to: node.name,
          relation: "direct",
          manifest: "pom.xml",
        });
      }
    } else if (base.toLowerCase() === "cargo.toml") {
      for (const node of parseCargo(content, "Cargo.toml")) {
        mergeNodes(byName, node);
        edges.push({
          from: "Repository",
          type: "DependsOn",
          to: node.name,
          relation: "direct",
          manifest: "Cargo.toml",
        });
      }
    }
  }

  if (!lockApplied) {
    for (const node of byName.values()) {
      if (node.relation === "transitive") continue;
    }
  }

  const nodes = [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
  const uniqueEdges = [
    ...new Map(edges.map((edge) => [`${edge.from}|${edge.to}|${edge.relation}|${edge.manifest}`, edge])).values(),
  ];
  return {
    repositoryId: tree.id,
    nodes,
    edges: uniqueEdges,
    cycles: detectCycles(uniqueEdges),
    provenance: "deterministic_scan",
  };
}

const MANIFEST_NAMES = new Set([
  "package.json",
  "package-lock.json",
  "npm-shrinkwrap.json",
  "go.mod",
  "go.sum",
  "pom.xml",
  "cargo.toml",
  "cargo.lock",
  "requirements.txt",
]);

function depMentionedInSource(blob: string, name: string): boolean {
  const lower = blob.toLowerCase();
  const n = name.toLowerCase();
  if (lower.includes(`"${n}"`) || lower.includes(`'${n}'`) || lower.includes(`\`${n}\``)) return true;
  const last = n.split("/").pop() ?? n;
  return (
    lower.includes(`from '${last}'`) ||
    lower.includes(`from "${last}"`) ||
    lower.includes(`require('${last}')`) ||
    lower.includes(`require("${last}")`) ||
    lower.includes(`from '${n}'`) ||
    lower.includes(`from "${n}"`)
  );
}

export function unusedDirectDependencies(
  graph: DependencyGraph,
  files: readonly RepoFileSnapshot[],
): DependencyNode[] {
  const blob = files
    .filter((file) => !MANIFEST_NAMES.has(baseName(file.path).toLowerCase()))
    .map((file) => file.content ?? "")
    .join("\n");
  return graph.nodes.filter((node) => node.relation === "direct" && !depMentionedInSource(blob, node.name));
}
