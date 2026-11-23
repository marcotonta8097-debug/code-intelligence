import { describe, expect, it } from "vitest";
import {
  detectCodeIntelligenceConnectorLiftIntent,
  isCodeIntelligenceConnectorFreezeLifted,
  sealCodeIntelligenceConnectorLift,
} from "@/core/codeIntelligence/codeIntelligenceConnectorLift";
import { sealCodeIntelligencePhases810Cascade } from "@/core/codeIntelligence/codeIntelligencePhases810Seal";
import { sealCodeIntelligenceDeliverySchema } from "@/core/codeIntelligence/codeIntelligenceDeliverySchema";
import { sealCodeIntelligenceRollbackEngine } from "@/core/codeIntelligence/codeIntelligenceRollbackEngine";
import { sealCodeIntelligencePhases1320Cascade } from "@/core/codeIntelligence/codeIntelligencePhases1320Seal";
import { sealCodeIntelligenceAgentGovernment } from "@/core/codeIntelligence/codeIntelligenceAgentGovernment";
import { sealCodeIntelligenceAgentRuntime } from "@/core/codeIntelligence/codeIntelligenceAgentRuntime";
import { sealCodeIntelligenceAgentInteraction } from "@/core/codeIntelligence/codeIntelligenceAgentInteraction";
import { sealCodeIntelligenceAgentArchitectureAudit } from "@/core/codeIntelligence/codeIntelligenceAgentArchitectureAudit";
import { evaluateCodeIntelligenceHonestyPath } from "@/core/codeIntelligence/codeIntelligenceHonestyPath";

const CI_HTML = `<div data-product-surface="code_intelligence" data-cint-app-shell="1"></div>`;

describe("cint.connector.lift.v1", () => {
  it("detects human lift intents", () => {
    expect(detectCodeIntelligenceConnectorLiftIntent("authorize connector freeze lift")).toBe(
      true,
    );
    expect(detectCodeIntelligenceConnectorLiftIntent("lift connector freeze")).toBe(true);
    expect(detectCodeIntelligenceConnectorLiftIntent("rescan only")).toBe(false);
  });

  it("blocks lift until 8–12 + runtime + interaction + healthy audit", () => {
    const blocked = sealCodeIntelligenceConnectorLift({});
    expect(blocked.blockedReason).toMatch(/8–10/);

    const p810 = sealCodeIntelligencePhases810Cascade({});
    const still = sealCodeIntelligenceConnectorLift(p810.metadata);
    expect(still.blockedReason).toMatch(/Phase 11/);

    const p11 = sealCodeIntelligenceDeliverySchema(p810.metadata);
    const needRecovery = sealCodeIntelligenceConnectorLift(p11.metadata);
    expect(needRecovery.blockedReason).toMatch(/Phase 12/);

    let meta = sealCodeIntelligenceRollbackEngine(p11.metadata).metadata;
    meta = sealCodeIntelligencePhases1320Cascade(meta).metadata;
    meta = sealCodeIntelligenceAgentGovernment(meta).metadata;
    const needRuntime = sealCodeIntelligenceConnectorLift(meta);
    expect(needRuntime.blockedReason).toMatch(/Phase 21|Agent Runtime/i);

    meta = sealCodeIntelligenceAgentRuntime(meta).metadata;
    const needInteraction = sealCodeIntelligenceConnectorLift(meta);
    expect(needInteraction.blockedReason).toMatch(/Phase 22|Interaction/i);

    meta = sealCodeIntelligenceAgentInteraction(meta).metadata;
    const needAudit = sealCodeIntelligenceConnectorLift(meta);
    expect(needAudit.blockedReason).toMatch(/architecture audit/i);

    meta = sealCodeIntelligenceAgentArchitectureAudit(meta).metadata;
    const lifted = sealCodeIntelligenceConnectorLift(meta, {
      approvedBy: "marcotonta8097@gmail.com",
    });
    expect(lifted.blockedReason).toBeUndefined();
    expect(isCodeIntelligenceConnectorFreezeLifted(lifted.metadata)).toBe(true);
    expect(lifted.lift.connectorStatus).toBe("authorized_not_wired");

    const path = evaluateCodeIntelligenceHonestyPath({
      html: CI_HTML,
      metadata: lifted.metadata,
      fieldRegistryId: "field:code_intelligence",
    });
    expect(path!.blockers.some((b) => b.code === "CINT_CONNECTOR_FREEZE")).toBe(false);
    expect(path!.blockers.some((b) => b.code === "CINT_ROLLBACK_UNSEALED")).toBe(false);
    expect(path!.blockers.some((b) => b.code === "CINT_NO_LIVE_INDEX")).toBe(true);
    expect(path!.blockers.some((b) => b.code === "CINT_NO_PGMS_SEAL")).toBe(true);
  });
});
