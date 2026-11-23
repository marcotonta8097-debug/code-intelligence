import { describe, expect, it } from "vitest";
import {
  enforceFindingEvidence,
  sealCodeIntelligenceEvidenceGate,
  isCodeIntelligenceEvidenceGateSealed,
} from "@/core/codeIntelligence/codeIntelligenceEvidenceEnforcement";

describe("cint.evidence.gate.v1 Evidence Enforcement", () => {
  it("demotes claims without evidence to UNVERIFIED", () => {
    const result = enforceFindingEvidence({
      findingId: "F-1",
      claimedVerified: true,
    });
    expect(result.status).toBe("UNVERIFIED");
    expect(result.mayClaimVerified).toBe(false);
    expect(result.enforcedBy).toBe("constitutional_compliance");
  });

  it("requires constitutional fields for VERIFIED", () => {
    const incomplete = enforceFindingEvidence({
      findingId: "F-2",
      evidenceIds: ["E-1"],
      evidenceSummary: "snippet at auth.ts",
      evidenceTimestamp: "demo-clock",
      location: "auth.ts:12",
    });
    expect(incomplete.status).toBe("EVIDENCE_INCOMPLETE");

    const complete = enforceFindingEvidence({
      findingId: "F-3",
      evidenceIds: ["E-2"],
      evidenceSummary: "secure:false in cookie options",
      evidenceTimestamp: "demo-clock",
      criteria: "Session cookies must set Secure",
      confidence: "CONFIRMED",
      specialist: "security_specialist",
      location: "auth.ts:12",
    });
    expect(complete.status).toBe("VERIFIED");
    expect(complete.mayClaimVerified).toBe(true);
  });

  it("seals gate into metadata", () => {
    const sealed = sealCodeIntelligenceEvidenceGate({});
    expect(sealed.gate.version).toBe("cint.evidence.gate.v1");
    expect(isCodeIntelligenceEvidenceGateSealed(sealed.metadata)).toBe(true);
  });
});
