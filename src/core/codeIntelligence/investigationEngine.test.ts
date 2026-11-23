import { describe, expect, it } from "vitest";
import {
  assertInvestigationIntegrity,
  INVESTIGATION_ENGINE_VERSION,
  openInvestigationsFromFindings,
} from "@/core/codeIntelligence/investigationEngine";
import { buildDependencyGraph } from "@/core/codeIntelligence/dependencyGraphEngine";
import { runFindingEngine } from "@/core/codeIntelligence/findingEngine";
import { indexFindingEvidence } from "@/core/codeIntelligence/evidenceExplorer";
import { CODE_INTELLIGENCE_DEMO_TREES } from "@/core/codeIntelligence/repositoryIntelligenceEngine";
import {
  assertDomainPackMayFreeze,
  auditRegistryAuthority,
} from "@/core/domainPack/registryAuthority";
import { CODE_INTELLIGENCE_DOMAIN_PACK } from "@/core/domainPack/codeIntelligenceDomainPack";

describe("Pack 01 — registry coverage after relationship heal", () => {
  it("freezes without RELATIONSHIP_AUTHORITY_ERROR", () => {
    const report = auditRegistryAuthority(CODE_INTELLIGENCE_DOMAIN_PACK);
    expect(report.missingRequiredRelationships).toEqual([]);
    expect(report.missingCapabilities).toEqual([]);
    expect(report.ok).toBe(true);
    expect(() =>
      assertDomainPackMayFreeze({
        userPrompt:
          "Build a Code Intelligence platform for repositories, findings, investigations, and remediation.",
        fieldRegistryId: "field:code_intelligence",
      }),
    ).not.toThrow();
  });
});

describe("Pack 06 — investigation engine", () => {
  it("opens investigations only when findings have evidence", () => {
    expect(INVESTIGATION_ENGINE_VERSION).toBe("CINT-IE-1.0");
    const tree = CODE_INTELLIGENCE_DEMO_TREES["payments-api"]!;
    const graph = buildDependencyGraph(tree);
    const findings = runFindingEngine(tree, graph);
    const evidence = indexFindingEvidence(findings, { tree });
    const investigations = openInvestigationsFromFindings(findings, evidence);
    expect(investigations.length).toBeGreaterThan(0);
    expect(investigations.every((item) => item.evidenceIds.length > 0)).toBe(true);
    expect(investigations.every((item) => item.state === "OPEN")).toBe(true);
    expect(() => assertInvestigationIntegrity(investigations, findings, evidence)).not.toThrow();
  });
});
