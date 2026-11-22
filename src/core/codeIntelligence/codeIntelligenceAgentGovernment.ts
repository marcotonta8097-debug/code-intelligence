/**
 * cint.agents.v1 — Code Intelligence Agent Government.
 *
 * Deliberate anti-pattern: never a "super-agent" (PM+Architect+Approver+Executor+Auditor).
 * Agents form a government subordinate to cint.constitution.v1.
 * No live connectors / autonomous remediation until Evidence (8) · Gates (9) · Audit (10) operate.
 */

export const CINT_AGENTS_KEY = "cint.agents.v1" as const;
export const CINT_AGENTS_VERSION = "CINT-AGOV-1.0" as const;

export type CodeIntelligenceAgentLayer =
  | "governance_foundation"
  | "intelligence_foundation"
  | "analysis_specialists"
  | "coordination"
  | "engineering"
  | "verification"
  | "human_governance";

export type CodeIntelligenceAgentId =
  | "governance_controller"
  | "authority_controller"
  | "registry_controller"
  | "repository_intelligence"
  | "evidence_intelligence"
  | "blueprint_intelligence"
  | "reality_intelligence"
  | "architecture_specialist"
  | "security_specialist"
  | "performance_specialist"
  | "quality_specialist"
  | "project_management"
  | "remediation_planner"
  | "remediation_engineer"
  | "build_verification"
  | "testing_verification"
  | "constitutional_compliance";

export type CodeIntelligenceAgentContract = Readonly<{
  id: CodeIntelligenceAgentId;
  number: number;
  title: string;
  layer: CodeIntelligenceAgentLayer;
  buildPhase: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  mission: string;
  may: readonly string[];
  shallNot: readonly string[];
  produces: readonly string[];
  reportsTo: "constitution" | "governance_controller" | "project_management" | "human_governance";
  operational: boolean;
}>;

/** Constitutional freeze until Phases 8–10 enforcement is sealed. */
export const CINT_CONNECTOR_FREEZE_DIRECTIVE = [
  "No live repository connectors (GitHub/OAuth/remote scan)",
  "No autonomous remediation / source mutation",
  "No production_candidate claims",
  "Until Evidence Enforcement (8), Governance Gates (9), Immutable Audit & Emergency (10) are operational",
] as const;

