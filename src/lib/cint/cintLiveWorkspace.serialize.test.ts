import { describe, expect, it } from "vitest";
import { analyzeCodeIntelligenceSnapshot } from "@/core/codeIntelligence/codeIntelligenceAnalysis";
import { CODE_INTELLIGENCE_DEMO_TREES } from "@/core/codeIntelligence/repositoryIntelligenceEngine";
import { serializeCintAnalysisForClient } from "@/lib/cint/cintLiveWorkspace";

describe("serializeCintAnalysisForClient", () => {
  it("ships security/quality flags plus deps/architecture for live ingest", () => {
    const tree = CODE_INTELLIGENCE_DEMO_TREES["payments-api"];
    expect(tree).toBeTruthy();
    const analysis = analyzeCodeIntelligenceSnapshot(tree!);
    const serialized = serializeCintAnalysisForClient(analysis);
    expect(serialized.findings.length).toBeGreaterThan(0);
    expect(serialized.findings.some((f) => f.security || f.quality)).toBe(true);
    expect(serialized.evidence[0]).toMatchObject({
      slot: expect.any(String),
      kind: expect.any(String),
    });
    expect(serialized.investigations[0]?.question || serialized.investigations[0]?.hypothesis).toBeTruthy();
    expect(serialized.dependencies.nodes.length).toBeGreaterThan(0);
    expect(serialized.architecture.nodes.length).toBeGreaterThan(0);
    expect(serialized.tech).toBeTruthy();
    expect(serialized.profile).toBeTruthy();
    expect(serialized.objectRegistry.version).toBe("CINT-OR-1.0");
    expect(serialized.objectRegistry.count).toBeGreaterThan(0);
    expect(serialized.objectRegistry.byKind.finding.length).toBe(serialized.findings.length);
    expect(serialized.kil.version).toBe("CINT-KIL-1.0");
    expect(serialized.kil.classified.count).toBeGreaterThan(0);
    expect(serialized.kil.relationships.count).toBeGreaterThan(0);
  });
});
