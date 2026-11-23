/**
 * cint.agents.runtime.v1 — Live Agent Runtime spine (Phase 21).
 *
 * Subordinate to cint.agents.v1 — never a super-agent.
 * Dispatches to EXISTING engine owners only (RIE · Finding · Evidence · AKE · Remediation · …).
 * Does not invent parallel analyzers, truth maps, or repair pipelines.
 * L1–L3 live by default after seal; L4/L5 require human + recovery + repair guard.
 * Connector freeze remains ON — no live OAuth/source sync here.
 */

import {
  CODE_INTELLIGENCE_AGENT_GOVERNMENT,
  CINT_CONNECTOR_FREEZE_DIRECTIVE,
  evaluateGovernanceBlock,
  getCodeIntelligenceAgent,
  isCodeIntelligenceAgentGovernmentSealed,
  resolveDecisionRight,
  type CodeIntelligenceAgentId,
} from "@/core/codeIntelligence/codeIntelligenceAgentGovernment";
import { isCodeIntelligenceRollbackEngineSealed } from "@/core/codeIntelligence/codeIntelligenceRollbackEngine";
import { areCodeIntelligencePhases810Sealed } from "@/core/codeIntelligence/codeIntelligencePhases810Seal";
import { isCodeIntelligenceDeliverySchemaSealed } from "@/core/codeIntelligence/codeIntelligenceDeliverySchema";
import { evaluateRepairGuard } from "@/core/codeIntelligence/codeIntelligenceGovernanceRepairGuard";
import {
  mayExecuteUnderEmergency,
  readCodeIntelligenceAuditEmergency,
} from "@/core/codeIntelligence/codeIntelligenceAuditEmergency";
import { evaluateCodeIntelligenceSealValidation } from "@/core/codeIntelligence/codeIntelligenceSealValidation";
import {
  analyzeCodeIntelligenceSnapshot,
  type CodeIntelligenceAnalysis,
} from "@/core/codeIntelligence/codeIntelligenceAnalysis";
import {
  CODE_INTELLIGENCE_DEMO_TREES,
  type RepositoryTreeSnapshot,
} from "@/core/codeIntelligence/repositoryIntelligenceEngine";
import { REPOSITORY_INTELLIGENCE_VERSION } from "@/core/codeIntelligence/repositoryIntelligenceEngine";
import { FINDING_ENGINE_VERSION } from "@/core/codeIntelligence/findingEngine";
import { ARCHITECTURE_KNOWLEDGE_ENGINE_VERSION } from "@/core/codeIntelligence/architectureKnowledgeEngine";
import { REMEDIATION_ENGINE_VERSION } from "@/core/codeIntelligence/remediationEngine";
import { analyzeChangeImpact } from "@/core/codeIntelligence/codeIntelligenceImpactAnalysis";
import { evaluatePredictiveRiskSignals } from "@/core/codeIntelligence/codeIntelligencePredictiveRisk";
import { rememberCodeIntelligenceEvent } from "@/core/codeIntelligence/codeIntelligenceMemoryEngine";
import { isCodeIntelligenceConnectorsWired } from "@/core/codeIntelligence/codeIntelligenceConnectorStatus";
import { pgbeTableOps } from "@/lib/backend/pgbeMemoryStore";

export const CINT_AGENTS_RUNTIME_KEY = "cint.agents.runtime.v1" as const;
export const CINT_AGENTS_RUNTIME_VERSION = "CINT-ARUN-1.0" as const;

export type AgentEngineBinding = Readonly<{
  agentId: CodeIntelligenceAgentId;
  primaryEngine: string;
  mode: "observe" | "analyse" | "prepare" | "execute" | "govern" | "verify";
  live: boolean;
  neverWritesSource: boolean;
}>;

export type AgentDispatchResult = Readonly<{
  ok: boolean;
  agentId: CodeIntelligenceAgentId;
  action: string;
  level: string;
  engine: string | null;
  blockers: readonly string[];
  summary: string;
  artifacts?: Readonly<Record<string, unknown>>;
}>;

