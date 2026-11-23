import { describe, expect, it } from "vitest";
import { sealCodeIntelligencePhases810Cascade } from "@/core/codeIntelligence/codeIntelligencePhases810Seal";
import { sealCodeIntelligenceDeliverySchema } from "@/core/codeIntelligence/codeIntelligenceDeliverySchema";
import { sealCodeIntelligencePhases1320Cascade } from "@/core/codeIntelligence/codeIntelligencePhases1320Seal";
import { sealCodeIntelligenceAgentGovernment } from "@/core/codeIntelligence/codeIntelligenceAgentGovernment";
import {
  dispatchCodeIntelligenceAgent,
  isCodeIntelligenceAgentRuntimeSealed,
  runCodeIntelligenceLiveAgentPass,
  sealCodeIntelligenceAgentRuntime,
} from "@/core/codeIntelligence/codeIntelligenceAgentRuntime";
import {
  isCodeIntelligenceAgentInteractionSealed,
  runCodeIntelligenceInteractivePass,
  sealCodeIntelligenceAgentInteraction,
} from "@/core/codeIntelligence/codeIntelligenceAgentInteraction";
import {
  evaluateCodeIntelligenceAgentArchitectureAudit,
  sealCodeIntelligenceAgentArchitectureAudit,
} from "@/core/codeIntelligence/codeIntelligenceAgentArchitectureAudit";
import { sealCodeIntelligenceConnectorLift } from "@/core/codeIntelligence/codeIntelligenceConnectorLift";

function sealFoundations() {
  let meta = sealCodeIntelligenceAgentGovernment({}).metadata;
  meta = sealCodeIntelligencePhases810Cascade(meta).metadata;
  meta = sealCodeIntelligenceDeliverySchema(meta).metadata;
  meta = sealCodeIntelligencePhases1320Cascade(meta).metadata;
  return meta;
}

describe("cint.agents.runtime.v1 live agents sprint", () => {
  it("blocks runtime until government + 8–12 present", () => {
    const blocked = sealCodeIntelligenceAgentRuntime({});
    expect(blocked.blockedReason).toMatch(/Agent Government/);
  });

  it("seals runtime and runs L1–L3 agents against existing engines", () => {
    const foundations = sealFoundations();
    const runtime = sealCodeIntelligenceAgentRuntime(foundations);
    expect(runtime.blockedReason).toBeUndefined();
    expect(isCodeIntelligenceAgentRuntimeSealed(runtime.metadata)).toBe(true);
    expect(runtime.runtime.liveAgentIds).toContain("repository_intelligence");
    expect(runtime.runtime.deferredAgentIds).toContain("remediation_engineer");

    const repo = dispatchCodeIntelligenceAgent({
      metadata: runtime.metadata,
      agentId: "repository_intelligence",
      action: "map repository",
    });
    expect(repo.ok).toBe(true);
    expect(repo.engine).toMatch(/CINT-RIE/);

    const engineer = dispatchCodeIntelligenceAgent({
      metadata: runtime.metadata,
      agentId: "remediation_engineer",
      action: "apply patch",
    });
    expect(engineer.ok).toBe(false);
    expect(engineer.blockers.join(" ")).toMatch(/DEFERRED/);

    const pass = runCodeIntelligenceLiveAgentPass({ metadata: runtime.metadata });
    expect(pass.blockedReason).toBeUndefined();
    expect(pass.results.length).toBeGreaterThanOrEqual(16);
    expect(pass.analysis?.findings.length).toBeGreaterThan(0);
  });

  it("enables interaction then healthy audit then connector lift readiness", () => {
    let meta = sealFoundations();
    meta = sealCodeIntelligenceAgentRuntime(meta).metadata;
    const interaction = sealCodeIntelligenceAgentInteraction(meta);
    expect(interaction.blockedReason).toBeUndefined();
    meta = interaction.metadata;
    expect(isCodeIntelligenceAgentInteractionSealed(meta)).toBe(true);

    const interactive = runCodeIntelligenceInteractivePass({ metadata: meta });
    expect(interactive.blockedReason).toBeUndefined();
    expect(interactive.results.some((r) => r.ok)).toBe(true);
    meta = interactive.metadata;

    const audit = sealCodeIntelligenceAgentArchitectureAudit(meta);
    expect(audit.audit.healthy).toBe(true);
    expect(audit.audit.connectorEnablementAllowed).toBe(true);
    meta = audit.metadata;

    const evaluated = evaluateCodeIntelligenceAgentArchitectureAudit(meta);
    expect(evaluated.checksFailed).toBe(0);
    expect(evaluated.findings.some((f) => f.code === "NO_SUPER_AGENT_IN_MAY")).toBe(true);
    expect(evaluated.findings.some((f) => f.code === "ENGINEER_DEFERRED")).toBe(true);

    const lifted = sealCodeIntelligenceConnectorLift(meta, { approvedBy: "human_operator" });
    expect(lifted.blockedReason).toBeUndefined();
    expect(lifted.lift.connectorStatus).toBe("authorized_not_wired");
  });

  it("blocks connector lift without healthy audit", () => {
    let meta = sealFoundations();
    meta = sealCodeIntelligenceAgentRuntime(meta).metadata;
    meta = sealCodeIntelligenceAgentInteraction(meta).metadata;
    const early = sealCodeIntelligenceConnectorLift(meta);
    expect(early.blockedReason).toMatch(/architecture audit/i);
  });
});
