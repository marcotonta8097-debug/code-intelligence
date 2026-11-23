import { describe, expect, it } from "vitest";
import { sealCodeIntelligencePhases810Cascade } from "@/core/codeIntelligence/codeIntelligencePhases810Seal";
import { sealCodeIntelligenceDeliverySchema } from "@/core/codeIntelligence/codeIntelligenceDeliverySchema";
import { sealCodeIntelligenceRollbackEngine } from "@/core/codeIntelligence/codeIntelligenceRollbackEngine";
import {
  sealCodeIntelligenceDeliveryEmit,
  stampCodeIntelligencePartIIHtml,
  isCodeIntelligenceDeliveryEmitSealed,
} from "@/core/codeIntelligence/codeIntelligenceDeliveryEmit";
import { evaluateCodeIntelligenceDeliverySpine } from "@/core/codeIntelligence/codeIntelligenceDeliverySpine";

describe("cint.delivery.emit.v1", () => {
  it("seals PGMS·PGBE·SCW·PLS and stamps Part II HTML markers", () => {
    const p810 = sealCodeIntelligencePhases810Cascade({});
    const p11 = sealCodeIntelligenceDeliverySchema(p810.metadata);
    const p12 = sealCodeIntelligenceRollbackEngine(p11.metadata);
    const emitted = sealCodeIntelligenceDeliveryEmit(p12.metadata);
    expect(emitted.blockedReason && !emitted.emit.sealed).toBeFalsy();
    expect(isCodeIntelligenceDeliveryEmitSealed(emitted.metadata)).toBe(true);
    expect(emitted.metadata.productGenerationModel).toMatchObject({ status: "sealed" });
    expect(emitted.metadata.__replicaSealedContractWire).toBe(true);
    expect(emitted.metadata.productLiveSmoke).toMatchObject({ ok: true });

    const html = stampCodeIntelligencePartIIHtml(
      `<div data-product-surface="code_intelligence" data-cint-app-shell="1"></div>`,
    );
    expect(html).toMatch(/data-pgbe-sealed=["']1["']/);
    expect(html).toMatch(/data-scw-wired=["']1["']/);

    const spine = evaluateCodeIntelligenceDeliverySpine({
      metadata: emitted.metadata,
      html,
    });
    expect(spine.gates.pgms).toBe("sealed");
    expect(spine.gates.pgbe).toBe("sealed");
    expect(spine.gates.scw).toBe("sealed");
    expect(spine.gates.pls).toBe("sealed");
    expect(spine.mayClaimPartIIReady).toBe(true);
  });
});
