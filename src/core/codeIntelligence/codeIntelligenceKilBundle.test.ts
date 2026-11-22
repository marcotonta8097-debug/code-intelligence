import { describe, expect, it } from "vitest";
import { analyzeCodeIntelligenceSnapshot } from "@/core/codeIntelligence/codeIntelligenceAnalysis";
import { CODE_INTELLIGENCE_DEMO_TREES } from "@/core/codeIntelligence/repositoryIntelligenceEngine";
import { buildAnalysisRunId } from "@/core/codeIntelligence/codeIntelligenceObjectIdentity";
import {
  CINT_KIL_BUNDLE_VERSION,
  buildCintKilBundle,
  retrieveFromKilBundle,
  serializeCintKilForClient,
} from "@/core/codeIntelligence/codeIntelligenceKilBundle";
import { edgesForObject } from "@/core/codeIntelligence/codeIntelligenceObjectRelationships";
import { retrieveCintObjects } from "@/core/codeIntelligence/codeIntelligenceObjectRetrieval";
import type { CintClassifiedRegistry } from "@/core/codeIntelligence/codeIntelligenceObjectClassification";

describe("Phase E KIL bundle (K1→K2→K3→K5/K4)", () => {
  it("builds classify + retrieve + relationships in locked order", () => {
    const tree = CODE_INTELLIGENCE_DEMO_TREES["payments-api"];
    expect(tree).toBeTruthy();
    const analysis = analyzeCodeIntelligenceSnapshot(tree!);
    const runId = buildAnalysisRunId("kilorder");
    const bundle = buildCintKilBundle(analysis, { runId });

    expect(bundle.version).toBe(CINT_KIL_BUNDLE_VERSION);
    expect(bundle.registry.count).toBeGreaterThan(0);
    expect(bundle.classified.count).toBe(bundle.registry.count);
    expect(bundle.relationships.count).toBeGreaterThan(0);

    const finding = analysis.findings[0];
    expect(finding).toBeTruthy();
    const byId = retrieveFromKilBundle(bundle, { id: finding!.id });
    expect(byId.hits).toHaveLength(1);
    expect(byId.hits[0]?.classification.class).toBeTruthy();

    const quality = retrieveFromKilBundle(bundle, { class: "Quality", limit: 50 });
    expect(quality.version).toBe("CINT-ORET-1.0");

    const edges = edgesForObject(bundle.relationships, finding!.id);
    expect(edges.some((e) => e.type === "has_evidence" || e.type === "part_of_run")).toBe(true);

    const client = serializeCintKilForClient(bundle);
    expect(client.version).toBe(CINT_KIL_BUNDLE_VERSION);
    expect(client.classified.byId[finding!.id]?.class).toBeTruthy();
    expect(client.relationships.edges.length).toBe(bundle.relationships.count);
  });

  it("excludes Archived by default in retrieval", () => {
    const bundle = buildCintKilBundle({
      findings: [{ id: "F-DEAD-X", title: "Dead file", evidence: [{ id: "E-F-DEAD-X-1" }] }],
      evidence: [{ id: "E-F-DEAD-X-1", findingId: "F-DEAD-X", summary: "unused" }],
      remediations: [],
      intelligence: { dependencies: { nodes: [] } },
    });
    const id = "F-DEAD-X";
    const entry = bundle.classified.byId[id]!;
    const patched: CintClassifiedRegistry = {
      ...bundle.classified,
      byId: {
        ...bundle.classified.byId,
        [id]: {
          ...entry,
          governance: { ...entry.governance, status: "Archived" },
        },
      },
    };
    expect(retrieveCintObjects(patched, { kind: "finding" }).total).toBe(0);
    expect(retrieveCintObjects(patched, { kind: "finding", includeArchived: true }).total).toBe(1);
  });
});
