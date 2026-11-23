import { describe, expect, it } from "vitest";
import {
  areCodeIntelligencePhases810Sealed,
  detectCodeIntelligencePhases810SealIntent,
  sealCodeIntelligencePhases810Cascade,
} from "@/core/codeIntelligence/codeIntelligencePhases810Seal";
import { isCodeIntelligenceEvidenceGateSealed } from "@/core/codeIntelligence/codeIntelligenceEvidenceEnforcement";
import { isCodeIntelligenceGovernanceGatesSealed } from "@/core/codeIntelligence/codeIntelligenceGovernanceGates";
import { isCodeIntelligenceAuditEmergencySealed } from "@/core/codeIntelligence/codeIntelligenceAuditEmergency";

describe("Phases 8–10 cascade seal", () => {
  it("detects start next phases and phases 8 to 10 intents", () => {
    expect(detectCodeIntelligencePhases810SealIntent("start next phases")).toBe(true);
    expect(detectCodeIntelligencePhases810SealIntent("seal phases 8 to 10")).toBe(true);
    expect(detectCodeIntelligencePhases810SealIntent("complete phases 8-10 sealed")).toBe(true);
    expect(detectCodeIntelligencePhases810SealIntent("phases 8 through 10")).toBe(true);
    expect(detectCodeIntelligencePhases810SealIntent("rescan only")).toBe(false);
  });

  it("seals evidence → governance → audit in one cascade", () => {
    const result = sealCodeIntelligencePhases810Cascade({});
    expect(result.sealedNow.evidenceGate).toBe(true);
    expect(result.sealedNow.governanceGates).toBe(true);
    expect(result.sealedNow.auditEmergency).toBe(true);
    expect(result.complete).toBe(true);
    expect(isCodeIntelligenceEvidenceGateSealed(result.metadata)).toBe(true);
    expect(isCodeIntelligenceGovernanceGatesSealed(result.metadata)).toBe(true);
    expect(isCodeIntelligenceAuditEmergencySealed(result.metadata)).toBe(true);
    expect(areCodeIntelligencePhases810Sealed(result.metadata)).toBe(true);
    expect(result.progressLines.some((l) => /Phases 8–10 operational seals COMPLETE/i.test(l))).toBe(
      true,
    );

    const again = sealCodeIntelligencePhases810Cascade(result.metadata);
    expect(again.sealedNow.evidenceGate).toBe(false);
    expect(again.sealedNow.governanceGates).toBe(false);
    expect(again.sealedNow.auditEmergency).toBe(false);
    expect(again.complete).toBe(true);
  });
});
