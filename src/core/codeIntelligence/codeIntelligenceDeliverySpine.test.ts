import { describe, expect, it } from "vitest";
import { evaluateCodeIntelligenceDeliverySpine } from "@/core/codeIntelligence/codeIntelligenceDeliverySpine";
import { sealCodeIntelligencePhases810Cascade } from "@/core/codeIntelligence/codeIntelligencePhases810Seal";
import { sealCodeIntelligenceDeliverySchema } from "@/core/codeIntelligence/codeIntelligenceDeliverySchema";

describe("cint.delivery.spine.v1", () => {
  it("reports demo_only pgbe when cint.v1 HTML present without PGMS emit", () => {
    const p810 = sealCodeIntelligencePhases810Cascade({});
    const p11 = sealCodeIntelligenceDeliverySchema(p810.metadata);
    const report = evaluateCodeIntelligenceDeliverySpine({
      metadata: p11.metadata,
      html: `<div data-product-surface="code_intelligence"></div><script>var NS="cint.v1."</script>`,
    });
    expect(report.gates.deliverySchema).toBe("sealed");
    expect(report.gates.pgms).toBe("absent");
    expect(report.gates.pgbe).toBe("demo_only");
    expect(report.gates.pls).toBe("absent");
    expect(report.mayClaimPartIIReady).toBe(false);
  });

  it("marks pgms sealed when productGenerationModel.status=sealed", () => {
    const report = evaluateCodeIntelligenceDeliverySpine({
      metadata: {
        productGenerationModel: { status: "sealed", emitted: { apiRoutes: ["/api/x"] } },
        goldenPathStatus: { liveSmoke: { ran: true, passed: true } },
      },
      html: `<div data-scw-wired="1" data-pgbe-sealed="1"></div>`,
    });
    expect(report.gates.pgms).toBe("sealed");
    expect(report.gates.pgbe).toBe("sealed");
    expect(report.gates.scw).toBe("incomplete"); // no clientPathMap
    expect(report.gates.pls).toBe("sealed");
  });
});
