/**
 * Pack 04 — Finding Engine.
 * Claims without evidence are invalid (FINDING_EVIDENCE_MISSING).
 * Snapshot-only: no live GitHub, CVE, or source mutation.
 */

import type { DependencyGraph } from "@/core/codeIntelligence/dependencyGraphEngine";
import { unusedDirectDependencies } from "@/core/codeIntelligence/dependencyGraphEngine";
import type { RepoFileSnapshot, RepositoryTreeSnapshot } from "@/core/codeIntelligence/repositoryIntelligenceEngine";
import type {
  CintConfidence,
  CintFindingCategory,
  CintSeverity,
} from "@/core/domainPack/codeIntelligenceContracts";
import type { EvidenceType } from "@/core/domainPack/taxonomyRegistry";
import {
  enforceFindingEvidence,
  type FindingVerificationStatus,
} from "@/core/codeIntelligence/codeIntelligenceEvidenceEnforcement";
import { buildEvidenceId } from "@/core/codeIntelligence/codeIntelligenceObjectIdentity";

export const FINDING_ENGINE_VERSION = "CINT-FE-1.0" as const;

export const FINDING_KINDS = [
  "dead_files",
  "large_files",
  "duplicate_logic",
  "circular_dependencies",
  "unused_dependencies",
  "broken_references",
  "missing_documentation",
  "configuration_risks",
] as const;

export type FindingKind = (typeof FINDING_KINDS)[number];

export type EngineEvidence = Readonly<{
  id: string;
  kind: EvidenceType;
  summary: string;
  location: string;
  snippet: string;
  provenance: "deterministic_scan";
}>;

export type EngineFinding = Readonly<{
  id: string;
  repositoryId: string;
  kind: FindingKind;
  title: string;
  category: CintFindingCategory;
  severity: CintSeverity;
  confidence: CintConfidence;
  lifecycle: "DETECTED";
  why: string;
  evidence: readonly EngineEvidence[];
  provenance: "deterministic_scan";
}>;

export class FindingEvidenceMissingError extends Error {
  readonly code = "FINDING_EVIDENCE_MISSING" as const;
  constructor(readonly findingId: string) {
    super(`FINDING_EVIDENCE_MISSING: ${findingId}`);
    this.name = "FindingEvidenceMissingError";
  }
}

const SOURCE_EXT = new Set(["ts", "tsx", "js", "jsx", "go", "py", "rs", "java"]);
const ENTRY_RE = /(^|\/)(index|main|server|app|manage)\.[a-z]+$/i;
/** Tooling / test runners discover these by basename or glob — not by import graph. */
const CONVENTION_BASENAME_RE =
  /^(vite|vitest|playwright|eslint|prettier|postcss|tailwind|next|nuxt|astro|remix|webpack|rollup|babel|jest|cypress|capacitor|electron)(\.config)?\.[cm]?[jt]sx?$/i;
const ROOT_CONFIG_RE = /^[^/]+\.config\.[cm]?[jt]sx?$/i;
const CONVENTION_SPEC_RE =
  /(^|\/)(e2e|tests?|__tests__|spec)\/.+\.(spec|test)\.[cm]?[jt]sx?$/i;
const LARGE_BYTES = 800;

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/");
}

function extOf(path: string): string {
  const base = normalizePath(path).split("/").pop() ?? path;
  const dot = base.lastIndexOf(".");
  return dot > 0 ? base.slice(dot + 1).toLowerCase() : "";
}

function isSource(file: RepoFileSnapshot): boolean {
  return SOURCE_EXT.has(extOf(file.path));
}

function isEntry(file: RepoFileSnapshot): boolean {
  const path = normalizePath(file.path);
  return ENTRY_RE.test(path) || /\/cmd\/.*\.go$/i.test(path);
}

function isConventionDiscovered(file: RepoFileSnapshot): boolean {
  const path = normalizePath(file.path);
  const base = path.split("/").pop() ?? path;
  if (CONVENTION_BASENAME_RE.test(base)) return true;
  if (ROOT_CONFIG_RE.test(path)) return true;
  if (CONVENTION_SPEC_RE.test(path)) return true;
  if (/(^|\/)playwright\/.+\.[cm]?[jt]sx?$/i.test(path)) return true;
  return false;
}

function snippet(content: string, max = 160): string {
  return content.replace(/\s+/g, " ").trim().slice(0, max);
}

function evidenceId(findingId: string, index: number): string {
  // K1 identity owner — keep local helper name for call sites.
  return buildEvidenceId(findingId, index);
}