export const CODE_INTELLIGENCE_AGENT_GOVERNMENT: readonly CodeIntelligenceAgentContract[] = [
  {
    id: "governance_controller",
    number: 1,
    title: "Governance Controller",
    layer: "governance_foundation",
    buildPhase: 1,
    mission: "Protect Constitution · Validate Permissions · Enforce Governance",
    may: ["Approve agent access", "Verify permissions", "Block unconstitutional actions"],
    shallNot: ["Analyze code", "Modify repositories", "Perform remediation"],
    produces: ["Access decisions", "Governance blocks", "Permission rulings"],
    reportsTo: "constitution",
    operational: true,
  },
  {
    id: "authority_controller",
    number: 2,
    title: "Authority Controller",
    layer: "governance_foundation",
    buildPhase: 1,
    mission: "Determine who decides what — Decision Rights · Role Permissions · Escalation",
    may: ["Classify decision rights", "Escalate authority", "Deny unauthorized decision makers"],
    shallNot: ["Approve its own decisions", "Execute changes", "Rewrite Constitution"],
    produces: ["Decision-right rulings", "Escalation paths"],
    reportsTo: "constitution",
    operational: true,
  },
  {
    id: "registry_controller",
    number: 3,
    title: "Registry Controller",
    layer: "governance_foundation",
    buildPhase: 1,
    mission: "Protect canonical registries — taxonomies, standards, capabilities, classifications",
    may: ["Gate registry writes", "Reject competing truths", "Publish registry reads"],
    shallNot: ["Bypass seal", "Invent parallel registries", "Analyze repositories"],
    produces: ["Registry write grants", "Canonical reads"],
    reportsTo: "constitution",
    operational: true,
  },
  {
    id: "repository_intelligence",
    number: 4,
    title: "Repository Intelligence Agent",
    layer: "intelligence_foundation",
    buildPhase: 2,
    mission: "Repository Discovery · Mapping · Source Synchronization (read-only)",
    may: ["Read repositories", "Map structure", "Sync metadata (demo/deferred connector)"],
    shallNot: ["Change code", "Approve findings", "Govern"],
    produces: ["Project Maps", "Dependency Maps", "Structure Maps"],
    reportsTo: "governance_controller",
    operational: true,
  },
  {
    id: "evidence_intelligence",
    number: 5,
    title: "Evidence Intelligence Agent",
    layer: "intelligence_foundation",
    buildPhase: 2,
    mission: "Collect · Validate · Track evidence completeness",
    may: ["Collect evidence", "Score confidence", "Mark completeness gaps"],
    shallNot: ["Declare verified conclusions alone", "Approve", "Execute"],
    produces: ["Evidence Packages", "Evidence References", "Confidence Scores"],
    reportsTo: "governance_controller",
    operational: true,
  },
  {
    id: "blueprint_intelligence",
    number: 6,
    title: "Blueprint Intelligence Agent",
    layer: "intelligence_foundation",
    buildPhase: 2,
    mission: "Understand product intent — what SHOULD exist",
    may: ["Read blueprint/FPT/identity", "Enumerate expected surfaces"],
    shallNot: ["Mutate FPT without re-approval", "Execute", "Approve"],
    produces: ["Expected Features", "Expected Pages", "Expected Workflows"],
    reportsTo: "governance_controller",
    operational: true,
  },
  {
    id: "reality_intelligence",
    number: 7,
    title: "Reality Intelligence Agent",
    layer: "intelligence_foundation",
    buildPhase: 2,
    mission: "Determine what ACTUALLY exists — current state",
    may: ["Observe current HTML/panels/state", "Diff against blueprint inputs"],
    shallNot: ["Invent meaning", "Heal by inventing pages", "Approve"],
    produces: ["Current State snapshots"],
    reportsTo: "governance_controller",
    operational: true,
  },
  {
    id: "architecture_specialist",
    number: 8,
    title: "Architecture Specialist",
    layer: "analysis_specialists",
    buildPhase: 3,
    mission: "Structural integrity · design · dependencies · boundaries",
    may: ["Assess architecture", "Recommend", "Attach evidence"],
    shallNot: ["Approve", "Execute", "Verify own findings alone"],
    produces: ["Architecture Assessment"],
    reportsTo: "project_management",
    operational: true,
  },
  {
    id: "security_specialist",
    number: 9,
    title: "Security Specialist",
    layer: "analysis_specialists",
    buildPhase: 3,
    mission: "Security findings · vulnerabilities · authn/authz",
    may: ["Assess security", "Recommend", "Attach evidence"],
    shallNot: ["Approve", "Execute", "Verify own findings alone"],
    produces: ["Security Assessment"],
    reportsTo: "project_management",
    operational: true,
  },
  {
    id: "performance_specialist",
    number: 10,
    title: "Performance Specialist",
    layer: "analysis_specialists",
    buildPhase: 3,
    mission: "Performance · bottlenecks · optimization opportunities",
    may: ["Assess performance", "Recommend"],
    shallNot: ["Approve", "Execute", "Rewrite standards"],
    produces: ["Performance Assessment"],
    reportsTo: "project_management",
    operational: true,
  },
  {
    id: "quality_specialist",
    number: 11,
    title: "Quality Specialist",
    layer: "analysis_specialists",
    buildPhase: 3,
    mission: "Quality measurement · code health · maintainability — independent verification posture",
    may: ["Measure quality", "Independent review", "Validation opinions"],
    shallNot: ["Execute remediation", "Approve own measurements as final truth alone"],
    produces: ["Quality Assessment"],
    reportsTo: "project_management",
    operational: true,
  },
  {
    id: "project_management",
    number: 12,
    title: "Project Management Agent",
    layer: "coordination",
    buildPhase: 4,
    mission: "Coordinate — never govern. Traffic control only.",
    may: ["Route workflows", "Assign tasks", "Track status"],
    shallNot: [
      "Approvals",
      "Authority rulings",
      "Truth sealing",
      "Evidence validation",
      "Combine Investigator+Approver+Executor+Verifier",
    ],
    produces: ["Task routes", "Status boards"],
    reportsTo: "governance_controller",
    operational: true,
  },
  {
    id: "remediation_planner",
    number: 13,
    title: "Remediation Planner",
    layer: "engineering",
    buildPhase: 5,
    mission: "Create fix plans only",
    may: ["Propose patches", "Impact assessment", "Rollback/verification plans"],
    shallNot: ["Execute", "Approve", "Verify completion"],
    produces: ["Proposal", "Impact Assessment", "Rollback Plan", "Verification Plan"],
    reportsTo: "project_management",
    operational: true,
  },
  {
    id: "remediation_engineer",
    number: 14,
    title: "Remediation Engineer",
    layer: "engineering",
    buildPhase: 5,
    mission: "Implement approved changes only",
    may: ["Modify code after L4/L5 approval", "Create files", "Refactor", "Repair"],
    shallNot: ["Approve", "Verify", "Expand own permissions"],
    produces: ["Authorized code changes"],
    reportsTo: "project_management",
    operational: false,
  },
  {
    id: "build_verification",
    number: 15,
    title: "Build Verification Agent",
    layer: "verification",
    buildPhase: 6,
    mission: "Build · compile · dependency health checks",
    may: ["Check build status", "Report dependency health"],
    shallNot: ["Execute fixes", "Approve plans"],
    produces: ["Build verification reports"],
    reportsTo: "governance_controller",
    operational: true,
  },
  {
    id: "testing_verification",
    number: 16,
    title: "Testing Verification Agent",
    layer: "verification",
    buildPhase: 6,
    mission: "Unit · integration · workflow tests",
    may: ["Run/report tests", "Flag failures"],
    shallNot: ["Approve", "Mutate product meaning"],
    produces: ["Test verification reports"],
    reportsTo: "governance_controller",
    operational: true,
  },
  {
    id: "constitutional_compliance",
    number: 17,
    title: "Constitutional Compliance Agent",
    layer: "verification",
    buildPhase: 6,
    mission: "Protect Constitution — internal auditor",
    may: [
      "Check authority respected",
      "Check evidence supplied",
      "Check approvals present",
      "Check execution scope",
      "Check verification completed",
    ],
    shallNot: ["Govern as PM", "Execute", "Rewrite Constitution", "Approve its own compliance"],
    produces: ["Compliance rulings", "Constitutional violations"],
    reportsTo: "constitution",
    operational: true,
  },
] as const;

