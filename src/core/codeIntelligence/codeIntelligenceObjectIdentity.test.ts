import { describe, expect, it } from "vitest";
import {
  CINT_OBJECT_IDENTITY_VERSION,
  buildAnalysisRunId,
  buildDependencyId,
  buildEvidenceId,
  buildFindingId,
  buildRemediationId,
  isCintObjectId,
  normalizeCintObjectToken,
  parseCintObjectId,
} from "@/core/codeIntelligence/codeIntelligenceObjectIdentity";

describe("codeIntelligenceObjectIdentity (Phase E / K1)", () => {
  it("exports identity version and builds taxonomy-aligned IDs", () => {
    expect(CINT_OBJECT_IDENTITY_VERSION).toBe("CINT-OID-1.0");
    expect(buildFindingId("DEAD", "public/service-worker.js")).toBe(
      "F-DEAD-PUBLIC-SERVICE-WORKER-JS",
    );
    expect(buildEvidenceId("F-DEAD-X", 0)).toBe("E-F-DEAD-X-1");
    expect(buildRemediationId("F-BROKEN-VITE")).toBe("R-F-BROKEN-VITE");
    expect(buildAnalysisRunId("mwoy53ge")).toMatch(/^A-mwoy53ge$/i);
    expect(buildDependencyId("radix-hover-card")).toBe("DEP-RADIX-HOVER-CARD");
  });

  it("parses and validates prefixes including long aliases", () => {
    expect(parseCintObjectId("F-DEAD-X")?.kind).toBe("finding");
    expect(parseCintObjectId("FND-DEAD-X")?.kind).toBe("finding");
    expect(parseCintObjectId("E-F-DEAD-X-1")?.kind).toBe("evidence");
    expect(parseCintObjectId("R-F-BROKEN")?.kind).toBe("remediation");
    expect(parseCintObjectId("A-mwoy53ge")?.kind).toBe("analysis_run");
    expect(isCintObjectId("F-DEAD-X", "finding")).toBe(true);
    expect(isCintObjectId("F-DEAD-X", "evidence")).toBe(false);
    expect(isCintObjectId("nope")).toBe(false);
  });

  it("normalizes tokens without inventing empty bodies", () => {
    expect(normalizeCintObjectToken("")).toBe("UNKNOWN");
    expect(normalizeCintObjectToken("a/b.c")).toBe("A-B-C");
  });
});
