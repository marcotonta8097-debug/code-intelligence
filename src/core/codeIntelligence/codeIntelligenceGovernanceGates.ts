/**
 * cint.governance.gates.v1 — Phase 9 Governance Gates L1–L5.
 *
 * Executable permission levels (Article VII). Remediation Engineer cannot
 * Execute (L4) or Consequential (L5) without recorded human approval.
 * Subordinate to cint.constitution.v1; never a super-agent.
 */

import {
  getCodeIntelligenceAgent,
  resolveDecisionRight,
  type CodeIntelligenceAgentId,
} from "@/core/codeIntelligence/codeIntelligenceAgentGovernment";

export const CINT_GOVERNANCE_GATES_KEY = "cint.governance.gates.v1" as const;
export const CINT_GOVERNANCE_GATES_VERSION = "CINT-GG-1.0" as const;

export type CodeIntelligenceGovernanceLevel = "L1" | "L2" | "L3" | "L4" | "L5";

export type CodeIntelligenceGovernanceLevelSpec = Readonly<{
  level: CodeIntelligenceGovernanceLevel;
  label: string;
  examples: readonly string[];
  approvalRequired: boolean | "explicit_human";
  executionAllowed: boolean;
  mayAgents: readonly CodeIntelligenceAgentId[];
}>;

export type HumanApprovalRecord = Readonly<{
  approved: true;
  approvedBy: string;
  approvedAt: string;
  level: "L4" | "L5";
  scope: string;
  changeProposalId?: string | null;
}>;

export type GovernancePermissionInput = Readonly<{
  actor: CodeIntelligenceAgentId;
  /** Mapped Article VII action family. */
  action:
    | "observe"
    | "analyse"
    | "prepare"
    | "execute"
    | "consequential"
    | "registry_write"
    | "approve";
  humanApproval?: HumanApprovalRecord | null;
  /** Optional declared level override — must not exceed action mapping. */
  claimedLevel?: CodeIntelligenceGovernanceLevel | null;
}>;

export type GovernancePermissionResult = Readonly<{
  allowed: boolean;
  level: string;
  requiresHuman: boolean;
  reason: string;
  blockers: readonly string[];
}>;

export type CodeIntelligenceGovernanceGatesAuthority = Readonly<{
  version: "cint.governance.gates.v1";
  sealed: boolean;
  sealedAt: string | null;
  gateVersion: typeof CINT_GOVERNANCE_GATES_VERSION;
  inventPages: false;
  levels: readonly CodeIntelligenceGovernanceLevelSpec[];
  rule: "No human approval — no L4/L5 execute";
  constitution: readonly string[];
}>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export const CODE_INTELLIGENCE_GOVERNANCE_LEVELS: readonly CodeIntelligenceGovernanceLevelSpec[] =
  [
    {
      level: "L1",
      label: "Observe",
      examples: ["read", "index", "map repository structure"],
      approvalRequired: false,
      executionAllowed: false,
      mayAgents: [
        "repository_intelligence",
        "evidence_intelligence",
        "blueprint_intelligence",
        "reality_intelligence",
      ],
    },
    {
      level: "L2",
      label: "Analyse",
      examples: ["scan", "assess", "attach evidence"],
      approvalRequired: false,
      executionAllowed: false,
      mayAgents: [
        "architecture_specialist",
        "security_specialist",
        "performance_specialist",
        "quality_specialist",
        "evidence_intelligence",
      ],
    },
    {
      level: "L3",
      label: "Prepare",
      examples: ["plan", "draft patch", "report", "export demo"],
      approvalRequired: false,
      executionAllowed: false,
      mayAgents: ["remediation_planner", "evidence_intelligence", "project_management"],
    },
    {
      level: "L4",
      label: "Execute",
      examples: ["modify", "install", "apply patch"],
      approvalRequired: true,
      executionAllowed: true,
      mayAgents: ["remediation_engineer"],
    },
    {
      level: "L5",
      label: "Consequential",
      examples: ["delete", "DB change", "auth change", "prod restructure"],
      approvalRequired: "explicit_human",
      executionAllowed: true,
      mayAgents: ["remediation_engineer"],
    },
  ] as const;