function sealFinding(draft: Omit<EngineFinding, "evidence"> & { evidence: EngineEvidence[] }): EngineFinding {
  if (draft.evidence.length === 0) throw new FindingEvidenceMissingError(draft.id);
  return {
    ...draft,
    evidence: draft.evidence.map((item, index) => ({
      ...item,
      id: item.id || evidenceId(draft.id, index),
    })),
  };
}

function relativeImports(content: string): string[] {
  const found: string[] = [];
  const patterns = [
    /from\s+['"](\.[^'"]+)['"]/g,
    /require\(\s*['"](\.[^'"]+)['"]\s*\)/g,
    /import\s+['"](\.[^'"]+)['"]/g,
  ];
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content))) found.push(match[1]!);
  }
  return found;
}

function goImports(content: string): string[] {
  const block = content.match(/import\s*(?:\(\s*([\s\S]*?)\)|['"]([^'"]+)['"])/);
  if (!block) return [];
  const body = block[1] ?? block[2] ?? "";
  return [...body.matchAll(/['"]([^'"]+)['"]/g)].map((match) => match[1]!);
}

function resolveRelative(fromFile: string, spec: string, files: readonly RepoFileSnapshot[]): string | null {
  const dir = normalizePath(fromFile).split("/").slice(0, -1).filter(Boolean).join("/");
  // Root files (vite.config.ts) must not become "/src/..." — leading slash never matches snapshot paths.
  const raw = dir ? `${dir}/${spec}` : spec;
  const joined = normalizePath(raw)
    .replace(/\/\.\//g, "/")
    .replace(/^\.\//, "")
    .replace(/^\/+/, "");
  const bases = [joined, joined.replace(/\/+$/, "")].filter(Boolean);
  const candidates: string[] = [];
  for (const base of bases) {
    candidates.push(
      base,
      `${base}.ts`,
      `${base}.tsx`,
      `${base}.js`,
      `${base}.go`,
      `${base}/index.ts`,
      `${base}/index.js`,
    );
  }
  const available = new Set(files.map((file) => normalizePath(file.path)));
  return candidates.find((candidate) => available.has(candidate)) ?? null;
}

function isPlaceholderSecretValue(value: string): boolean {
  const v = value.replace(/^["']|["']$/g, "").trim();
  if (!v) return true;
  if (/^\.{2,}$/.test(v) || v === "…" || v === "...") return true;
  if (/^(xxx+|placeholder|changeme|replace[_-]?me|redacted|todo|tbd)$/i.test(v)) return true;
  if (/^your[_-].+/i.test(v) || /^<.*>$/.test(v) || /^\$\{.+\}$/.test(v)) return true;
  if (/^(sk|pk|rk)_(test|live)_?\.*$/i.test(v)) return true;
  if (/^(whsec_|sk_test_|pk_test_)\.*$/i.test(v)) return true;
  if (v.length < 4) return true;
  return false;
}

/** Line-aware secret scan — skip comments and placeholder/example values. */
function matchCommittedSecret(content: string): RegExpMatchArray | null {
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("//")) continue;
    const secret = trimmed.match(/(jwtSecret|api[_-]?key|password)\s*[:=]\s*["']?([^\s"']+)/i);
    if (!secret?.[2]) continue;
    if (isPlaceholderSecretValue(secret[2])) continue;
    return secret;
  }
  return null;
}

function fileImportGraph(files: readonly RepoFileSnapshot[]): Map<string, string[]> {
  const graph = new Map<string, string[]>();
  for (const file of files) {
    if (!isSource(file)) continue;
    const path = normalizePath(file.path);
    const specs = [...relativeImports(file.content ?? ""), ...goImports(file.content ?? "")];
    const resolved: string[] = [];
    for (const spec of specs) {
      if (spec.startsWith(".")) {
        const hit = resolveRelative(path, spec, files);
        if (hit) resolved.push(hit);
      } else {
        const maybe = files.find((candidate) =>
          normalizePath(candidate.path).endsWith(`${spec.replace(/^[^/]+\//, "")}.go`)
          || normalizePath(candidate.path).includes(spec.split("/").slice(-2).join("/")),
        );
        if (maybe) resolved.push(normalizePath(maybe.path));
      }
    }
    graph.set(path, resolved);
  }
  return graph;
}

function inboundRefs(files: readonly RepoFileSnapshot[]): Set<string> {
  const inbound = new Set<string>();
  const graph = fileImportGraph(files);
  for (const targets of graph.values()) {
    for (const target of targets) inbound.add(target);
  }
  for (const file of files) {
    const path = normalizePath(file.path);
    const base = path.split("/").pop() ?? path;
    if (base.length < 4) continue;
    for (const other of files) {
      if (other.path === file.path) continue;
      if ((other.content ?? "").includes(base.replace(/\.[a-z]+$/i, "")) && isSource(other)) {
        inbound.add(path);
      }
    }
  }
  return inbound;
}

function detectDeadFiles(tree: RepositoryTreeSnapshot): EngineFinding[] {
  const inbound = inboundRefs(tree.files);
  const findings: EngineFinding[] = [];
  for (const file of tree.files) {
    if (!isSource(file) || isEntry(file) || isConventionDiscovered(file)) continue;
    const path = normalizePath(file.path);
    if (inbound.has(path)) continue;
    const id = `F-DEAD-${path.replace(/[^A-Za-z0-9]+/g, "-").toUpperCase()}`;
    findings.push(
      sealFinding({
        id,
        repositoryId: tree.id,
        kind: "dead_files",
        title: `Dead file ${path}`,
        category: "MAINT",
        severity: "SEV-4",
        confidence: "HIGH_CONFIDENCE",
        lifecycle: "DETECTED",
        why: "No inbound import or basename reference exists in this snapshot.",
        evidence: [
          {
            id: "",
            kind: "SOURCE_CODE",
            summary: "File is present but never referenced by another snapshot file.",
            location: path,
            snippet: snippet(file.content ?? path),
            provenance: "deterministic_scan",
          },
        ],
        provenance: "deterministic_scan",
      }),
    );
  }
  return findings;
}

function detectLargeFiles(tree: RepositoryTreeSnapshot): EngineFinding[] {
  const findings: EngineFinding[] = [];
  for (const file of tree.files) {
    const size = file.bytes ?? (file.content ?? "").length;
    if (size < LARGE_BYTES) continue;
    const path = normalizePath(file.path);
    const id = `F-LARGE-${path.replace(/[^A-Za-z0-9]+/g, "-").toUpperCase()}`;
    findings.push(
      sealFinding({
        id,
        repositoryId: tree.id,
        kind: "large_files",
        title: `Large file ${path}`,
        category: "MAINT",
        severity: "SEV-4",
        confidence: "CONFIRMED",
        lifecycle: "DETECTED",
        why: `Snapshot size ${size} bytes exceeds the ${LARGE_BYTES}-byte review threshold.`,
        evidence: [
          {
            id: "",
            kind: "SOURCE_CODE",
            summary: `Measured ${size} bytes in the sealed snapshot.`,
            location: path,
            snippet: snippet(file.content ?? "", 80),
            provenance: "deterministic_scan",
          },
        ],
        provenance: "deterministic_scan",
      }),
    );
  }
  return findings;
}

function detectDuplicates(tree: RepositoryTreeSnapshot): EngineFinding[] {
  const buckets = new Map<string, RepoFileSnapshot[]>();
  for (const file of tree.files) {
    if (!isSource(file)) continue;
    const body = (file.content ?? "").trim();
    if (body.length < 24) continue;
    const list = buckets.get(body) ?? [];
    list.push(file);
    buckets.set(body, list);
  }
  const findings: EngineFinding[] = [];
  for (const group of buckets.values()) {
    if (group.length < 2) continue;
    const paths = group.map((file) => normalizePath(file.path)).sort();
    const id = `F-DUP-${paths.join("-").replace(/[^A-Za-z0-9]+/g, "-").slice(0, 48).toUpperCase()}`;
    findings.push(
      sealFinding({
        id,
        repositoryId: tree.id,
        kind: "duplicate_logic",
        title: `Duplicate logic ${paths.join(" · ")}`,
        category: "DUP",
        severity: "SEV-3",
        confidence: "HIGH_CONFIDENCE",
        lifecycle: "DETECTED",
        why: "Two or more source files in the snapshot have identical bodies.",
        evidence: group.map((file) => ({
          id: "",
          kind: "SOURCE_CODE" as const,
          summary: "Identical snapshot body.",
          location: normalizePath(file.path),
          snippet: snippet(file.content ?? ""),
          provenance: "deterministic_scan" as const,
        })),
        provenance: "deterministic_scan",
      }),
    );
  }
  return findings;
}

function detectFileCycles(tree: RepositoryTreeSnapshot): EngineFinding[] {
  const graph = fileImportGraph(tree.files);
  const findings: EngineFinding[] = [];
  const stack: string[] = [];
  const onStack = new Set<string>();
  const seen = new Set<string>();
  const visit = (node: string) => {
    if (onStack.has(node)) {
      const cycle = [...stack.slice(stack.indexOf(node)), node];
      if (cycle.length > 2) {
        const id = `F-CYCLE-${cycle.join("-").replace(/[^A-Za-z0-9]+/g, "-").slice(0, 48).toUpperCase()}`;
        findings.push(
          sealFinding({
            id,
            repositoryId: tree.id,
            kind: "circular_dependencies",
            title: `Circular import ${cycle.join(" → ")}`,
            category: "ARCH",
            severity: "SEV-2",
            confidence: "CONFIRMED",
            lifecycle: "DETECTED",
            why: "Import graph in this snapshot contains a cycle.",
            evidence: cycle.map((path) => ({
              id: "",
              kind: "SOURCE_CODE" as const,
              summary: "Member of an import cycle.",
              location: path,
              snippet: snippet(tree.files.find((file) => normalizePath(file.path) === path)?.content ?? path),
              provenance: "deterministic_scan" as const,
            })),
            provenance: "deterministic_scan",
          }),
        );
      }
      return;
    }
    if (seen.has(node)) return;
    seen.add(node);
    onStack.add(node);
    stack.push(node);
    for (const next of graph.get(node) ?? []) visit(next);
    stack.pop();
    onStack.delete(node);
  };
  for (const node of graph.keys()) visit(node);
  return findings;
}

function detectUnusedDeps(tree: RepositoryTreeSnapshot, graph: DependencyGraph): EngineFinding[] {
  return unusedDirectDependencies(graph, tree.files).map((node) => {
    const id = `F-UNUSEDEP-${node.name.replace(/[^A-Za-z0-9]+/g, "-").toUpperCase()}`;
    return sealFinding({
      id,
      repositoryId: tree.id,
      kind: "unused_dependencies",
      title: `Unused dependency ${node.name}`,
      category: "DEPS",
      severity: "SEV-3",
      confidence: "HIGH_CONFIDENCE",
      lifecycle: "DETECTED",
      why: "Direct manifest dependency never appears in snapshot source.",
      evidence: [
        {
          id: "",
          kind: "DEPENDENCY",
          summary: `${node.name}@${node.version} listed as ${node.relation} in ${node.manifest}.`,
          location: node.manifest,
          snippet: `${node.name}@${node.version}`,
          provenance: "deterministic_scan",
        },
      ],
      provenance: "deterministic_scan",
    });
  });
}

function detectBrokenRefs(tree: RepositoryTreeSnapshot): EngineFinding[] {
  const findings: EngineFinding[] = [];
  for (const file of tree.files) {
    if (!isSource(file)) continue;
    for (const spec of relativeImports(file.content ?? "")) {
      if (resolveRelative(file.path, spec, tree.files)) continue;
      const path = normalizePath(file.path);
      const id = `F-BROKEN-${path.replace(/[^A-Za-z0-9]+/g, "-").toUpperCase()}`;
      findings.push(
        sealFinding({
          id,
          repositoryId: tree.id,
          kind: "broken_references",
          title: `Broken reference ${spec} in ${path}`,
          category: "MAINT",
          severity: "SEV-2",
          confidence: "CONFIRMED",
          lifecycle: "DETECTED",
          why: "Relative import does not resolve to a file in this snapshot.",
          evidence: [
            {
              id: "",
              kind: "SOURCE_CODE",
              summary: `Import spec ${spec} is unresolved.`,
              location: path,
              snippet: snippet(file.content ?? spec),
              provenance: "deterministic_scan",
            },
          ],
          provenance: "deterministic_scan",
        }),
      );
    }
  }
  return findings;
}

function detectMissingDocs(tree: RepositoryTreeSnapshot): EngineFinding[] {
  const hasReadme = tree.files.some((file) => /^readme(\.md)?$/i.test(normalizePath(file.path).split("/").pop() ?? ""));
  const hasDocs = tree.files.some((file) => normalizePath(file.path).startsWith("docs/"));
  if (hasReadme || hasDocs) return [];
  return [
    sealFinding({
      id: `F-DOC-${tree.id.toUpperCase()}`,
      repositoryId: tree.id,
      kind: "missing_documentation",
      title: "Missing documentation",
      category: "DOC",
      severity: "SEV-4",
      confidence: "CONFIRMED",
      lifecycle: "DETECTED",
      why: "Snapshot has neither README nor docs/ files.",
      evidence: [
        {
          id: "",
          kind: "DOCUMENTATION",
          summary: `Inventoried ${tree.files.length} files; none are README or docs/.`,
          location: tree.files.map((file) => normalizePath(file.path)).sort().join(", "),
          snippet: tree.files.map((file) => normalizePath(file.path)).sort().join("\n"),
          provenance: "deterministic_scan",
        },
      ],
      provenance: "deterministic_scan",
    }),
  ];
}

function detectConfigRisks(tree: RepositoryTreeSnapshot): EngineFinding[] {
  const findings: EngineFinding[] = [];
  for (const file of tree.files) {
    const content = file.content ?? "";
    const path = normalizePath(file.path);
    const secret = matchCommittedSecret(content);
    if (secret) {
      findings.push(
        sealFinding({
          id: `F-SECRET-${path.replace(/[^A-Za-z0-9]+/g, "-").toUpperCase()}`,
          repositoryId: tree.id,
          kind: "configuration_risks",
          title: `Secret material in ${path}`,
          category: "SECRETS",
          severity: "SEV-1",
          confidence: "CONFIRMED",
          lifecycle: "DETECTED",
          why: "Committed configuration contains a secret-like value.",
          evidence: [
            {
              id: "",
              kind: "CONFIGURATION",
              summary: `${secret[1]} is present in the snapshot.`,
              location: path,
              snippet: snippet(secret[0]),
              provenance: "deterministic_scan",
            },
          ],
          provenance: "deterministic_scan",
        }),
      );
    }
    if (/secure\s*:\s*false/i.test(content) || /secure\s*=\s*false/i.test(content)) {
      findings.push(
        sealFinding({
          id: `F-AUTH-${path.replace(/[^A-Za-z0-9]+/g, "-").toUpperCase()}`,
          repositoryId: tree.id,
          kind: "configuration_risks",
          title: `Insecure cookie flag in ${path}`,
          category: "AUTH",
          severity: "SEV-1",
          confidence: "CONFIRMED",
          lifecycle: "DETECTED",
          why: "Session/cookie configuration omits Secure in this snapshot.",
          evidence: [
            {
              id: "",
              kind: "CONFIGURATION",
              summary: "secure: false observed in source.",
              location: path,
              snippet: snippet(content),
              provenance: "deterministic_scan",
            },
          ],
          provenance: "deterministic_scan",
        }),
      );
    }
  }
  return findings;
}

export function assertFindingsHaveEvidence(findings: readonly EngineFinding[]): void {
  for (const finding of findings) {
    if (!finding.evidence.length) throw new FindingEvidenceMissingError(finding.id);
    const primary = finding.evidence[0];
    const gate = enforceFindingEvidence({
      findingId: finding.id,
      evidenceIds: finding.evidence.map((e) => e.id).filter(Boolean),
      evidenceSummary: primary?.summary,
      evidenceTimestamp: "demo-clock",
      criteria: finding.why,
      confidence: finding.confidence,
      specialist: finding.category === "AUTH" || finding.category === "SECRETS"
        ? "security_specialist"
        : "quality_specialist",
      location: primary?.location,
      claimedVerified: finding.confidence === "CONFIRMED",
    });
    if (!gate.checks.find((c) => c.id === "exists")?.ok) {
      throw new FindingEvidenceMissingError(finding.id);
    }
  }
}

/** Phase 8 — attach enforcement status without inventing verified claims. */
export function verificationStatusForFinding(finding: EngineFinding): FindingVerificationStatus {
  const primary = finding.evidence[0];
  return enforceFindingEvidence({
    findingId: finding.id,
    evidenceIds: finding.evidence.map((e) => e.id).filter(Boolean),
    evidenceSummary: primary?.summary,
    evidenceTimestamp: finding.evidence.length ? "demo-clock" : null,
    criteria: finding.why,
    confidence: finding.confidence,
    specialist:
      finding.category === "AUTH" || finding.category === "SECRETS"
        ? "security_specialist"
        : "architecture_specialist",
    location: primary?.location,
  }).status;
}

export function runFindingEngine(tree: RepositoryTreeSnapshot, graph: DependencyGraph): EngineFinding[] {
  const findings = [
    ...detectDeadFiles(tree),
    ...detectLargeFiles(tree),
    ...detectDuplicates(tree),
    ...detectFileCycles(tree),
    ...detectUnusedDeps(tree, graph),
    ...detectBrokenRefs(tree),
    ...detectMissingDocs(tree),
    ...detectConfigRisks(tree),
  ];
  assertFindingsHaveEvidence(findings);
  const seen = new Set<string>();
  return findings.filter((finding) => {
    if (seen.has(finding.id)) return false;
    seen.add(finding.id);
    return true;
  });
}
