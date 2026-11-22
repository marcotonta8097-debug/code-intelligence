import { describe, expect, it } from "vitest";
import {
  applyCodeIntelligenceHonestyToInteractionScore,
  evaluateCodeIntelligenceHonestyPath,
  isCodeIntelligenceHonestyTarget,
} from "@/core/codeIntelligence/codeIntelligenceHonestyPath";
import {
  acceptCodeIntelligenceTruthMap,
  advanceCodeIntelligenceEntityAuthority,
  advanceCodeIntelligenceRegistryAuthority,
  advanceCodeIntelligenceWorkflowAuthority,
  lockCodeIntelligenceTruthRebase,
} from "@/core/codeIntelligence/codeIntelligenceTruthMap";
import { buildGoldenPathStatus } from "@/lib/generation/delivery/buildGoldenPathStatus";

const CI_HTML = `<div data-product-surface="code_intelligence" data-cint-app-shell="1" data-cint-page="findings"></div>`;

describe("Pack 10 — CI honesty path", () => {
  it("targets CI surfaces and forces dataBindingReal false", () => {
    expect(
      isCodeIntelligenceHonestyTarget({
        html: CI_HTML,
        fieldRegistryId: "field:code_intelligence",
      }),
    ).toBe(true);
    const score = applyCodeIntelligenceHonestyToInteractionScore(
      {
        value: 5,
        formsPresent: true,
        filtersPresent: true,
        navigationComplete: true,
        actionsReachable: true,
        dataBindingReal: true,
      },
      { html: CI_HTML },
    );
    expect(score.dataBindingReal).toBe(false);
  });

  it("lists production_candidate requirements without writing honestLabel", () => {
    const locked = lockCodeIntelligenceTruthRebase({});
    const accepted = acceptCodeIntelligenceTruthMap(locked.metadata);
    const registry = advanceCodeIntelligenceRegistryAuthority(accepted.metadata);
    const entity = advanceCodeIntelligenceEntityAuthority(registry.metadata);
    const workflow = advanceCodeIntelligenceWorkflowAuthority(entity.metadata);
    const path = evaluateCodeIntelligenceHonestyPath({
      html: CI_HTML,
      metadata: workflow.metadata,
      fieldRegistryId: "field:code_intelligence",
    });
    expect(path).toBeTruthy();
    expect(path!.trustBand).toBe("interactive_demonstration");
    expect(path!.dataBindingReal).toBe(false);
    expect(path!.expectedGpsBand).toBe("interactive_prototype");
    expect(path!.blockers.some((b) => b.code === "CINT_DEMO_LOCALSTORAGE")).toBe(true);
    expect(path!.blockers.some((b) => b.code === "CINT_EVIDENCE_GATE_UNSEALED")).toBe(true);
    expect(path!.blockers.some((b) => b.code === "CINT_GOVERNANCE_GATES_UNSEALED")).toBe(true);
    expect(path!.blockers.some((b) => b.code === "CINT_AUDIT_EMERGENCY_UNSEALED")).toBe(true);
    expect(path!.blockers.some((b) => b.code === "CINT_DELIVERY_SCHEMA_UNSEALED")).toBe(true);
    expect(path!.blockers.some((b) => b.code === "CINT_NO_PGMS_SEAL")).toBe(true);
    expect(path!.blockers.some((b) => b.code === "CINT_NO_SCW_WIRING")).toBe(true);
    expect(path!.blockers.some((b) => b.code === "CINT_CONNECTOR_FREEZE")).toBe(true);
    expect(path!.productionCandidateRequirements.some((r) => /PGMS/.test(r))).toBe(true);
    expect(path!.productionCandidateRequirements.some((r) => /Evidence Gate/i.test(r))).toBe(true);
    expect(path!.productionCandidateRequirements.some((r) => /Governance Gates/i.test(r))).toBe(
      true,
    );
  });

  it("GPS stays interactive_prototype when CI demotes dataBindingReal", () => {
    const status = buildGoldenPathStatus(
      "gen-ci",
      "field:code_intelligence",
      {
        isComplete: true,
        sealedPageCount: 16,
        totalContractPageCount: 16,
        incompleteSurfaces: [],
        lastCheckedAt: new Date().toISOString(),
      },
      {
        value: 5,
        formsPresent: true,
        filtersPresent: true,
        navigationComplete: true,
        actionsReachable: true,
        dataBindingReal: false,
      },
      {
        loginScreenPresent: true,
        sessionManagementPresent: true,
        roleEnforcementPresent: true,
        protectedRoutesPresent: true,
      },
      { isWired: true, wireMarker: "scw", backendRoutesSealed: true },
      { ran: true, passed: true, failedChecks: [], ranAt: new Date().toISOString() },
      { criticalFailureCount: 0, highFailureCount: 0, repairBriefCount: 0, passed: true },
      { allGatesClear: true, blockerCodes: [], summary: "clear" },
    );
    expect(status.honestLabel).toBe("interactive_prototype");
    expect(status.honestLabelReason).toMatch(/mocked data|real data binding/i);
  });
});
