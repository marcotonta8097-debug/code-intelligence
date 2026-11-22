import { describe, expect, it } from "vitest";
import { CINT_ENTITY_TABLES } from "@/lib/cint/cintEntityStore";
import { CODE_INTELLIGENCE_DELIVERY_SCHEMAS } from "@/core/codeIntelligence/codeIntelligenceDeliverySchema";

describe("B2 analysis_runs durability wiring", () => {
  it("registers analysis_runs in entity store tables", () => {
    expect(CINT_ENTITY_TABLES).toContain("analysis_runs");
  });

  it("keeps PGMS honesty entities at five (ledger is separate)", () => {
    expect(CODE_INTELLIGENCE_DELIVERY_SCHEMAS).toHaveLength(5);
    expect(
      CODE_INTELLIGENCE_DELIVERY_SCHEMAS.some((e) => e.persistenceKey === "analysis_runs"),
    ).toBe(false);
  });
});
