import { describe, expect, it } from "vitest";
import { analyzeDemoCodeIntelligence } from "@/core/codeIntelligence/codeIntelligenceAnalysis";
import {
  assertRemediationIntegrity,
  proposeRemediationsFromFindings,
  REMEDIATION_ENGINE_VERSION,
} from "@/core/codeIntelligence/remediationEngine";
import { demoRuntimeWorkspaceSeed } from "@/core/codeIntelligence/codeIntelligenceAnalysis";

describe("Pack 07 — remediation engine", () => {
  it("proposes only for evidenced SEV-0/1/2 findings and never writes source", () => {
    const demo = analyzeDemoCodeIntelligence();
    for (const analysis of Object.values(demo)) {
      const plans = proposeRemediationsFromFindings(analysis.findings, analysis.evidence);
      expect(plans.every((p) => p.neverWritesSource === true)).toBe(true);
      expect(plans.every((p) => p.status === "PROPOSED")).toBe(true);
      expect(plans.every((p) => p.evidenceIds.length > 0)).toBe(true);
      assertRemediationIntegrity(plans, analysis.findings, analysis.evidence);
    }
    expect(REMEDIATION_ENGINE_VERSION).toBe("CINT-RE-1.0");
  });

  it("seeds investigations + remediations into demo runtime workspace", () => {
    const seed = demoRuntimeWorkspaceSeed();
    expect(seed.investigations.length).toBeGreaterThan(0);
    expect(seed.remediations.length).toBeGreaterThan(0);
    expect(seed.remediations.every((r) => r.neverWritesSource === true)).toBe(true);
    expect(seed.findings.length).toBeGreaterThan(0);
  });
});