export type CodeIntelligenceAgentRuntimeAuthority = Readonly<{
  version: "cint.agents.runtime.v1";
  sealed: boolean;
  sealedAt: string | null;
  runtimeVersion: typeof CINT_AGENTS_RUNTIME_VERSION;
  inventPages: false;
  forbiddenPattern: "super_agent";
  connectorFreeze: typeof CINT_CONNECTOR_FREEZE_DIRECTIVE;
  bindings: readonly AgentEngineBinding[];
  liveAgentIds: readonly CodeIntelligenceAgentId[];
  deferredAgentIds: readonly CodeIntelligenceAgentId[];
  rule: "Agents dispatch to existing engines — no parallel authority · no source write without L4/L5+recovery+connectors";
  constitution: readonly string[];
}>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** Canonical bindings — one primary engine owner per agent (anti-duplicate). */
export const CINT_AGENT_ENGINE_BINDINGS: readonly AgentEngineBinding[] = [
  {
    agentId: "governance_controller",
    primaryEngine: "cint.agents.v1/evaluateGovernanceBlock",
    mode: "govern",
    live: true,
    neverWritesSource: true,
  },
  {
    agentId: "authority_controller",
    primaryEngine: "cint.agents.v1/resolveDecisionRight",
    mode: "govern",
    live: true,
    neverWritesSource: true,
  },
  {
    agentId: "registry_controller",
    primaryEngine: "cint.registry.v1",
    mode: "govern",
    live: true,
    neverWritesSource: true,
  },
  {
    agentId: "repository_intelligence",
    primaryEngine: REPOSITORY_INTELLIGENCE_VERSION,
    mode: "observe",
    live: true,
    neverWritesSource: true,
  },
  {
    agentId: "evidence_intelligence",
    primaryEngine: "CINT-EE evidenceExplorer",
    mode: "observe",
    live: true,
    neverWritesSource: true,
  },
  {
    agentId: "blueprint_intelligence",
    primaryEngine: "cint.identity.v1 / cint.truthMap",
    mode: "observe",
    live: true,
    neverWritesSource: true,
  },
  {
    agentId: "reality_intelligence",
    primaryEngine: "CINT-EE-1.2 analyzeCodeIntelligenceSnapshot",
    mode: "observe",
    live: true,
    neverWritesSource: true,
  },
  {
    agentId: "architecture_specialist",
    primaryEngine: ARCHITECTURE_KNOWLEDGE_ENGINE_VERSION,
    mode: "analyse",
    live: true,
    neverWritesSource: true,
  },
  {
    agentId: "security_specialist",
    primaryEngine: FINDING_ENGINE_VERSION,
    mode: "analyse",
    live: true,
    neverWritesSource: true,
  },
  {
    agentId: "performance_specialist",
    primaryEngine: FINDING_ENGINE_VERSION,
    mode: "analyse",
    live: true,
    neverWritesSource: true,
  },
  {
    agentId: "quality_specialist",
    primaryEngine: FINDING_ENGINE_VERSION,
    mode: "analyse",
    live: true,
    neverWritesSource: true,
  },
  {
    agentId: "project_management",
    primaryEngine: "cint.agents.runtime.v1/routeOnly",
    mode: "prepare",
    live: true,
    neverWritesSource: true,
  },
  {
    agentId: "remediation_planner",
    primaryEngine: REMEDIATION_ENGINE_VERSION,
    mode: "prepare",
    live: true,
    neverWritesSource: true,
  },
  {
    agentId: "remediation_engineer",
    primaryEngine: "cint.governance.repair.guard.v1 + rollback",
    mode: "execute",
    live: false,
    neverWritesSource: true,
  },
  {
    agentId: "build_verification",
    primaryEngine: `${REPOSITORY_INTELLIGENCE_VERSION}/dependencyHealth`,
    mode: "verify",
    live: true,
    neverWritesSource: true,
  },
  {
    agentId: "testing_verification",
    primaryEngine: "CINT-EE integrity asserts",
    mode: "verify",
    live: true,
    neverWritesSource: true,
  },
  {
    agentId: "constitutional_compliance",
    primaryEngine: "cint.seal.validation.v1",
    mode: "verify",
    live: true,
    neverWritesSource: true,
  },
] as const;

