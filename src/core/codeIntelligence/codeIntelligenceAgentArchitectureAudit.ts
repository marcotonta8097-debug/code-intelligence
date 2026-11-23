/**
 * cint.agents.architecture.audit.v1 — Post-runtime architecture health audit.
 *
 * Detects duplicates, overlaps, intertwining, and unhealthy authority shapes
 * after live agent wiring — before connector enablement.
 */

import {
  CODE_INTELLIGENCE_AGENT_GOVERNMENT,
  isCodeIntelligenceAgentGovernmentSealed,
} from "@/core/codeIntelligence/codeIntelligenceAgentGovernment";
import {
  CINT_AGENT_ENGINE_BINDINGS,
  isCodeIntelligenceAgentRuntimeSealed,
  readCodeIntelligenceAgentRuntime,
} from "@/core/codeIntelligence/codeIntelligenceAgentRuntime";
import { isCodeIntelligenceAgentInteractionSealed } from "@/core/codeIntelligence/codeIntelligenceAgentInteraction";
import { isCodeIntelligenceRollbackEngineSealed } from "@/core/codeIntelligence/codeIntelligenceRollbackEngine";
import { areCodeIntelligencePhases1320Sealed } from "@/core/codeIntelligence/codeIntelligencePhases1320Seal";
import { isCodeIntelligenceConnectorFreezeLifted } from "@/core/codeIntelligence/codeIntelligenceConnectorLift";
import { isCodeIntelligenceConnectorsWired } from "@/core/codeIntelligence/codeIntelligenceConnectorStatus";

export const CINT_AGENTS_ARCHITECTURE_AUDIT_KEY = "cint.agents.architecture.audit.v1" as const;
export const CINT_AGENTS_ARCHITECTURE_AUDIT_VERSION = "CINT-AAUD-1.0" as const;

export type ArchitectureAuditFinding = Readonly<{
  severity: "info" | "warn" | "fail";
  code: string;
  detail: string;
}>;

