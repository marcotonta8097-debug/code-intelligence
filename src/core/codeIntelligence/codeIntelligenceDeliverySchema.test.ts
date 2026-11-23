import { describe, expect, it } from "vitest";
import {
  CINT_PGMS_REQUIRED_ENTITIES,
  detectCodeIntelligenceDeliverySchemaSealIntent,
  isCodeIntelligenceDeliverySchemaSealed,
  sealCodeIntelligenceDeliverySchema,
} from "@/core/codeIntelligence/codeIntelligenceDeliverySchema";
import { sealCodeIntelligencePhases810Cascade } from "@/core/codeIntelligence/codeIntelligencePhases810Seal";

describe("cint.delivery.schema.v1 Phase 11", () => {
  it("requires the five PGMS honesty entities", () => {
    expect([...CINT_PGMS_REQUIRED_ENTITIES]).toEqual([
      "Repository",
      "Finding",
      "Evidence",
      "Investigation",
      "RemediationPlan",
    ]);
  });

  it("blocks seal until Phases 8–10 are sealed", () => {
    const blocked = sealCodeIntelligenceDeliverySchema({});
    expect(blocked.schema.sealed).toBe(false);
    expect(blocked.blockedReason).toMatch(/8–10/);
    expect(isCodeIntelligenceDeliverySchemaSealed(blocked.metadata)).toBe(false);
  });

  it("seals after Phases 8–10 cascade", () => {
    const priors = sealCodeIntelligencePhases810Cascade({});
    const sealed = sealCodeIntelligenceDeliverySchema(priors.metadata);
    expect(sealed.blockedReason).toBeUndefined();
    expect(sealed.schema.sealed).toBe(true);
    expect(isCodeIntelligenceDeliverySchemaSealed(sealed.metadata)).toBe(true);
    expect(sealed.schema.entities).toHaveLength(5);
  });

  it("detects phase 11 / delivery schema intents", () => {
    expect(detectCodeIntelligenceDeliverySchemaSealIntent("phase 11")).toBe(true);
    expect(detectCodeIntelligenceDeliverySchemaSealIntent("seal delivery schema")).toBe(true);
    expect(detectCodeIntelligenceDeliverySchemaSealIntent("rescan only")).toBe(false);
  });
});
