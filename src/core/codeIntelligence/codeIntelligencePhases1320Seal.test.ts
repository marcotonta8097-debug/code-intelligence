import { describe, expect, it } from "vitest";
import { sealCodeIntelligencePhases810Cascade } from "@/core/codeIntelligence/codeIntelligencePhases810Seal";
import { sealCodeIntelligenceDeliverySchema } from "@/core/codeIntelligence/codeIntelligenceDeliverySchema";
import {
  areCodeIntelligencePhases1320Sealed,
  detectCodeIntelligencePhases1320SealIntent,
  sealCodeIntelligencePhases1320Cascade,
} from "@/core/codeIntelligence/codeIntelligencePhases1320Seal";
import { isCodeIntelligenceSealValidationSealed } from "@/core/codeIntelligence/codeIntelligenceSealValidation";
import { isCodeIntelligenceTrustEngineSealed } from "@/core/codeIntelligence/codeIntelligenceTrustEngine";
import { isCodeIntelligenceOperationsCenterSealed } from "@/core/codeIntelligence/codeIntelligenceOperationsCenter";
import { evaluateRepairGuard } from "@/core/codeIntelligence/codeIntelligenceGovernanceRepairGuard";
import { createRecoverySnapshot } from "@/core/codeIntelligence/codeIntelligenceRollbackEngine";
import { analyzeChangeImpact } from "@/core/codeIntelligence/codeIntelligenceImpactAnalysis";
import { sealCodeIntelligenceConnectorLift } from "@/core/codeIntelligence/codeIntelligenceConnectorLift";

describe("cint phases 13–20 cascade", () => {
  it("detects harden / phases 13 to 20 intents", () => {
    expect(detectCodeIntelligencePhases1320SealIntent("start next phases")).toBe(true);
    expect(detectCodeIntelligencePhases1320SealIntent("phases 13 to 20")).toBe(true);
    expect(detectCodeIntelligencePhases1320SealIntent("harden platform")).toBe(true);
    expect(detectCodeIntelligencePhases1320SealIntent("rescan only")).toBe(false);
  });

  it("blocks until delivery schema, then seals 12–20 in order", () => {
    const blocked = sealCodeIntelligencePhases1320Cascade({});
    expect(blocked.complete).toBe(false);
    expect(blocked.progressLines.join(" ")).toMatch(/Phase 11/);

    const p810 = sealCodeIntelligencePhases810Cascade({});
    const p11 = sealCodeIntelligenceDeliverySchema(p810.metadata);
    const cascade = sealCodeIntelligencePhases1320Cascade(p11.metadata);
    expect(cascade.complete).toBe(true);
    expect(areCodeIntelligencePhases1320Sealed(cascade.metadata)).toBe(true);
    expect(isCodeIntelligenceSealValidationSealed(cascade.metadata)).toBe(true);
    expect(isCodeIntelligenceTrustEngineSealed(cascade.metadata)).toBe(true);
    expect(isCodeIntelligenceOperationsCenterSealed(cascade.metadata)).toBe(true);
    expect(cascade.progressLines.some((l) => /Phase 20/.test(l))).toBe(true);
  });

  it("keeps connector lift gated until agent runtime + interaction + healthy audit", () => {
    const p810 = sealCodeIntelligencePhases810Cascade({});
    const p11 = sealCodeIntelligenceDeliverySchema(p810.metadata);
    const cascade = sealCodeIntelligencePhases1320Cascade(p11.metadata);
    const early = sealCodeIntelligenceConnectorLift(cascade.metadata, {
      approvedBy: "human_operator",
    });
    expect(early.blockedReason).toMatch(/Phase 21|Agent Runtime/i);
  });

  it("repair guard blocks execute without approval + recovery point", () => {
    const p810 = sealCodeIntelligencePhases810Cascade({});
    const p11 = sealCodeIntelligenceDeliverySchema(p810.metadata);
    const cascade = sealCodeIntelligencePhases1320Cascade(p11.metadata);
    const denied = evaluateRepairGuard({
      metadata: cascade.metadata,
      humanApproved: false,
    });
    expect(denied.allowed).toBe(false);
    expect(denied.failedStage).toBe("approval");

    const snap = createRecoverySnapshot(cascade.metadata, {
      operation: "repair",
      files: [{ path: "a.ts", content: "1" }],
    });
    const allowed = evaluateRepairGuard({
      metadata: snap.metadata,
      humanApproved: true,
      recoverySnapshotId: snap.snapshot!.id,
      impactRisk: "LOW",
    });
    expect(allowed.allowed).toBe(true);
    expect(allowed.stagesPassed).toContain("repair");
  });

  it("impact analysis ranks blast radius", () => {
    const high = analyzeChangeImpact({
      files: Array.from({ length: 22 }, (_, i) => `f${i}.ts`),
      services: ["a", "b", "c", "d"],
      apis: ["x", "y", "z"],
      databases: ["db1", "db2"],
    });
    expect(high.riskLevel).toBe("CRITICAL");
  });
});
