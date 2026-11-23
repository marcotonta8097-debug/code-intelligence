import { describe, expect, it } from "vitest";
import {
  acceptCodeIntelligenceTruthMap,
  advanceCodeIntelligenceEntityAuthority,
  advanceCodeIntelligenceIntegrationAuthority,
  advanceCodeIntelligenceRegistryAuthority,
  advanceCodeIntelligenceWorkflowAuthority,
  lockCodeIntelligenceTruthRebase,
  unlockCodeIntelligenceTruthRebase,
} from "@/core/codeIntelligence/codeIntelligenceTruthMap";
import {
  buildCodeIntelligenceIntegrationAuthority,
  CINT_INTEGRATION_KEY,
  detectCodeIntelligenceIntegrationSealIntent,
  isCodeIntelligenceIntegrationSealed,
  sealCodeIntelligenceIntegration,
} from "@/core/codeIntelligence/codeIntelligenceIntegrationAuthority";

describe("cint.integration.v1 Phase 6", () => {
  it("builds eight registries with governed flows and no page invent", () => {
    const draft = buildCodeIntelligenceIntegrationAuthority({ sealed: false });
    expect(draft.version).toBe("cint.integration.v1");
    expect(draft.sealed).toBe(false);
    expect(draft.requiresWorkflowSealed).toBe(true);
    expect(draft.registries).toHaveLength(8);
    expect(draft.coverageOk).toBe(true);
    expect(draft.lifecycle).toEqual([
      "Import",
      "Analyze",
      "Investigate",
      "Remediate",
      "Report",
      "Share",
      "Preserve",
    ]);
    const ids = draft.registries.map((r) => r.id);
    expect(ids).toEqual([
      "import_registry",
      "upload_registry",
      "export_registry",
      "screenshot_registry",
      "reporting_registry",
      "print_registry",
      "share_registry",
      "external_integrations_registry",
    ]);
    for (const registry of draft.registries) {
      expect(registry.flows.length).toBeGreaterThan(0);
      for (const flow of registry.flows) {
        expect(flow.source).toBeTruthy();
        expect(flow.validation).toBeTruthy();
        expect(flow.storage).toBeTruthy();
        expect(flow.ownership).toBeTruthy();
        expect(flow.permissions.length).toBeGreaterThan(0);
        expect(flow.exportability).toBeTruthy();
        expect(flow.auditability).toBeTruthy();
        expect(flow.hostPages.length).toBeGreaterThan(0);
      }
    }
    expect(draft.forbidden.some((line) => /No new PAGE invent/i.test(line))).toBe(true);
  });

  it("refuses seal until workflow is sealed; then seals under freeze", () => {
    const locked = lockCodeIntelligenceTruthRebase({});
    const refused = sealCodeIntelligenceIntegration(locked.metadata);
    expect(refused.ok).toBe(false);
    expect(refused.reason).toBe("seal_refused_workflow_not_sealed");

    const accepted = acceptCodeIntelligenceTruthMap(locked.metadata);
    const registry = advanceCodeIntelligenceRegistryAuthority(accepted.metadata);
    const entity = advanceCodeIntelligenceEntityAuthority(registry.metadata);
    const workflow = advanceCodeIntelligenceWorkflowAuthority(entity.metadata);
    expect(workflow.ok).toBe(true);

    const advanced = advanceCodeIntelligenceIntegrationAuthority(workflow.metadata);
    expect(advanced.ok).toBe(true);
    expect(advanced.state.frozen).toBe(true);
    expect(advanced.state.phase).toBe("phase_6_integration");
    expect(advanced.state.integrationSealedAt).toBeTruthy();
    expect(isCodeIntelligenceIntegrationSealed(advanced.metadata)).toBe(true);
    expect(advanced.metadata[CINT_INTEGRATION_KEY]).toMatchObject({
      version: "cint.integration.v1",
      sealed: true,
    });
  });

  it("unlock cascade seals integration when missing", () => {
    const locked = lockCodeIntelligenceTruthRebase({});
    const unlocked = unlockCodeIntelligenceTruthRebase(locked.metadata);
    expect(unlocked.ok).toBe(true);
    expect(unlocked.state.frozen).toBe(false);
    expect(unlocked.state.phase).toBe("phase_6_integration");
    expect(unlocked.sealedDuringUnlock).toContain("integration");
    expect(isCodeIntelligenceIntegrationSealed(unlocked.metadata)).toBe(true);
  });

  it("detects phase 6 / integration seal intent", () => {
    expect(detectCodeIntelligenceIntegrationSealIntent("seal integration")).toBe(true);
    expect(detectCodeIntelligenceIntegrationSealIntent("phase 6")).toBe(true);
    expect(detectCodeIntelligenceIntegrationSealIntent("cint.integration.v1")).toBe(true);
    expect(detectCodeIntelligenceIntegrationSealIntent("seal import registry")).toBe(true);
    expect(detectCodeIntelligenceIntegrationSealIntent("rescan only")).toBe(false);
  });
});
