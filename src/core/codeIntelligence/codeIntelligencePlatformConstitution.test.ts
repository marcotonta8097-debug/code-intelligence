import { describe, expect, it } from "vitest";
import {
  CODE_INTELLIGENCE_CONSTITUTIONAL_NEXT_PHASES,
  buildCodeIntelligencePlatformConstitution,
  detectCodeIntelligenceConstitutionSealIntent,
  isCodeIntelligencePlatformConstitutionSealed,
  sealCodeIntelligencePlatformConstitution,
} from "@/core/codeIntelligence/codeIntelligencePlatformConstitution";

describe("cint.constitution.v1 Platform Constitution", () => {
  it("builds founding charter with supremacy and maxims", () => {
    const doc = buildCodeIntelligencePlatformConstitution({ sealed: false });
    expect(doc.version).toBe("cint.constitution.v1");
    expect(doc.charterVersion).toBe("1.0");
    expect(doc.sealed).toBe(false);
    expect(doc.authorityHierarchy[0]).toMatch(/Constitution/);
    expect(doc.foundingMaxims).toEqual(
      expect.arrayContaining([
        "No Evidence, No Truth",
        "No Authority, No Action",
        "No Verification, No Completion",
      ]),
    );
    expect(doc.articles.map((a) => a.id)).toEqual([
      "I",
      "II",
      "III",
      "IV",
      "V",
      "VI",
      "VII",
      "VIII",
      "IX",
      "X",
      "XI",
      "XII",
      "XIII",
    ]);
  });

  it("marks Phases 7–26 construction delivered (Part II · wire · engineer writes)", () => {
    expect(CODE_INTELLIGENCE_CONSTITUTIONAL_NEXT_PHASES.map((p) => p.id)).toEqual([
      "phase_7_integration_host_surfaces",
      "phase_8_evidence_enforcement",
      "phase_9_governance_approvals",
      "phase_10_audit_escalation",
      "phase_11_delivery_schema",
      "phase_12_recovery_rollback",
      "phase_13_seal_validation",
      "phase_14_trust_engine",
      "phase_15_memory_engine",
      "phase_16_impact_analysis",
      "phase_17_predictive_risk",
      "phase_18_architecture_intelligence",
      "phase_19_self_healing_governance",
      "phase_20_operations_center",
      "phase_21_live_agent_runtime",
      "phase_22_agent_interaction",
      "phase_23_connector_readiness",
      "phase_24_part_ii_delivery_emit",
      "phase_25_connector_wire",
      "phase_26_remediation_engineer_writes",
    ]);
    expect(
      CODE_INTELLIGENCE_CONSTITUTIONAL_NEXT_PHASES.every((p) => p.constructionStatus === "delivered"),
    ).toBe(true);
    expect(CODE_INTELLIGENCE_CONSTITUTIONAL_NEXT_PHASES.every((p) => p.inventPages === false)).toBe(
      true,
    );
  });

  it("seals into metadata", () => {
    const sealed = sealCodeIntelligencePlatformConstitution({});
    expect(sealed.constitution.sealed).toBe(true);
    expect(sealed.constitution.sealedAt).toBeTruthy();
    expect(isCodeIntelligencePlatformConstitutionSealed(sealed.metadata)).toBe(true);
  });

  it("detects seal intent", () => {
    expect(detectCodeIntelligenceConstitutionSealIntent("seal platform constitution")).toBe(true);
    expect(detectCodeIntelligenceConstitutionSealIntent("cint.constitution.v1")).toBe(true);
    expect(detectCodeIntelligenceConstitutionSealIntent("random repair")).toBe(false);
  });
});