function levelRank(level: string): number {
  switch (level) {
    case "L1":
      return 1;
    case "L2":
      return 2;
    case "L3":
      return 3;
    case "L4":
      return 4;
    case "L5":
      return 5;
    default:
      return 99;
  }
}

function isValidHumanApproval(
  approval: HumanApprovalRecord | null | undefined,
  requiredLevel: "L4" | "L5",
): boolean {
  if (!approval || approval.approved !== true) return false;
  if (!(approval.approvedBy ?? "").trim()) return false;
  if (!(approval.approvedAt ?? "").trim()) return false;
  if (!(approval.scope ?? "").trim()) return false;
  if (requiredLevel === "L5" && approval.level !== "L5") return false;
  if (requiredLevel === "L4" && approval.level !== "L4" && approval.level !== "L5") return false;
  return true;
}

/**
 * Phase 9 gate — maps action → L1–L5 and blocks L4/L5 without human approval.
 */
export function evaluateGovernancePermission(
  input: GovernancePermissionInput,
): GovernancePermissionResult {
  const rights = resolveDecisionRight({ action: input.action });
  const blockers: string[] = [];
  const agent = getCodeIntelligenceAgent(input.actor);

  if (!agent) {
    return {
      allowed: false,
      level: "DENY",
      requiresHuman: true,
      reason: "Unknown actor — denied",
      blockers: ["UNKNOWN_ACTOR"],
    };
  }

  if (input.claimedLevel && levelRank(input.claimedLevel) > levelRank(rights.level)) {
    blockers.push("CLAIMED_LEVEL_EXCEEDS_ACTION");
    return {
      allowed: false,
      level: rights.level,
      requiresHuman: rights.requiresHuman,
      reason: `Claimed ${input.claimedLevel} exceeds mapped ${rights.level} for ${input.action}`,
      blockers,
    };
  }

  if (
    (rights.level === "L4" || rights.level === "L5") &&
    !rights.allowedAgents.includes(input.actor)
  ) {
    blockers.push("ACTOR_NOT_AUTHORIZED_FOR_LEVEL");
    return {
      allowed: false,
      level: rights.level,
      requiresHuman: true,
      reason: `${agent.title} may not perform ${rights.level} ${input.action}`,
      blockers,
    };
  }

  if (rights.level === "L4" || rights.level === "L5") {
    const ok = isValidHumanApproval(input.humanApproval, rights.level);
    if (!ok) {
      blockers.push(
        rights.level === "L5" ? "HUMAN_L5_APPROVAL_REQUIRED" : "HUMAN_L4_APPROVAL_REQUIRED",
      );
      if (input.actor === "remediation_engineer") {
        blockers.push("REMEDIATION_ENGINEER_BLOCKED");
      }
      return {
        allowed: false,
        level: rights.level,
        requiresHuman: true,
        reason:
          rights.level === "L5"
            ? "L5 Consequential requires explicit human authorization before Remediation Engineer may act"
            : "L4 Execute requires human approval before Remediation Engineer may modify code",
        blockers,
      };
    }
  }

  if (rights.allowedAgents.length > 0 && !rights.allowedAgents.includes(input.actor)) {
    // Soft observe/analyse/prepare: allow if agent mission includes related verbs
    if (rights.level === "L1" || rights.level === "L2" || rights.level === "L3") {
      // still prefer allowlist; deny foreign actors on prepare/execute families
      if (input.action === "prepare" || input.action === "analyse" || input.action === "observe") {
        blockers.push("ACTOR_OUTSIDE_ALLOWLIST");
        return {
          allowed: false,
          level: rights.level,
          requiresHuman: false,
          reason: `${agent.title} is outside ${rights.level} allowlist for ${input.action}`,
          blockers,
        };
      }
    }
  }

  return {
    allowed: true,
    level: rights.level,
    requiresHuman: rights.requiresHuman,
    reason:
      rights.requiresHuman && input.humanApproval
        ? `${rights.level} authorized with human approval by ${input.humanApproval.approvedBy}`
        : `${rights.level} within delegated mission`,
    blockers: [],
  };
}

