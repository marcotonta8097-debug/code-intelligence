import { describe, expect, it } from "vitest";
import {
  stampCintObjectGovernance,
  trustFromConfidence,
  provenanceFromEngineSignal,
} from "@/core/codeIntelligence/codeIntelligenceObjectGovernance";

describe("codeIntelligenceObjectGovernance (Phase C)", () => {
  it("defaults Active / Engine / Medium", () => {
    const g = stampCintObjectGovernance();
    expect(g).toEqual({
      status: "Active",
      provenance: "Engine",
      trust: "Medium",
      governanceVersion: "CINT-GOV-1.0",
    });
  });

  it("maps confidence and engine signals", () => {
    expect(trustFromConfidence("CONFIRMED")).toBe("High");
    expect(trustFromConfidence("SUSPECTED")).toBe("Low");
    expect(provenanceFromEngineSignal("deterministic_scan")).toBe("Engine");
    expect(provenanceFromEngineSignal("assistant_proposed")).toBe("Assistant-Proposed");
  });

  it("preserves explicit governance fields", () => {
    const g = stampCintObjectGovernance({
      status: "NeedsReview",
      provenance: "Human",
      trust: "Low",
    });
    expect(g.status).toBe("NeedsReview");
    expect(g.provenance).toBe("Human");
    expect(g.trust).toBe("Low");
  });
});
