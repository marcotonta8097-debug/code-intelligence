import { describe, expect, it } from "vitest";
import {
  appendAuditLedgerEntry,
  buildCodeIntelligenceAuditEmergencyAuthority,
  invokeEmergencyControl,
  isChangeFullyAudited,
  isCodeIntelligenceAuditEmergencySealed,
  isEmergencyExecutionFrozen,
  mayExecuteUnderEmergency,
  sealCodeIntelligenceAuditEmergency,
  validateAuditLedgerChain,
} from "@/core/codeIntelligence/codeIntelligenceAuditEmergency";

describe("cint.audit.v1 Phase 10", () => {
  it("appends immutable chained ledger entries", () => {
    let auth = buildCodeIntelligenceAuditEmergencyAuthority({ sealed: true });
    const stages = ["proposal", "authority", "approval", "execution", "verification"] as const;
    for (const stage of stages) {
      const next = appendAuditLedgerEntry(auth, {
        actor: "human",
        agent: "governance_controller",
        action: "change:CP-1",
        stage,
      });
      auth = next.authority;
      expect(next.entry.immutable).toBe(true);
    }
    const chain = validateAuditLedgerChain(auth.ledger);
    expect(chain.ok).toBe(true);
    expect(isChangeFullyAudited(auth.ledger, "change:CP-1")).toBe(true);
  });

  it("invokes emergency freeze and blocks execute", () => {
    const sealed = buildCodeIntelligenceAuditEmergencyAuthority({ sealed: true });
    const result = invokeEmergencyControl(sealed, {
      control: "freeze_autonomous_actions",
      invokedBy: "ops-lead",
      reason: "critical finding surge",
      authorizedRole: "governance_controller",
    });
    expect(result.allowed).toBe(true);
    expect(isEmergencyExecutionFrozen(result.authority)).toBe(true);
    expect(mayExecuteUnderEmergency(result.authority).allowed).toBe(false);
  });

  it("rejects emergency from unauthorized role shape via missing invoker", () => {
    const sealed = buildCodeIntelligenceAuditEmergencyAuthority({ sealed: true });
    const bad = invokeEmergencyControl(sealed, {
      control: "pause_execution",
      invokedBy: "",
      reason: "x",
      authorizedRole: "human_operator",
    });
    expect(bad.allowed).toBe(false);
  });

  it("seals into metadata", () => {
    const sealed = sealCodeIntelligenceAuditEmergency({});
    expect(sealed.audit.version).toBe("cint.audit.v1");
    expect(isCodeIntelligenceAuditEmergencySealed(sealed.metadata)).toBe(true);
  });
});