export type CodeIntelligenceAgentGovernment = Readonly<{
  version: "cint.agents.v1";
  sealed: boolean;
  sealedAt: string | null;
  agentVersion: typeof CINT_AGENTS_VERSION;
  forbiddenPattern: "super_agent";
  forbiddenPatternReason: string;
  connectorFreeze: typeof CINT_CONNECTOR_FREEZE_DIRECTIVE;
  buildOrder: readonly CodeIntelligenceAgentLayer[];
  agents: readonly CodeIntelligenceAgentContract[];
  constitution: readonly string[];
}>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function buildCodeIntelligenceAgentGovernment(options?: {
  sealed?: boolean;
}): CodeIntelligenceAgentGovernment {
  const sealed = options?.sealed === true;
  return {
    version: "cint.agents.v1",
    sealed,
    sealedAt: sealed ? new Date().toISOString() : null,
    agentVersion: CINT_AGENTS_VERSION,
    forbiddenPattern: "super_agent",
    forbiddenPatternReason:
      "An agent that is PM + Architect + Coordinator + Planner + Reviewer + Executor + Auditor reviews and verifies its own work — drift factory. Use government separation instead.",
    connectorFreeze: CINT_CONNECTOR_FREEZE_DIRECTIVE,
    buildOrder: [
      "governance_foundation",
      "intelligence_foundation",
      "analysis_specialists",
      "coordination",
      "engineering",
      "verification",
      "human_governance",
    ],
    agents: CODE_INTELLIGENCE_AGENT_GOVERNMENT,
    constitution: [
      "Subordinate to cint.constitution.v1",
      "Never create a super-agent",
      "PM is traffic control — not government",
      "Constitutional Compliance reports to Constitution, not PM",
      "Governance Controllers before engineering intelligence capabilities grow",
      ...CINT_CONNECTOR_FREEZE_DIRECTIVE,
    ],
  };
}

export function sealCodeIntelligenceAgentGovernment(metadata: unknown): {
  metadata: Record<string, unknown>;
  government: CodeIntelligenceAgentGovernment;
} {
  const base = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  const government = buildCodeIntelligenceAgentGovernment({ sealed: true });
  base[CINT_AGENTS_KEY] = government;
  return { metadata: base, government };
}

export function readCodeIntelligenceAgentGovernment(
  metadata?: unknown,
): CodeIntelligenceAgentGovernment | null {
  const block = asRecord(asRecord(metadata)?.[CINT_AGENTS_KEY]);
  if (!block || block.version !== "cint.agents.v1") return null;
  return block as CodeIntelligenceAgentGovernment;
}

export function isCodeIntelligenceAgentGovernmentSealed(metadata?: unknown): boolean {
  const g = readCodeIntelligenceAgentGovernment(metadata);
  return Boolean(g?.sealed && g.sealedAt);
}