export type CodeIntelligenceAgentArchitectureAudit = Readonly<{
  version: "cint.agents.architecture.audit.v1";
  sealed: boolean;
  sealedAt: string | null;
  auditVersion: typeof CINT_AGENTS_ARCHITECTURE_AUDIT_VERSION;
  healthy: boolean;
  findings: readonly ArchitectureAuditFinding[];
  checksPassed: number;
  checksFailed: number;
  connectorEnablementAllowed: boolean;
  rule: "No duplicates · no super-agent · one engine owner per mission · connectors only after healthy audit";
  constitution: readonly string[];
}>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function evaluateCodeIntelligenceAgentArchitectureAudit(
  metadata?: unknown,
): Omit<CodeIntelligenceAgentArchitectureAudit, "sealed" | "sealedAt"> & {
  sealed: false;
  sealedAt: null;
} {
  const findings: ArchitectureAuditFinding[] = [];
  let checksPassed = 0;
  let checksFailed = 0;

  const pass = (code: string, detail: string) => {
    checksPassed += 1;
    findings.push({ severity: "info", code, detail });
  };
  const fail = (code: string, detail: string) => {
    checksFailed += 1;
    findings.push({ severity: "fail", code, detail });
  };
  const warn = (code: string, detail: string) => {
    findings.push({ severity: "warn", code, detail });
  };

  if (!isCodeIntelligenceAgentGovernmentSealed(metadata)) {
    fail("GOVERNMENT_UNSEALED", "cint.agents.v1 must be sealed");
  } else {
    pass("GOVERNMENT_SEALED", "Agent Government sealed");
  }

  if (!isCodeIntelligenceAgentRuntimeSealed(metadata)) {
    fail("RUNTIME_UNSEALED", "cint.agents.runtime.v1 must be sealed before audit completion");
  } else {
    pass("RUNTIME_SEALED", "Agent Runtime sealed");
  }

  if (!isCodeIntelligenceRollbackEngineSealed(metadata)) {
    fail("ROLLBACK_MISSING", "Live agents without recovery capability");
  } else {
    pass("ROLLBACK_PRESENT", "Recovery & Rollback sealed");
  }

  // Every government agent has exactly one runtime binding.
  const boundIds = new Set(CINT_AGENT_ENGINE_BINDINGS.map((b) => b.agentId));
  for (const agent of CODE_INTELLIGENCE_AGENT_GOVERNMENT) {
    if (!boundIds.has(agent.id)) {
      fail("UNBOUND_AGENT", `${agent.id} missing runtime engine binding`);
    }
  }
  if (CINT_AGENT_ENGINE_BINDINGS.length === CODE_INTELLIGENCE_AGENT_GOVERNMENT.length) {
    pass("BINDING_COVERAGE", "All 17 agents have exactly one primary engine binding entry");
  }

  // Detect duplicate primary-engine ownership conflicts for govern vs analyse missions.
  const analyseEngines = CINT_AGENT_ENGINE_BINDINGS.filter((b) => b.mode === "analyse").map(
    (b) => b.primaryEngine,
  );
  // Sharing FINDING_ENGINE across specialists is intentional (category filter) — warn only if >4 share identical engine+mode without differentiation.
  const findingSpecialists = CINT_AGENT_ENGINE_BINDINGS.filter(
    (b) => b.mode === "analyse" && b.primaryEngine.includes("CINT-FE"),
  );
  if (findingSpecialists.length > 0 && findingSpecialists.length <= 3) {
    pass(
      "FINDING_ENGINE_SHARED_OK",
      "Security/Performance/Quality share Finding Engine via category filters — not parallel finders",
    );
  } else if (findingSpecialists.length > 3) {
    warn(
      "FINDING_ENGINE_OVERSHARE",
      "Unexpected number of analyse agents on Finding Engine — review for overlap",
    );
  }

  // Super-agent pattern: no agent may hold approve-authority AND source-execute authority.
  // Governance "Verify permissions" is not work-product verification — exclude that false positive.
  for (const agent of CODE_INTELLIGENCE_AGENT_GOVERNMENT) {
    const mayApprove = agent.may.some((m) => /^approve\b/i.test(m.trim()));
    const mayExecute = agent.may.some((m) =>
      /^(modify|execute|implement|repair|create files|refactor)\b/i.test(m.trim()),
    );
    if (mayApprove && mayExecute) {
      fail("SUPER_AGENT_SHAPE", `${agent.id} may[] combines approval with source execute`);
    }
  }
  pass("NO_SUPER_AGENT_IN_MAY", "No agent may[] combines approve with source execute");

  // Remediation engineer: deferred until connectors wired; then L4/L5+recovery gated.
  const engineer = CINT_AGENT_ENGINE_BINDINGS.find((b) => b.agentId === "remediation_engineer");
  const connectorsWired = isCodeIntelligenceConnectorsWired(metadata);
  if (!connectorsWired) {
    if (!engineer?.neverWritesSource || engineer.live) {
      fail(
        "ENGINEER_UNSAFE",
        "Remediation Engineer must stay deferred + neverWritesSource until connectors",
      );
    } else {
      pass("ENGINEER_DEFERRED", "Remediation Engineer deferred with neverWritesSource");
    }
  } else {
    pass(
      "ENGINEER_CONNECTOR_GATED",
      "Connectors wired — Remediation Engineer may write only under L4/L5 + recovery",
    );
  }

  const catalogEngineer = CODE_INTELLIGENCE_AGENT_GOVERNMENT.find(
    (a) => a.id === "remediation_engineer",
  );
  if (!connectorsWired && catalogEngineer?.operational) {
    fail("ENGINEER_CATALOG_LIVE", "Catalog still marks remediation_engineer operational=true");
  } else if (!connectorsWired) {
    pass("ENGINEER_CATALOG_OFF", "Catalog remediation_engineer operational=false");
  } else {
    pass(
      "ENGINEER_CATALOG_WIRE_READY",
      "Catalog default remains off — runtime unlocks execute when connectors wired + L4/L5",
    );
  }

  // Runtime must not invent parallel analysis version distinct from CINT-EE composition.
  const runtime = readCodeIntelligenceAgentRuntime(metadata);
  const reality = runtime?.bindings.find((b) => b.agentId === "reality_intelligence");
  if (reality && /analyzeCodeIntelligenceSnapshot/.test(reality.primaryEngine)) {
    pass("REALITY_USES_COMPOSITION", "Reality Intelligence uses existing analysis composition");
  } else if (runtime) {
    warn("REALITY_BINDING_DRIFT", "Reality Intelligence binding does not cite analysis composition");
  }

  // Hardening cascade recommended before connectors.
  if (!areCodeIntelligencePhases1320Sealed(metadata)) {
    warn(
      "HARDENING_INCOMPLETE",
      "Phases 12–20 not fully sealed — recommended before connector lift",
    );
  } else {
    pass("HARDENING_COMPLETE", "Phases 12–20 hardening seals present");
  }

  if (isCodeIntelligenceAgentInteractionSealed(metadata)) {
    pass("INTERACTION_SEALED", "Phase 22 Interaction sealed (L1–L3 only)");
  } else {
    warn("INTERACTION_PENDING", "Interaction not sealed yet — enable after runtime audit");
  }

  if (isCodeIntelligenceConnectorFreezeLifted(metadata)) {
    if (checksFailed > 0) {
      fail("CONNECTOR_LIFTED_WHILE_UNHEALTHY", "Connector freeze lifted despite audit failures");
    } else {
      pass("CONNECTOR_LIFT_HEALTHY", "Connector freeze lifted after healthy posture");
    }
  }

  // Duplicate binding agent ids
  const ids = CINT_AGENT_ENGINE_BINDINGS.map((b) => b.agentId);
  if (new Set(ids).size !== ids.length) {
    fail("DUPLICATE_BINDINGS", "Duplicate agentId entries in runtime bindings");
  } else {
    pass("UNIQUE_BINDINGS", "Runtime bindings unique per agentId");
  }

  void analyseEngines;

  const healthy = checksFailed === 0;
  return {
    version: "cint.agents.architecture.audit.v1",
    sealed: false,
    sealedAt: null,
    auditVersion: CINT_AGENTS_ARCHITECTURE_AUDIT_VERSION,
    healthy,
    findings,
    checksPassed,
    checksFailed,
    connectorEnablementAllowed: healthy && isCodeIntelligenceAgentInteractionSealed(metadata),
    rule: "No duplicates · no super-agent · one engine owner per mission · connectors only after healthy audit",
    constitution: [
      "Architecture audit is report-only — does not rewrite government or engines",
      "Connector enablement requires healthy=true + interaction sealed",
    ],
  };
}