export function buildCodeIntelligenceAgentRuntimeAuthority(options?: {
  sealed?: boolean;
}): CodeIntelligenceAgentRuntimeAuthority {
  const sealed = options?.sealed === true;
  const liveAgentIds = CINT_AGENT_ENGINE_BINDINGS.filter((b) => b.live).map((b) => b.agentId);
  const deferredAgentIds = CINT_AGENT_ENGINE_BINDINGS.filter((b) => !b.live).map((b) => b.agentId);
  return {
    version: "cint.agents.runtime.v1",
    sealed,
    sealedAt: sealed ? new Date().toISOString() : null,
    runtimeVersion: CINT_AGENTS_RUNTIME_VERSION,
    inventPages: false,
    forbiddenPattern: "super_agent",
    connectorFreeze: CINT_CONNECTOR_FREEZE_DIRECTIVE,
    bindings: CINT_AGENT_ENGINE_BINDINGS,
    liveAgentIds,
    deferredAgentIds,
    rule: "Agents dispatch to existing engines — no parallel authority · no source write without L4/L5+recovery+connectors",
    constitution: [
      "Phase 21 — Live Agent Runtime after Recovery + hardening seals",
      "Subordinate to cint.agents.v1 Agent Government",
      "Remediation Engineer remains deferred until interaction+connector+L4/L5+recovery",
      "Never Investigator+Approver+Executor+Verifier in one actor",
      "Connector freeze remains ON",
      "inventPages=false",
    ],
  };
}

export function sealCodeIntelligenceAgentRuntime(metadata: unknown): {
  metadata: Record<string, unknown>;
  runtime: CodeIntelligenceAgentRuntimeAuthority;
  blockedReason?: string;
} {
  const base = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  if (!isCodeIntelligenceAgentGovernmentSealed(base)) {
    return {
      metadata: base,
      runtime: buildCodeIntelligenceAgentRuntimeAuthority({ sealed: false }),
      blockedReason: "cint.agents.v1 Agent Government must be sealed before live agent runtime.",
    };
  }
  if (!areCodeIntelligencePhases810Sealed(base)) {
    return {
      metadata: base,
      runtime: buildCodeIntelligenceAgentRuntimeAuthority({ sealed: false }),
      blockedReason: "Phases 8–10 must be sealed before live agents.",
    };
  }
  if (!isCodeIntelligenceDeliverySchemaSealed(base)) {
    return {
      metadata: base,
      runtime: buildCodeIntelligenceAgentRuntimeAuthority({ sealed: false }),
      blockedReason: "Phase 11 Delivery Schema must be sealed before live agents.",
    };
  }
  if (!isCodeIntelligenceRollbackEngineSealed(base)) {
    return {
      metadata: base,
      runtime: buildCodeIntelligenceAgentRuntimeAuthority({ sealed: false }),
      blockedReason: "Phase 12 Recovery & Rollback must be sealed before live agents.",
    };
  }
  const runtime = buildCodeIntelligenceAgentRuntimeAuthority({ sealed: true });
  base[CINT_AGENTS_RUNTIME_KEY] = runtime;
  return { metadata: base, runtime };
}

export function readCodeIntelligenceAgentRuntime(
  metadata?: unknown,
): CodeIntelligenceAgentRuntimeAuthority | null {
  const block = asRecord(asRecord(metadata)?.[CINT_AGENTS_RUNTIME_KEY]);
  if (!block || block.version !== "cint.agents.runtime.v1") return null;
  return block as CodeIntelligenceAgentRuntimeAuthority;
}

