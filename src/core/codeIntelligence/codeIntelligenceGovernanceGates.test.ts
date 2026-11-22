import { describe, expect, it } from "vitest";
import {
  authorizeRemediationExecute,
  evaluateGovernancePermission,
  isCodeIntelligenceGovernanceGatesSealed,
  sealCodeIntelligenceGovernanceGates,
} from "@/core/codeIntelligence/codeIntelligenceGovernanceGates";

describe("cint.governance.gates.v1 Phase 9", () => {
  it("allows L1–L3 without human approval for allowlisted agents", () => {
    const observe = evaluateGovernancePermission({
      actor: "repository_intelligence",
      action: "observe",
    });
    expect(observe.allowed).toBe(true);
    expect(observe.level).toBe("L1");

    const prepare = evaluateGovernancePermission({
      actor: "remediation_planner",
      action: "prepare",
    });
    expect(prepare.allowed).toBe(true);
    expect(prepare.level).toBe("L3");
  });

  it("blocks Remediation Engineer L4/L5 without human approval", () => {
    const denied = authorizeRemediationExecute({ level: "L4" });
    expect(denied.allowed).toBe(false);
    expect(denied.blockers).toContain("HUMAN_L4_APPROVAL_REQUIRED");
    expect(denied.blockers).toContain("REMEDIATION_ENGINEER_BLOCKED");

    const l5 = authorizeRemediationExecute({ level: "L5" });
    expect(l5.allowed).toBe(false);
    expect(l5.blockers).toContain("HUMAN_L5_APPROVAL_REQUIRED");
  });

  it("allows L4 after valid human approval", () => {
    const ok = authorizeRemediationExecute({
      level: "L4",
      humanApproval: {
        approved: true,
        approvedBy: "operator@example.com",
        approvedAt: "demo-clock",
        level: "L4",
        scope: "apply patch to auth cookie Secure flag",
        changeProposalId: "CP-1",
      },
    });
    expect(ok.allowed).toBe(true);
    expect(ok.level).toBe("L4");
  });

  it("seals into metadata", () => {
    const sealed = sealCodeIntelligenceGovernanceGates({});
    expect(sealed.gates.version).toBe("cint.governance.gates.v1");
    expect(isCodeIntelligenceGovernanceGatesSealed(sealed.metadata)).toBe(true);
  });
});
