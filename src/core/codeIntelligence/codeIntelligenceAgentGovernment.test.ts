import { describe, expect, it } from "vitest";
import {
  CODE_INTELLIGENCE_AGENT_GOVERNMENT,
  CINT_CONNECTOR_FREEZE_DIRECTIVE,
  evaluateGovernanceBlock,
  resolveDecisionRight,
  sealCodeIntelligenceAgentGovernment,
} from "@/core/codeIntelligence/codeIntelligenceAgentGovernment";

describe("cint.agents.v1 Agent Government", () => {
  it("defines 17 agents with Controllers first and no super-agent PM", () => {
    expect(CODE_INTELLIGENCE_AGENT_GOVERNMENT).toHaveLength(17);
    expect(CODE_INTELLIGENCE_AGENT_GOVERNMENT[0]?.id).toBe("governance_controller");
    expect(CODE_INTELLIGENCE_AGENT_GOVERNMENT[1]?.id).toBe("authority_controller");
    expect(CODE_INTELLIGENCE_AGENT_GOVERNMENT[2]?.id).toBe("registry_controller");
    const pm = CODE_INTELLIGENCE_AGENT_GOVERNMENT.find((a) => a.id === "project_management");
    expect(pm?.shallNot).toEqual(
      expect.arrayContaining(["Approvals", "Authority rulings", "Truth sealing"]),
    );
    const compliance = CODE_INTELLIGENCE_AGENT_GOVERNMENT.find(
      (a) => a.id === "constitutional_compliance",
    );
    expect(compliance?.reportsTo).toBe("constitution");
  });

  it("blocks super-agent role combinations and PM approvals", () => {
    expect(
      evaluateGovernanceBlock({
        actor: "project_management",
        action: "approve remediation",
        combinesRoles: ["investigator", "approver", "executor"],
      }).allowed,
    ).toBe(false);
    expect(
      evaluateGovernanceBlock({
        actor: "project_management",
        action: "route workflow",
      }).allowed,
    ).toBe(true);
  });

  it("routes L4 execute to human + remediation engineer only", () => {
    const right = resolveDecisionRight({ action: "execute" });
    expect(right.requiresHuman).toBe(true);
    expect(right.allowedAgents).toEqual(["remediation_engineer"]);
  });

  it("freezes connectors until 8–10", () => {
    expect(CINT_CONNECTOR_FREEZE_DIRECTIVE.join(" ")).toMatch(/No live repository connectors/);
    const sealed = sealCodeIntelligenceAgentGovernment({});
    expect(sealed.government.sealed).toBe(true);
    expect(sealed.government.forbiddenPattern).toBe("super_agent");
  });
});
