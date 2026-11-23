import { describe, expect, it } from "vitest";
import {
  acceptCodeIntelligenceTruthMap,
  advanceCodeIntelligenceEntityAuthority,
  advanceCodeIntelligenceRegistryAuthority,
  advanceCodeIntelligenceWorkflowAuthority,
  lockCodeIntelligenceTruthRebase,
} from "@/core/codeIntelligence/codeIntelligenceTruthMap";
import {
  buildCodeIntelligenceEntityAuthority,
  CINT_ENTITY_KEY,
  detectCodeIntelligenceEntitySealIntent,
  isCodeIntelligenceEntitySealed,
} from "@/core/codeIntelligence/codeIntelligenceEntityAuthority";
import {
  buildCodeIntelligenceWorkflowAuthority,
  CINT_WORKFLOW_KEY,
  detectCodeIntelligencePhases45SealIntent,
  detectCodeIntelligenceWorkflowSealIntent,
  isCodeIntelligenceWorkflowSealed,
} from "@/core/codeIntelligence/codeIntelligenceWorkflowAuthority";

describe("Phase 4/5 — entity + workflow authority", () => {
  it("builds entity coverage from pack without orphans", () => {
    const entity = buildCodeIntelligenceEntityAuthority({ sealed: false });
    expect(entity.coverageOk).toBe(true);
    expect(entity.entities.length).toBeGreaterThanOrEqual(10);
    expect(entity.forbiddenInvent).toContain("Customer");
    expect(entity.entities.some((e) => e.label === "Finding")).toBe(true);
  });

  it("builds four core workflows with canonical states", () => {
    const workflow = buildCodeIntelligenceWorkflowAuthority({ sealed: false });
    expect(workflow.coverageOk).toBe(true);
    expect(workflow.workflows.map((w) => w.label).sort()).toEqual(
      ["Analysis", "Finding", "Investigation", "Remediation"].sort(),
    );
    expect(workflow.canonicalStates.Finding).toContain("DETECTED");
    expect(workflow.forbiddenStates).toContain("SHIPPED");
  });

  it("seals entity then workflow after registry; freeze stays on", () => {
    const locked = lockCodeIntelligenceTruthRebase({});
    const accepted = acceptCodeIntelligenceTruthMap(locked.metadata);
    const registry = advanceCodeIntelligenceRegistryAuthority(accepted.metadata);
    expect(registry.ok).toBe(true);

    const refusedEntity = advanceCodeIntelligenceEntityAuthority(accepted.metadata);
    expect(refusedEntity.ok).toBe(false);

    const entity = advanceCodeIntelligenceEntityAuthority(registry.metadata);
    expect(entity.ok).toBe(true);
    expect(entity.state.phase).toBe("phase_4_entity");
    expect(entity.state.frozen).toBe(true);
    expect(isCodeIntelligenceEntitySealed(entity.metadata)).toBe(true);
    expect((entity.metadata[CINT_ENTITY_KEY] as { sealed: boolean }).sealed).toBe(true);

    const refusedWorkflow = advanceCodeIntelligenceWorkflowAuthority(registry.metadata);
    expect(refusedWorkflow.ok).toBe(false);

    const workflow = advanceCodeIntelligenceWorkflowAuthority(entity.metadata);
    expect(workflow.ok).toBe(true);
    expect(workflow.state.phase).toBe("phase_5_workflow");
    expect(workflow.state.frozen).toBe(true);
    expect(isCodeIntelligenceWorkflowSealed(workflow.metadata)).toBe(true);
    expect((workflow.metadata[CINT_WORKFLOW_KEY] as { sealed: boolean }).sealed).toBe(true);
  });

  it("detects phase 4/5 and start next phases intents", () => {
    expect(detectCodeIntelligenceEntitySealIntent("phase 4")).toBe(true);
    expect(detectCodeIntelligenceWorkflowSealIntent("seal workflow")).toBe(true);
    expect(detectCodeIntelligencePhases45SealIntent("start next phases")).toBe(true);
    expect(detectCodeIntelligencePhases45SealIntent("rescan only")).toBe(false);
  });
});
