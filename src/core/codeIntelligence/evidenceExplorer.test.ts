import { describe, expect, it } from "vitest";
import { analyzeCodeIntelligenceSnapshot } from "@/core/codeIntelligence/codeIntelligenceAnalysis";
import {
  assertEvidenceCoverage,
  EVIDENCE_SOURCE_SLOTS,
  indexFindingEvidence,
  queryEvidence,
} from "@/core/codeIntelligence/evidenceExplorer";
import { FindingEvidenceMissingError } from "@/core/codeIntelligence/findingEngine";
import { CODE_INTELLIGENCE_DEMO_TREES } from "@/core/codeIntelligence/repositoryIntelligenceEngine";

describe("Pack 05 — evidence explorer", () => {
  it("indexes every finding to typed evidence including file refs and commit history", () => {
    const analysis = analyzeCodeIntelligenceSnapshot(CODE_INTELLIGENCE_DEMO_TREES["catalog-service"]!);
    expect(analysis.evidence.length).toBeGreaterThan(analysis.findings.length);
    assertEvidenceCoverage(analysis.findings, analysis.evidence);
    for (const finding of analysis.findings) {
      const rows = queryEvidence(analysis.evidence, { findingId: finding.id });
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.some((row) => row.slot === "file_references" || row.slot === "code_snippets" || row.slot === "configs")).toBe(
        true,
      );
      expect(rows.some((row) => row.kind === "COMMIT_HISTORY")).toBe(true);
    }
    expect(queryEvidence(analysis.evidence, { slot: "configs" }).length).toBeGreaterThan(0);
    expect(queryEvidence(analysis.evidence, { slot: "stack_traces" }).length).toBeGreaterThan(0);
    expect(EVIDENCE_SOURCE_SLOTS).toContain("screenshots");
    expect(queryEvidence(analysis.evidence, { slot: "screenshots" })).toEqual([]);
  });

  it("FINDING_EVIDENCE_MISSING when a finding is absent from the index", () => {
    const analysis = analyzeCodeIntelligenceSnapshot(CODE_INTELLIGENCE_DEMO_TREES["payments-api"]!);
    expect(() =>
      assertEvidenceCoverage(analysis.findings, analysis.evidence.filter((row) => false)),
    ).toThrow(FindingEvidenceMissingError);
    const ghost = {
      ...analysis.findings[0]!,
      id: "F-GHOST",
      evidence: [],
    };
    expect(() => indexFindingEvidence([ghost])).toThrow(/FINDING_EVIDENCE_MISSING/);
  });
});