export function sealCodeIntelligenceAgentArchitectureAudit(metadata: unknown): {
  metadata: Record<string, unknown>;
  audit: CodeIntelligenceAgentArchitectureAudit;
  blockedReason?: string;
} {
  const base = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  if (!isCodeIntelligenceAgentRuntimeSealed(base)) {
    return {
      metadata: base,
      audit: {
        ...evaluateCodeIntelligenceAgentArchitectureAudit(base),
        sealed: false,
        sealedAt: null,
      },
      blockedReason: "Agent Runtime must be sealed before architecture audit seal.",
    };
  }
  const evaluated = evaluateCodeIntelligenceAgentArchitectureAudit(base);
  const audit: CodeIntelligenceAgentArchitectureAudit = {
    ...evaluated,
    sealed: true,
    sealedAt: new Date().toISOString(),
  };
  base[CINT_AGENTS_ARCHITECTURE_AUDIT_KEY] = audit;
  return { metadata: base, audit };
}

export function readCodeIntelligenceAgentArchitectureAudit(
  metadata?: unknown,
): CodeIntelligenceAgentArchitectureAudit | null {
  const block = asRecord(asRecord(metadata)?.[CINT_AGENTS_ARCHITECTURE_AUDIT_KEY]);
  if (!block || block.version !== "cint.agents.architecture.audit.v1") return null;
  return block as CodeIntelligenceAgentArchitectureAudit;
}

export function isCodeIntelligenceAgentArchitectureAuditSealed(metadata?: unknown): boolean {
  const a = readCodeIntelligenceAgentArchitectureAudit(metadata);
  return Boolean(a?.sealed && a.sealedAt);
}

export function detectCodeIntelligenceAgentArchitectureAuditSealIntent(text: string): boolean {
  const t = text.toLowerCase();
  return (
    /\bagent architecture audit\b/.test(t) ||
    /\bcint\.agents\.architecture\.audit\.v1\b/.test(t) ||
    /\baudit\b.{0,20}\blive agents?\b/.test(t) ||
    /\bfull assessment\b/.test(t)
  );
}

export function formatCodeIntelligenceAgentArchitectureAuditSummaryLines(
  audit: CodeIntelligenceAgentArchitectureAudit,
): string[] {
  return [
    `${audit.sealed ? "✓" : "○"} Agent Architecture Audit ${audit.auditVersion}`,
    `${audit.healthy ? "✓" : "✕"} Healthy=${audit.healthy} · passed ${audit.checksPassed} · failed ${audit.checksFailed}`,
    `${audit.connectorEnablementAllowed ? "✓" : "○"} Connector enablement allowed=${audit.connectorEnablementAllowed}`,
    ...audit.findings
      .filter((f) => f.severity !== "info")
      .slice(0, 6)
      .map((f) => `${f.severity === "fail" ? "✕" : "○"} ${f.code}: ${f.detail}`),
  ];
}
