import { describe, expect, it } from "vitest";
import {
  buildArchitectureKnowledge,
  ARCHITECTURE_KNOWLEDGE_ENGINE_VERSION,
} from "@/core/codeIntelligence/architectureKnowledgeEngine";
import { CODE_INTELLIGENCE_DEMO_TREES } from "@/core/codeIntelligence/repositoryIntelligenceEngine";
import { demoRuntimeWorkspaceSeed } from "@/core/codeIntelligence/codeIntelligenceAnalysis";
import { buildCodeIntelligencePanel } from "@/lib/ai/generation/codeIntelligencePanels";

describe("Pack 08/09 — architecture knowledge + panel parity", () => {
  it("builds nodes and knowledge from demo trees", () => {
    for (const tree of Object.values(CODE_INTELLIGENCE_DEMO_TREES)) {
      const snap = buildArchitectureKnowledge(tree);
      expect(snap.nodes.length).toBeGreaterThan(0);
      expect(snap.knowledge.length).toBeGreaterThan(0);
      expect(snap.intendedVsObserved.length).toBeGreaterThan(0);
      expect(snap.provenance).toBe("deterministic_scan");
    }
    expect(ARCHITECTURE_KNOWLEDGE_ENGINE_VERSION).toBe("CINT-AKE-1.0");
  });

  it("seeds architecture into runtime workspace and Architecture panel hooks", () => {
    const seed = demoRuntimeWorkspaceSeed();
    expect(Object.keys(seed.architecture).length).toBeGreaterThan(0);
    const panel = buildCodeIntelligencePanel("Architecture")!;
    expect(panel).toContain("data-cint-knowledge-graph");
    expect(panel).toContain("data-cint-arch-decisions");
    expect(panel).toContain("data-cint-arch-intended");
  });
});
