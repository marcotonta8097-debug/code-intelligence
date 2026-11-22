/**
 * Pack 05 — Evidence Explorer.
 * Findings are not claims: every finding is indexed to typed evidence.
 * Screenshot/stack-trace sources are emitted only when present in the snapshot.
 */

import {
  FindingEvidenceMissingError,
  type EngineFinding,
} from "@/core/codeIntelligence/findingEngine";
import type { RepositoryTreeSnapshot } from "@/core/codeIntelligence/repositoryIntelligenceEngine";
import { EVIDENCE_TYPE_VALUES, type EvidenceType } from "@/core/domainPack/taxonomyRegistry";

export const EVIDENCE_EXPLORER_VERSION = "CINT-EE-1.0" as const;

export const EVIDENCE_SOURCE_SLOTS = [
  "code_snippets",
  "file_references",
  "stack_traces",
  "screenshots",
  "logs",
  "configs",
  "commit_history",
] as const;

export type EvidenceSourceSlot = (typeof EVIDENCE_SOURCE_SLOTS)[number];

export const EVIDENCE_SLOT_TO_KIND: Readonly<Record<EvidenceSourceSlot, EvidenceType | null>> = {
  code_snippets: "SOURCE_CODE",
  file_references: "SOURCE_CODE",
  stack_traces: "LOG",
  screenshots: null,
  logs: "LOG",
  configs: "CONFIGURATION",
  commit_history: "COMMIT_HISTORY",
};

export type EvidenceRecord = Readonly<{
  id: string;
  findingId: string;
  repositoryId: string;
  kind: EvidenceType;
  slot: EvidenceSourceSlot;
  summary: string;
  location: string;
  snippet: string;
  provenance: "deterministic_scan";
}>;

export type EvidenceQuery = Readonly<{
  repositoryId?: string;
  findingId?: string;
  kind?: EvidenceType | "all";
  slot?: EvidenceSourceSlot | "all";
  q?: string;
}>;

function looksLikeStack(text: string): boolean {
  return /\b(at\s+\S+\s+\(|Traceback \(most recent call last\)|Error:)/i.test(text);
}

function slotForKind(kind: EvidenceType, snippet: string): EvidenceSourceSlot {
  if (kind === "CONFIGURATION") return "configs";
  if (kind === "LOG") return looksLikeStack(snippet) ? "stack_traces" : "logs";
  if (kind === "COMMIT_HISTORY") return "commit_history";
  if (kind === "DEPENDENCY") return "file_references";
  if (kind === "DOCUMENTATION") return "file_references";
  return snippet.trim() ? "code_snippets" : "file_references";
}

function indexSnapshotLogs(
  tree: RepositoryTreeSnapshot,
  findings: readonly EngineFinding[],
): EvidenceRecord[] {
  const records: EvidenceRecord[] = [];
  for (const file of tree.files) {
    const path = file.path.replace(/\\/g, "/");
    const content = file.content ?? "";
    if (!content.trim()) continue;
    const isLog = /\.log$/i.test(path) || /(^|\/)logs\//i.test(path);
    if (!isLog) continue;
    const slot: EvidenceSourceSlot = looksLikeStack(content) ? "stack_traces" : "logs";
    const matches = findings.filter((finding) =>
      finding.evidence.some((item) => item.location && content.includes(item.location)),
    );
    const targets = matches.length ? matches : [];
    for (const finding of targets) {
      records.push({
        id: `E-${finding.id}-LOG-${path.replace(/[^A-Za-z0-9]+/g, "-").toUpperCase()}`,
        findingId: finding.id,
        repositoryId: finding.repositoryId,
        kind: "LOG",
        slot,
        summary: `Snapshot ${slot.replace("_", " ")} mentioning ${finding.id}`,
        location: path,
        snippet: content.replace(/\s+/g, " ").trim().slice(0, 240),
        provenance: "deterministic_scan",
      });
    }
  }
  return records;
}

export function indexFindingEvidence(
  findings: readonly EngineFinding[],
  options?: { commits?: Readonly<Record<string, string>>; tree?: RepositoryTreeSnapshot },
): EvidenceRecord[] {
  const records: EvidenceRecord[] = [];
  for (const finding of findings) {
    if (!finding.evidence.length) throw new FindingEvidenceMissingError(finding.id);
    finding.evidence.forEach((item, index) => {
      records.push({
        id: item.id || `E-${finding.id}-${index + 1}`,
        findingId: finding.id,
        repositoryId: finding.repositoryId,
        kind: item.kind,
        slot: slotForKind(item.kind, item.snippet),
        summary: item.summary,
        location: item.location,
        snippet: item.snippet,
        provenance: "deterministic_scan",
      });
      if (item.location && item.kind !== "COMMIT_HISTORY") {
        records.push({
          id: `E-${finding.id}-FILE-${index + 1}`,
          findingId: finding.id,
          repositoryId: finding.repositoryId,
          kind: item.kind === "CONFIGURATION" ? "CONFIGURATION" : "SOURCE_CODE",
          slot: "file_references",
          summary: `File reference for ${finding.id}`,
          location: item.location,
          snippet: item.location,
          provenance: "deterministic_scan",
        });
      }
    });
    const commit = options?.commits?.[finding.repositoryId];
    if (commit) {
      records.push({
        id: `E-${finding.id}-COMMIT`,
        findingId: finding.id,
        repositoryId: finding.repositoryId,
        kind: "COMMIT_HISTORY",
        slot: "commit_history",
        summary: `Bound to snapshot commit ${commit}. No git log is in the tree.`,
        location: commit,
        snippet: commit,
        provenance: "deterministic_scan",
      });
    }
  }
  if (options?.tree) {
    records.push(...indexSnapshotLogs(options.tree, findings));
  }
  const seen = new Set<string>();
  return records.filter((record) => {
    if (seen.has(record.id)) return false;
    seen.add(record.id);
    return true;
  });
}

export function assertEvidenceCoverage(
  findings: readonly EngineFinding[],
  records: readonly EvidenceRecord[],
): void {
  const byFinding = new Set(records.map((record) => record.findingId));
  for (const finding of findings) {
    if (!byFinding.has(finding.id)) throw new FindingEvidenceMissingError(finding.id);
  }
}

export function queryEvidence(
  records: readonly EvidenceRecord[],
  query: EvidenceQuery = {},
): EvidenceRecord[] {
  const needle = (query.q ?? "").trim().toLowerCase();
  return records.filter((record) => {
    if (query.repositoryId && record.repositoryId !== query.repositoryId) return false;
    if (query.findingId && record.findingId !== query.findingId) return false;
    if (query.kind && query.kind !== "all" && record.kind !== query.kind) return false;
    if (query.slot && query.slot !== "all" && record.slot !== query.slot) return false;
    if (!needle) return true;
    return `${record.id} ${record.findingId} ${record.kind} ${record.slot} ${record.summary} ${record.location} ${record.snippet}`
      .toLowerCase()
      .includes(needle);
  });
}

export function evidenceKindsPresent(records: readonly EvidenceRecord[]): EvidenceType[] {
  return EVIDENCE_TYPE_VALUES.filter((kind) => records.some((record) => record.kind === kind));
}