export function isCodeIntelligenceAgentRuntimeSealed(metadata?: unknown): boolean {
  const r = readCodeIntelligenceAgentRuntime(metadata);
  return Boolean(r?.sealed && r.sealedAt);
}

export function detectCodeIntelligenceAgentRuntimeSealIntent(text: string): boolean {
  const t = text.toLowerCase();
  return (
    /\bphase\s*21\b/.test(t) ||
    /\blive agents?\b/.test(t) ||
    /\bagent runtime\b/.test(t) ||
    /\bcint\.agents\.runtime\.v1\b/.test(t) ||
    /\bstart\b.{0,20}\blive agents?\b/.test(t) ||
    /\bseal\b.{0,20}\bagent runtime\b/.test(t)
  );
}

function bindingFor(agentId: CodeIntelligenceAgentId): AgentEngineBinding | undefined {
  return CINT_AGENT_ENGINE_BINDINGS.find((b) => b.agentId === agentId);
}

/**
 * Dispatch a single agent mission through government + emergency + (for execute) repair guard.
 * Analyse/observe/prepare call existing engines — never invent parallel scanners.
 */
export function dispatchCodeIntelligenceAgent(input: {
  metadata?: unknown;
  agentId: CodeIntelligenceAgentId;
  action: string;
  tree?: RepositoryTreeSnapshot;
  humanApproved?: boolean;
  recoverySnapshotId?: string | null;
  combinesRoles?: readonly string[];
  /** When set, records a real GitHub PR apply (from /cint/remediation/apply). */
  pullRequest?: {
    prUrl: string;
    prNumber: number;
    branch: string;
    commitSha: string;
    repository: string;
  } | null;
}): AgentDispatchResult {
  const runtime = readCodeIntelligenceAgentRuntime(input.metadata);
  if (!runtime?.sealed) {
    return {
      ok: false,
      agentId: input.agentId,
      action: input.action,
      level: "DENY",
      engine: null,
      blockers: ["CINT_AGENTS_RUNTIME_UNSEALED"],
      summary: "Live agent runtime not sealed",
    };
  }

  const agent = getCodeIntelligenceAgent(input.agentId);
  const binding = bindingFor(input.agentId);
  if (!agent || !binding) {
    return {
      ok: false,
      agentId: input.agentId,
      action: input.action,
      level: "DENY",
      engine: null,
      blockers: ["UNKNOWN_AGENT"],
      summary: "Unknown agent",
    };
  }

  const connectorsWired = isCodeIntelligenceConnectorsWired(input.metadata);
  const engineerUnlocked =
    input.agentId === "remediation_engineer" &&
    connectorsWired &&
    binding.mode === "execute";

  if (!binding.live && !engineerUnlocked) {
    return {
      ok: false,
      agentId: input.agentId,
      action: input.action,
      level: binding.mode.toUpperCase(),
      engine: binding.primaryEngine,
      blockers: ["AGENT_DEFERRED_UNTIL_CONNECTOR_INTERACTION"],
      summary: `${agent.title} deferred — no live source mutation until interaction+connectors`,
    };
  }

  const gov = evaluateGovernanceBlock({
    actor: input.agentId,
    action: input.action,
    combinesRoles: input.combinesRoles,
  });
  if (!gov.allowed) {
    return {
      ok: false,
      agentId: input.agentId,
      action: input.action,
      level: "GOV",
      engine: binding.primaryEngine,
      blockers: ["GOVERNANCE_BLOCK", gov.reason],
      summary: gov.reason,
    };
  }

  const rightsAction =
    binding.mode === "govern"
      ? "approve"
      : binding.mode === "verify"
        ? "observe"
        : binding.mode === "execute"
          ? "execute"
          : binding.mode === "prepare"
            ? "prepare"
            : binding.mode === "analyse"
              ? "analyse"
              : "observe";

  // Controllers use govern path without requiring "approve" human for permission checks.
  const rights =
    binding.mode === "govern"
      ? { allowedAgents: [input.agentId] as const, requiresHuman: false, level: "GOV" }
      : resolveDecisionRight({
          action: rightsAction as "observe" | "analyse" | "prepare" | "execute" | "approve",
        });

  if (
    binding.mode !== "govern" &&
    rights.allowedAgents.length > 0 &&
    !rights.allowedAgents.includes(input.agentId) &&
    input.agentId !== "constitutional_compliance" &&
    input.agentId !== "build_verification" &&
    input.agentId !== "testing_verification" &&
    input.agentId !== "project_management"
  ) {
    return {
      ok: false,
      agentId: input.agentId,
      action: input.action,
      level: rights.level,
      engine: binding.primaryEngine,
      blockers: ["DECISION_RIGHT_DENIED"],
      summary: `${agent.title} not authorized for ${rightsAction}`,
    };
  }

  if (binding.mode === "execute") {
    const audit = readCodeIntelligenceAuditEmergency(input.metadata);
    const emerg = mayExecuteUnderEmergency(audit);
    if (!emerg.allowed) {
      return {
        ok: false,
        agentId: input.agentId,
        action: input.action,
        level: "L4",
        engine: binding.primaryEngine,
        blockers: [emerg.reason],
        summary: emerg.reason,
      };
    }
    const guard = evaluateRepairGuard({
      metadata: input.metadata,
      humanApproved: input.humanApproved,
      recoverySnapshotId: input.recoverySnapshotId,
    });
    if (!guard.allowed) {
      return {
        ok: false,
        agentId: input.agentId,
        action: input.action,
        level: "L4",
        engine: binding.primaryEngine,
        blockers: guard.blockers,
        summary: `Repair guard blocked at ${guard.failedStage}`,
      };
    }
    if (!connectorsWired) {
      return {
        ok: false,
        agentId: input.agentId,
        action: input.action,
        level: "L4",
        engine: binding.primaryEngine,
        blockers: ["SOURCE_WRITE_REQUIRES_CONNECTOR"],
        summary:
          "Execute authorized by gates but source write deferred until connectors (neverWritesSource)",
        artifacts: { neverWritesSource: true, guardPassed: true },
      };
    }
    if (!input.humanApproved || !input.recoverySnapshotId) {
      return {
        ok: false,
        agentId: input.agentId,
        action: input.action,
        level: "L4",
        engine: binding.primaryEngine,
        blockers: ["L4_L5_HUMAN_AND_RECOVERY_REQUIRED"],
        summary:
          "Remediation Engineer requires human L4/L5 approval and a recovery snapshot id before source writes",
        artifacts: { neverWritesSource: true, guardPassed: true, connectorsWired: true },
      };
    }
    // Authorized source write — sealed PGBE remediation record; attach PR when apply API succeeded.
    const pr = input.pullRequest;
    const writeRecord = pgbeTableOps.create("remediation", {
      findingId: "authorized",
      proposal: input.action,
      risk: "HIGH",
      approvalLevel: "L4",
      humanApprovalId: "human_operator",
      executionStatus: "applied",
      writesSource: true,
      recoverySnapshotId: input.recoverySnapshotId,
      appliedAt: new Date().toISOString(),
      agentId: input.agentId,
      ...(pr
        ? {
            prUrl: pr.prUrl,
            prNumber: pr.prNumber,
            branch: pr.branch,
            commitSha: pr.commitSha,
            repository: pr.repository,
          }
        : {}),
    });
    rememberCodeIntelligenceEvent(input.metadata, {
      kind: "past_repair",
      title: pr ? "Authorized remediation PR" : "Authorized remediation write",
      detail: pr
        ? `${input.action} → ${writeRecord.id} PR ${pr.prUrl} (recovery ${input.recoverySnapshotId})`
        : `${input.action} → ${writeRecord.id} (recovery ${input.recoverySnapshotId}; call /cint/remediation/apply for live PR)`,
      relatedPaths: [],
    });
    return {
      ok: true,
      agentId: input.agentId,
      action: input.action,
      level: "L4",
      engine: binding.primaryEngine,
      blockers: [],
      summary: pr
        ? `Remediation Engineer opened PR ${pr.prUrl} under L4/L5 + recovery`
        : `Remediation Engineer applied authorized write ${writeRecord.id} under L4/L5 + recovery (sealed record; use /cint/remediation/apply for live PR)`,
      artifacts: {
        neverWritesSource: false,
        writesSource: true,
        writeId: writeRecord.id,
        guardPassed: true,
        connectorsWired: true,
        prUrl: pr?.prUrl ?? null,
        applyRoute: `/api/projects/{projectId}/cint/remediation/apply`,
      },
    };
  }

  const tree =
    input.tree ??
    CODE_INTELLIGENCE_DEMO_TREES["payments-api"] ??
    Object.values(CODE_INTELLIGENCE_DEMO_TREES)[0];

  if (!tree && (binding.mode === "observe" || binding.mode === "analyse" || binding.mode === "prepare" || binding.mode === "verify")) {
    return {
      ok: false,
      agentId: input.agentId,
      action: input.action,
      level: rights.level,
      engine: binding.primaryEngine,
      blockers: ["NO_SNAPSHOT"],
      summary: "No repository snapshot available (demo tree missing)",
    };
  }

  const analysis: CodeIntelligenceAnalysis | null = tree
    ? analyzeCodeIntelligenceSnapshot(tree)
    : null;

  switch (input.agentId) {
    case "governance_controller":
      return {
        ok: true,
        agentId: input.agentId,
        action: input.action,
        level: "GOV",
        engine: binding.primaryEngine,
        blockers: [],
        summary: "Governance Controller evaluated action permissions",
        artifacts: { governance: gov },
      };
    case "authority_controller":
      return {
        ok: true,
        agentId: input.agentId,
        action: input.action,
        level: "GOV",
        engine: binding.primaryEngine,
        blockers: [],
        summary: "Authority Controller resolved decision rights",
        artifacts: { rights: resolveDecisionRight({ action: "analyse" }) },
      };
    case "registry_controller":
      return {
        ok: true,
        agentId: input.agentId,
        action: input.action,
        level: "GOV",
        engine: binding.primaryEngine,
        blockers: [],
        summary: "Registry Controller — canonical registry read path only",
      };
    case "repository_intelligence":
      return {
        ok: true,
        agentId: input.agentId,
        action: input.action,
        level: "L1",
        engine: binding.primaryEngine,
        blockers: [],
        summary: `Repository mapped: ${analysis!.intelligence.profile.fileCount} files`,
        artifacts: {
          profile: analysis!.intelligence.profile,
          tech: analysis!.intelligence.tech,
        },
      };
    case "evidence_intelligence":
      return {
        ok: true,
        agentId: input.agentId,
        action: input.action,
        level: "L1",
        engine: binding.primaryEngine,
        blockers: [],
        summary: `Evidence packages: ${analysis!.evidence.length}`,
        artifacts: { evidenceCount: analysis!.evidence.length },
      };
    case "blueprint_intelligence":
      return {
        ok: true,
        agentId: input.agentId,
        action: input.action,
        level: "L1",
        engine: binding.primaryEngine,
        blockers: [],
        summary: "Blueprint/identity surfaces read (observe-only)",
        artifacts: { expectedFromGovernment: CODE_INTELLIGENCE_AGENT_GOVERNMENT.length },
      };
    case "reality_intelligence":
      return {
        ok: true,
        agentId: input.agentId,
        action: input.action,
        level: "L1",
        engine: binding.primaryEngine,
        blockers: [],
        summary: `Current state snapshot: ${analysis!.findings.length} findings`,
        artifacts: { findingCount: analysis!.findings.length },
      };
    case "architecture_specialist":
      return {
        ok: true,
        agentId: input.agentId,
        action: input.action,
        level: "L2",
        engine: binding.primaryEngine,
        blockers: [],
        summary: `Architecture nodes: ${analysis!.architecture.nodes.length}`,
        artifacts: { architecture: analysis!.architecture },
      };
    case "security_specialist": {
      const sec = analysis!.findings.filter((f) =>
        /SEC|AUTH|ACCESS|TLS|SECRET|CONFIG/i.test(f.category),
      );
      return {
        ok: true,
        agentId: input.agentId,
        action: input.action,
        level: "L2",
        engine: binding.primaryEngine,
        blockers: [],
        summary: `Security findings: ${sec.length}`,
        artifacts: { findings: sec.map((f) => f.id) },
      };
    }
    case "performance_specialist": {
      const perf = analysis!.findings.filter((f) => /PERF|COMPLEX/i.test(f.category));
      return {
        ok: true,
        agentId: input.agentId,
        action: input.action,
        level: "L2",
        engine: binding.primaryEngine,
        blockers: [],
        summary: `Performance findings: ${perf.length}`,
        artifacts: { findings: perf.map((f) => f.id) },
      };
    }
    case "quality_specialist": {
      const qual = analysis!.findings.filter((f) => /DUP|MAINT|DOC|QUALITY/i.test(f.category));
      return {
        ok: true,
        agentId: input.agentId,
        action: input.action,
        level: "L2",
        engine: binding.primaryEngine,
        blockers: [],
        summary: `Quality findings: ${qual.length}`,
        artifacts: { findings: qual.map((f) => f.id) },
      };
    }
    case "project_management":
      return {
        ok: true,
        agentId: input.agentId,
        action: input.action,
        level: "L3",
        engine: binding.primaryEngine,
        blockers: [],
        summary: "PM routed observe→analyse→prepare — cannot approve/seal/execute",
        artifacts: {
          route: ["repository_intelligence", "architecture_specialist", "remediation_planner"],
        },
      };
    case "remediation_planner": {
      const impact = analyzeChangeImpact({
        files: analysis!.findings.slice(0, 12).map((f) => f.evidence[0]?.location || f.id),
      });
      const risks = evaluatePredictiveRiskSignals({
        metadata: input.metadata,
        paths: impact.paths,
      });
      return {
        ok: true,
        agentId: input.agentId,
        action: input.action,
        level: "L3",
        engine: binding.primaryEngine,
        blockers: [],
        summary: `Remediation plans: ${analysis!.remediations.length} · impact ${impact.riskLevel}`,
        artifacts: {
          plans: analysis!.remediations.length,
          impact,
          predictiveTop: risks[0]?.title,
          neverWritesSource: true,
        },
      };
    }
    case "build_verification":
      return {
        ok: true,
        agentId: input.agentId,
        action: input.action,
        level: "L1",
        engine: binding.primaryEngine,
        blockers: [],
        summary: `Dependency health: ${analysis!.intelligence.dependencies.nodes.length} nodes`,
        artifacts: {
          dependencyNodes: analysis!.intelligence.dependencies.nodes.length,
          edges: analysis!.intelligence.dependencies.edges.length,
        },
      };
    case "testing_verification":
      return {
        ok: true,
        agentId: input.agentId,
        action: input.action,
        level: "L1",
        engine: binding.primaryEngine,
        blockers: [],
        summary: `Integrity: findings ${analysis!.findings.length} · evidence ${analysis!.evidence.length} · plans ${analysis!.remediations.length}`,
        artifacts: {
          findings: analysis!.findings.length,
          evidence: analysis!.evidence.length,
          investigations: analysis!.investigations.length,
          remediations: analysis!.remediations.length,
        },
      };
    case "constitutional_compliance": {
      const seal = evaluateCodeIntelligenceSealValidation(input.metadata);
      return {
        ok: true,
        agentId: input.agentId,
        action: input.action,
        level: "L1",
        engine: binding.primaryEngine,
        blockers: seal.bypassAttempts.map((b) => b.code),
        summary: `Compliance integrity ${seal.integrityScore}% · bypass ${seal.bypassAttempts.length}`,
        artifacts: {
          integrityScore: seal.integrityScore,
          evidenceValid: seal.evidenceValid,
          governanceValid: seal.governanceValid,
          auditValid: seal.auditValid,
        },
      };
    }
    default:
      return {
        ok: false,
        agentId: input.agentId,
        action: input.action,
        level: "DENY",
        engine: binding.primaryEngine,
        blockers: ["UNHANDLED_AGENT"],
        summary: "No dispatch handler",
      };
  }
}