/** Convenience — Remediation Engineer L4/L5 execute path. */
export function authorizeRemediationExecute(input: {
  level: "L4" | "L5";
  humanApproval?: HumanApprovalRecord | null;
  actor?: CodeIntelligenceAgentId;
}): GovernancePermissionResult {
  return evaluateGovernancePermission({
    actor: input.actor ?? "remediation_engineer",
    action: input.level === "L5" ? "consequential" : "execute",
    humanApproval: input.humanApproval,
    claimedLevel: input.level,
  });
}

export function buildCodeIntelligenceGovernanceGatesAuthority(options?: {
  sealed?: boolean;
}): CodeIntelligenceGovernanceGatesAuthority {
  const sealed = options?.sealed === true;
  return {
    version: "cint.governance.gates.v1",
    sealed,
    sealedAt: sealed ? new Date().toISOString() : null,
    gateVersion: CINT_GOVERNANCE_GATES_VERSION,
    inventPages: false,
    levels: CODE_INTELLIGENCE_GOVERNANCE_LEVELS,
    rule: "No human approval — no L4/L5 execute",
    constitution: [
      "Article VII — Observe/Analyse/Prepare/Execute/Consequential",
      "Article VI — Investigator ≠ Approver ≠ Executor ≠ Verifier",
      "Article VIII — Change Control before major rewrite",
      "Remediation Engineer blocked without human L4/L5 approval",
      "Never a super-agent",
    ],
  };
}

export function sealCodeIntelligenceGovernanceGates(metadata: unknown): {
  metadata: Record<string, unknown>;
  gates: CodeIntelligenceGovernanceGatesAuthority;
} {
  const base = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  const gates = buildCodeIntelligenceGovernanceGatesAuthority({ sealed: true });
  base[CINT_GOVERNANCE_GATES_KEY] = gates;
  return { metadata: base, gates };
}

export function readCodeIntelligenceGovernanceGates(
  metadata?: unknown,
): CodeIntelligenceGovernanceGatesAuthority | null {
  const block = asRecord(asRecord(metadata)?.[CINT_GOVERNANCE_GATES_KEY]);
  if (!block || block.version !== "cint.governance.gates.v1") return null;
  return block as CodeIntelligenceGovernanceGatesAuthority;
}

export function isCodeIntelligenceGovernanceGatesSealed(metadata?: unknown): boolean {
  const g = readCodeIntelligenceGovernanceGates(metadata);
  return Boolean(g?.sealed && g.sealedAt);
}

export function detectCodeIntelligenceGovernanceGatesSealIntent(text: string): boolean {
  const t = text.toLowerCase();
  return (
    /\bphase\s*9\b/.test(t) ||
    /\bgovernance gates?\b/.test(t) ||
    /\bcint\.governance\.gates\.v1\b/.test(t) ||
    /\bl4\/l5\b/.test(t) ||
    /\bseal\b.*\bgovernance\b/.test(t) ||
    /\bapproval governance\b/.test(t)
  );
}

export function formatCodeIntelligenceGovernanceGatesSummaryLines(
  gates: CodeIntelligenceGovernanceGatesAuthority,
): string[] {
  return [
    `${gates.sealed ? "✓" : "○"} Governance Gates ${gates.gateVersion} (${CINT_GOVERNANCE_GATES_KEY})`,
    `○ Rule: ${gates.rule}`,
    `○ Levels: L1 Observe · L2 Analyse · L3 Prepare · L4 Execute · L5 Consequential`,
  ];
}
