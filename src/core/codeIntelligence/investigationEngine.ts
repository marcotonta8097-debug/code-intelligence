/**
 * Pack 06 — Investigation Engine.
 * Opens investigations from findings + evidence only. Never invents claims without evidence ids.
 * Snapshot / demo-only — no live GitHub, model, or source mutation.
 */

import type { EngineFinding } from "@/core/codeIntelligence/findingEngine";
import type { EvidenceRecord } from "@/core/codeIntelligence/evidenceExplorer";
import { INVESTIGATION_LIFECYCLE_VALUES } from "@/core/domainPack/taxonomyRegistry";

export const INVESTIGATION_ENGINE_VERSION = "CINT-IE-1.0" as const;

export type InvestigationLifecycle = (typeof INVESTIGATION_LIFECYCLE_VALUES)[number];

export type EngineInvestigation = Readonly<{
  id: string;
  repositoryId: string;
  findingId: string;
  question: string;
  hypotheses: readonly string[];
  evidenceIds: readonly string[];
  analysis: string;
  conclusion: string;
  state: InvestigationLifecycle;
  provenance: "deterministic_scan";
}>;

export class InvestigationEvidenceMissingError extends Error {
  readonly code = "INVESTIGATION_EVIDENCE_MISSING" as const;
  constructor(readonly investigationId: string) {
    super(`INVESTIGATION_EVIDENCE_MISSING: ${investigationId}`);
    this.name = "InvestigationEvidenceMissingError";
  }
}

export class InvestigationFindingMissingError extends Error {
  readonly code = "INVESTIGATION_FINDING_MISSING" as const;
  constructor(readonly investigationId: string) {
    super(`INVESTIGATION_FINDING_MISSING: ${investigationId}`);
    this.name = "InvestigationFindingMissingError";
  }
}

function evidenceForFinding(
  finding: EngineFinding,
  records: readonly EvidenceRecord[],
): EvidenceRecord[] {
  const fromIndex = records.filter((record) => record.findingId === finding.id);
  if (fromIndex.length > 0) return fromIndex;
  return finding.evidence.map((item) => ({
    id: item.id,
    findingId: finding.id,
    repositoryId: finding.repositoryId,
    kind: item.kind,
    slot: "code_snippets" as const,
    summary: item.summary,
    location: item.location,
    snippet: item.snippet,
    provenance: "deterministic_scan" as const,
  }));
}

/** Open one investigation per finding that has evidence. Severity SEV-1/SEV-2 first. */
export function openInvestigationsFromFindings(
  findings: readonly EngineFinding[],
  evidence: readonly EvidenceRecord[] = [],
): EngineInvestigation[] {
  const ranked = [...findings].sort((a, b) => {
    const rank = (sev: string) =>
      sev === "SEV-1" ? 0 : sev === "SEV-2" ? 1 : sev === "SEV-3" ? 2 : 3;
    return rank(a.severity) - rank(b.severity);
  });
  const out: EngineInvestigation[] = [];
  for (const finding of ranked) {
    const linked = evidenceForFinding(finding, evidence);
    if (linked.length === 0) continue;
    const id = `INV-${finding.id}`;
    out.push({
      id,
      repositoryId: finding.repositoryId,
      findingId: finding.id,
      question: `Why does ${finding.title} exist on ${finding.repositoryId}?`,
      hypotheses: [
        `Primary signal: ${finding.kind.replace(/_/g, " ")}`,
        "Evidence locations may indicate a packaging or ownership gap",
      ],
      evidenceIds: linked.map((item) => item.id),
      analysis: finding.why,
      conclusion:
        finding.severity === "SEV-1" || finding.severity === "SEV-2"
          ? "Needs triage before remediation proposal."
          : "Track as low-urgency debt until the next analysis run.",
      state: "OPEN",
      provenance: "deterministic_scan",
    });
  }
  return out;
}

export function assertInvestigationIntegrity(
  investigations: readonly EngineInvestigation[],
  findings: readonly EngineFinding[],
  evidence: readonly EvidenceRecord[],
): void {
  const findingIds = new Set(findings.map((finding) => finding.id));
  const evidenceById = new Map(evidence.map((record) => [record.id, record]));
  for (const investigation of investigations) {
    if (!findingIds.has(investigation.findingId)) {
      throw new InvestigationFindingMissingError(investigation.id);
    }
    if (investigation.evidenceIds.length === 0) {
      throw new InvestigationEvidenceMissingError(investigation.id);
    }
    for (const evidenceId of investigation.evidenceIds) {
      const record = evidenceById.get(evidenceId);
      if (!record && !findings.some((f) => f.evidence.some((e) => e.id === evidenceId))) {
        throw new InvestigationEvidenceMissingError(investigation.id);
      }
    }
  }
}

export function advanceInvestigation(
  investigation: EngineInvestigation,
  next: InvestigationLifecycle,
): EngineInvestigation {
  if (!(INVESTIGATION_LIFECYCLE_VALUES as readonly string[]).includes(next)) {
    return investigation;
  }
  return { ...investigation, state: next };
}