export function detectCodeIntelligenceAgentGovernmentSealIntent(text: string): boolean {
  const t = text.toLowerCase();
  return (
    /\bseal\b.*\bagent government\b/.test(t) ||
    /\bcint\.agents\.v1\b/.test(t) ||
    /\bgovernance controller\b/.test(t) ||
    /\bno super-?agent\b/.test(t) ||
    /\bagent government\b/.test(t)
  );
}

export function getCodeIntelligenceAgent(
  id: CodeIntelligenceAgentId,
): CodeIntelligenceAgentContract | undefined {
  return CODE_INTELLIGENCE_AGENT_GOVERNMENT.find((a) => a.id === id);
}

/** Authority Controller — who may decide. */
export function resolveDecisionRight(input: {
  action: "observe" | "analyse" | "prepare" | "execute" | "consequential" | "registry_write" | "approve";
}): {
  allowedAgents: readonly CodeIntelligenceAgentId[];
  requiresHuman: boolean;
  level: string;
} {
  switch (input.action) {
    case "observe":
      return {
        allowedAgents: [
          "repository_intelligence",
          "evidence_intelligence",
          "blueprint_intelligence",
          "reality_intelligence",
        ],
        requiresHuman: false,
        level: "L1",
      };
    case "analyse":
      return {
        allowedAgents: [
          "architecture_specialist",
          "security_specialist",
          "performance_specialist",
          "quality_specialist",
          "evidence_intelligence",
        ],
        requiresHuman: false,
        level: "L2",
      };
    case "prepare":
      return {
        allowedAgents: ["remediation_planner", "evidence_intelligence", "project_management"],
        requiresHuman: false,
        level: "L3",
      };
    case "execute":
      return {
        allowedAgents: ["remediation_engineer"],
        requiresHuman: true,
        level: "L4",
      };
    case "consequential":
      return { allowedAgents: ["remediation_engineer"], requiresHuman: true, level: "L5" };
    case "registry_write":
      return { allowedAgents: ["registry_controller"], requiresHuman: false, level: "GOV" };
    case "approve":
      return { allowedAgents: [], requiresHuman: true, level: "HUMAN" };
    default:
      return { allowedAgents: [], requiresHuman: true, level: "DENY" };
  }
}

/** Governance Controller — block unconstitutional action shapes. */
export function evaluateGovernanceBlock(input: {
  actor: CodeIntelligenceAgentId;
  action: string;
  combinesRoles?: readonly string[];
}): { allowed: boolean; reason: string } {
  const agent = getCodeIntelligenceAgent(input.actor);
  if (!agent) return { allowed: false, reason: "Unknown actor — denied" };
  if (input.combinesRoles && input.combinesRoles.length >= 3) {
    const set = new Set(input.combinesRoles.map((r) => r.toLowerCase()));
    const toxic =
      set.has("investigator") &&
      set.has("approver") &&
      (set.has("executor") || set.has("verifier"));
    if (toxic) {
      return {
        allowed: false,
        reason: "Super-agent pattern blocked — Investigator+Approver+Executor/Verifier separation required",
      };
    }
  }
  if (input.actor === "project_management" && /approve|seal|truth|evidence.?valid/i.test(input.action)) {
    return {
      allowed: false,
      reason: "PM may coordinate only — cannot approve, seal truth, or validate evidence",
    };
  }
  // Word-boundary — "approved patch" must not false-positive as "approve".
  if (input.actor === "remediation_engineer" && /\bapprove\b|\bverify\b/i.test(input.action)) {
    return { allowed: false, reason: "Remediation Engineer cannot approve or verify" };
  }
  if (input.actor === "remediation_planner" && /execute|apply.?patch|modify.?code/i.test(input.action)) {
    return { allowed: false, reason: "Remediation Planner cannot execute" };
  }
  if (
    (input.actor === "governance_controller" || input.actor === "constitutional_compliance") &&
    /modify.?repositor|perform.?remediation|analyze.?code/i.test(input.action)
  ) {
    return { allowed: false, reason: `${agent.title} outside mission` };
  }
  return { allowed: true, reason: "Within delegated mission" };
}

export function formatCodeIntelligenceAgentGovernmentSummaryLines(
  g: CodeIntelligenceAgentGovernment,
): string[] {
  const ops = g.agents.filter((a) => a.operational).length;
  return [
    `${g.sealed ? "✓" : "○"} Agent Government ${g.agentVersion} (${CINT_AGENTS_KEY})`,
    `○ ${g.agents.length} agents · ${ops} operational · forbidden=${g.forbiddenPattern}`,
    `○ Build order: ${g.buildOrder.join(" → ")}`,
    `✕ Connector freeze ON until Phases 8–10 enforcement`,
  ];
}
