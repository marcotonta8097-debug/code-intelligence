import { describe, expect, it } from "vitest";
import { analyzeCodeIntelligenceSnapshot } from "@/core/codeIntelligence/codeIntelligenceAnalysis";
import { CODE_INTELLIGENCE_DEMO_TREES } from "@/core/codeIntelligence/repositoryIntelligenceEngine";
import {
  CINT_OBJECT_REGISTRY_VERSION,
  buildCintObjectRegistryFromAnalysis,
  listCintObjectsByKind,
  lookupCintObject,
} from "@/core/codeIntelligence/codeIntelligenceObjectRegistry";
import { buildAnalysisRunId } from "@/core/codeIntelligence/codeIntelligenceObjectIdentity";

describe("codeIntelligenceObjectRegistry (Phase E / K2)", () => {
  it("catalogs findings/evidence/remediations from a sealed analysis", () => {
    const tree = CODE_INTELLIGENCE_DEMO_TREES["payments-api"];
    expect(tree).toBeTruthy();
    const analysis = analyzeCodeIntelligenceSnapshot(tree!);
    const runId = buildAnalysisRunId("k2test");
    const registry = buildCintObjectRegistryFromAnalysis(analysis, { runId });

    expect(registry.version).toBe(CINT_OBJECT_REGISTRY_VERSION);
    expect(registry.count).toBeGreaterThan(0);
    expect(listCintObjectsByKind(registry, "finding").length).toBe(analysis.findings.length);
    expect(listCintObjectsByKind(registry, "analysis_run")).toHaveLength(1);

    const first = analysis.findings[0];
    if (first) {
      const hit = lookupCintObject(registry, first.id);
      expect(hit?.kind).toBe("finding");
      expect(hit?.governance.governanceVersion).toBe("CINT-GOV-1.0");
      expect(hit?.refs.runId).toBe(runId);
    }
  });

  it("refuses to index invalid ids and does not duplicate", () => {
    const registry = buildCintObjectRegistryFromAnalysis({
      findings: [
        { id: "F-DEAD-X", title: "Dead", evidence: [{ id: "E-F-DEAD-X-1" }] },
        { id: "F-DEAD-X", title: "Dup", evidence: [{ id: "E-F-DEAD-X-1" }] },
        { id: "not-an-id", title: "Bad", evidence: [] },
      ],
      evidence: [{ id: "E-F-DEAD-X-1", findingId: "F-DEAD-X", summary: "snip" }],
      remediations: [{ id: "R-F-DEAD-X", title: "Fix", findingId: "F-DEAD-X", evidenceIds: ["E-F-DEAD-X-1"] }],
      intelligence: { dependencies: { nodes: [{ name: "lodash" }] } },
    });
    expect(lookupCintObject(registry, "not-an-id")).toBeNull();
    expect(listCintObjectsByKind(registry, "finding")).toHaveLength(1);
    expect(listCintObjectsByKind(registry, "dependency")[0]?.id).toBe("DEP-LODASH");
  });
});