/** Run all live agents for a government buildPhase (1–6). */
export function runCodeIntelligenceAgentBuildPhase(input: {
  metadata?: unknown;
  buildPhase: 1 | 2 | 3 | 4 | 5 | 6;
  tree?: RepositoryTreeSnapshot;
}): {
  results: readonly AgentDispatchResult[];
  metadata: Record<string, unknown>;
} {
  let working = asRecord(input.metadata) ? { ...asRecord(input.metadata)! } : {};
  const agents = CODE_INTELLIGENCE_AGENT_GOVERNMENT.filter(
    (a) => a.buildPhase === input.buildPhase,
  );
  const results: AgentDispatchResult[] = [];
  for (const agent of agents) {
    const result = dispatchCodeIntelligenceAgent({
      metadata: working,
      agentId: agent.id,
      action: `build_phase_${input.buildPhase}`,
      tree: input.tree,
    });
    results.push(result);
  }
  const memorized = rememberCodeIntelligenceEvent(working, {
    kind: "past_audit",
    title: `Agent build phase ${input.buildPhase}`,
    detail: results.map((r) => `${r.agentId}:${r.ok ? "ok" : "blocked"}`).join(", "),
  });
  if (memorized.memory) working = memorized.metadata;
  return { results, metadata: working };
}

/** Full L1–L3 government pass over one snapshot (interaction-ready). */
export function runCodeIntelligenceLiveAgentPass(input: {
  metadata?: unknown;
  tree?: RepositoryTreeSnapshot;
}): {
  metadata: Record<string, unknown>;
  results: readonly AgentDispatchResult[];
  analysis: CodeIntelligenceAnalysis | null;
  blockedReason?: string;
} {
  if (!isCodeIntelligenceAgentRuntimeSealed(input.metadata)) {
    return {
      metadata: asRecord(input.metadata) ? { ...asRecord(input.metadata)! } : {},
      results: [],
      analysis: null,
      blockedReason: "Agent runtime not sealed",
    };
  }
  const tree =
    input.tree ??
    CODE_INTELLIGENCE_DEMO_TREES["payments-api"] ??
    Object.values(CODE_INTELLIGENCE_DEMO_TREES)[0];
  const analysis = tree ? analyzeCodeIntelligenceSnapshot(tree) : null;
  let working = asRecord(input.metadata) ? { ...asRecord(input.metadata)! } : {};
  const results: AgentDispatchResult[] = [];
  for (const phase of [1, 2, 3, 4, 5, 6] as const) {
    const batch = runCodeIntelligenceAgentBuildPhase({
      metadata: working,
      buildPhase: phase,
      tree,
    });
    working = batch.metadata;
    results.push(...batch.results);
  }
  return { metadata: working, results, analysis };
}

export function formatCodeIntelligenceAgentRuntimeSummaryLines(
  runtime: CodeIntelligenceAgentRuntimeAuthority,
): string[] {
  return [
    `${runtime.sealed ? "✓" : "○"} Agent Runtime ${runtime.runtimeVersion} (${CINT_AGENTS_RUNTIME_KEY})`,
    `○ Live: ${runtime.liveAgentIds.length} · Deferred: ${runtime.deferredAgentIds.join(", ") || "none"}`,
    `○ Bindings: ${runtime.bindings.length} agents → existing engines (no parallel scanners)`,
    `○ Rule: ${runtime.rule}`,
  ];
}
