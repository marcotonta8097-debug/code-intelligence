/**
 * cint.constitution.v1 — Code Intelligence Platform Constitution (Foundational Governance Charter).
 *
 * Supreme product governance for field:code_intelligence.
 * Ranks above Product Blueprint / Identity / Registries / Workflow / Integration seals.
 * Does not invent pages. Does not override Replica Part I/II (ASP/EPA/FPT/GAR/HVM/PDS).
 *
 * Intelligence ≠ authority. Recommendations ≠ approvals. Execution ≠ verification.
 */

export const CINT_CONSTITUTION_KEY = "cint.constitution.v1" as const;
export const CINT_CONSTITUTION_VERSION = "1.0" as const;

export type CodeIntelligenceApprovalLevel =
  | "level_1_observe"
  | "level_2_analyse"
  | "level_3_prepare"
  | "level_4_execute"
  | "level_5_consequential";

export type CodeIntelligenceConstitutionArticle = Readonly<{
  id: string;
  title: string;
  clauses: readonly string[];
}>;

export type CodeIntelligenceNextPhasePlan = Readonly<{
  id: string;
  title: string;
  constitutionalBasis: readonly string[];
  deliverable: string;
  inventPages: false;
  requiresHumanApprovalForExecute: boolean;
  /** Construction status under this charter — does not invent pages. */
  constructionStatus: "delivered" | "active" | "queued";
}>;

export type CodeIntelligencePlatformConstitution = Readonly<{
  version: "cint.constitution.v1";
  charterVersion: typeof CINT_CONSTITUTION_VERSION;
  sealed: boolean;
  sealedAt: string | null;
  fieldRegistryId: "field:code_intelligence";
  title: "Code Intelligence Platform Constitution";
  preamble: readonly string[];
  purpose: readonly string[];
  principles: readonly { id: string; title: string; clauses: readonly string[] }[];
  authorityHierarchy: readonly string[];
  sourcesOfAuthority: readonly { id: string; title: string; origins: readonly string[] }[];
  agentRights: Readonly<{
    may: readonly string[];
    shallNot: readonly string[];
    must: readonly string[];
  }>;
  separationOfResponsibilities: readonly { role: string; owns: readonly string[] }[];
  approvalLevels: readonly {
    level: CodeIntelligenceApprovalLevel;
    label: string;
    examples: readonly string[];
    approvalRequired: boolean | "explicit_human";
    executionAllowed: boolean;
  }[];
  changeControlRequired: readonly string[];
  verificationRequired: readonly string[];
  auditRecordFields: readonly string[];
  notificationTriggers: readonly string[];
  emergencyControls: readonly string[];
  supremacy: readonly string[];
  foundingMaxims: readonly string[];
  missionStatement: string;
  articles: readonly CodeIntelligenceConstitutionArticle[];
  /** Construction roadmap subordinate to this charter — Integration surfaces next. */
  nextPhases: readonly CodeIntelligenceNextPhasePlan[];
  constitution: readonly string[];
}>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** Construction phases under constitutional supremacy (no PAGE invent). */
export const CODE_INTELLIGENCE_CONSTITUTIONAL_NEXT_PHASES: readonly CodeIntelligenceNextPhasePlan[] =
  [
    {
      id: "phase_7_integration_host_surfaces",
      title: "Integration Host Surfaces",
      constitutionalBasis: [
        "Article I — analyse / discover facts through evidence",
        "Article II Principle 2 — Evidence Before Conclusions",
        "Article VII — Observe/Analyse/Prepare without unauthorized Execute",
        "cint.integration.v1 hostPages (Repositories, Findings, Documentation, …)",
        "cint.integration.hosts.v1 — construction seal",
      ],
      deliverable:
        "Import · Upload · Export · Print · Share FEATURE sections on sealed host pages (CINT-IHS-1.0) — L3 Prepare demo; connectors deferred; no PAGE invent.",
      inventPages: false,
      requiresHumanApprovalForExecute: true,
      constructionStatus: "delivered",
    },
    {
      id: "phase_8_evidence_enforcement",
      title: "Evidence Enforcement Gate",
      constitutionalBasis: [
        "Article II Principle 2 — Evidence Before Conclusions",
        "cint.evidence.gate.v1 — exists · current · relevant · complete · traceable",
        "Constitutional Compliance Agent — reports to Constitution, not PM",
        "Agent Government Phase 1 Controllers before capability growth",
      ],
      deliverable:
        "Verified status demoted unless Evidence Gate passes; no live connectors until 8–10 complete.",
      inventPages: false,
      requiresHumanApprovalForExecute: true,
      constructionStatus: "delivered",
    },
    {
      id: "phase_9_governance_approvals",
      title: "Governance Gates L1–L5",
      constitutionalBasis: [
        "Article VII — Observe/Analyse/Prepare/Execute/Consequential",
        "Article VIII — Change Control",
        "Article VI — Investigator ≠ Approver ≠ Executor ≠ Verifier",
        "Never a super-agent",
        "cint.governance.gates.v1 — construction seal",
      ],
      deliverable:
        "Executable permission levels; Remediation Engineer blocked without human L4/L5 approval.",
      inventPages: false,
      requiresHumanApprovalForExecute: true,
      constructionStatus: "delivered",
    },
    {
      id: "phase_10_audit_escalation",
      title: "Immutable Audit & Emergency Controls",
      constitutionalBasis: [
        "Article X — Auditability",
        "Article XI — Notifications (never imply approval)",
        "Article XII — Emergency Controls",
        "cint.audit.v1 — construction seal",
      ],
      deliverable:
        "Immutable proposal→authority→approval→execution→verification ledger; freeze/stop/rollback.",
      inventPages: false,
      requiresHumanApprovalForExecute: true,
      constructionStatus: "delivered",
    },
    {
      id: "phase_11_delivery_schema",
      title: "Delivery Schema Contract (PGMS foothold)",
      constitutionalBasis: [
        "Part II PGMS-1.0 — schema before UI",
        "Honesty path — Finding/Evidence/Investigation/RemediationPlan/Repository",
        "cint.delivery.schema.v1 — construction seal",
      ],
      deliverable:
        "Sealed field contracts for core CI entities — does not invent pages; does not lift connector freeze; real PGMS/PGBE still required for production_candidate.",
      inventPages: false,
      requiresHumanApprovalForExecute: true,
      constructionStatus: "delivered",
    },
    {
      id: "phase_12_recovery_rollback",
      title: "Recovery & Rollback Engine",
      constitutionalBasis: [
        "Article XII — Emergency Controls / emergency_rollback",
        "NO AI ACTION WITHOUT RECOVERY CAPABILITY",
        "NO FILE IS PERMANENTLY DELETED UNTIL RETENTION PERIOD EXPIRES",
        "cint.rollback.engine.v1 — snapshot · restore · safe delete · vault · diff · disaster",
      ],
      deliverable:
        "Recovery points before mutate; archive-not-delete; one-click restore; disaster stop/lock/restore last stable — before Trust Engine and before live agents.",
      inventPages: false,
      requiresHumanApprovalForExecute: true,
      constructionStatus: "delivered",
    },
    {
      id: "phase_13_seal_validation",
      title: "Seal Validation Engine",
      constitutionalBasis: [
        "Prove Evidence · Governance · Audit · Delivery · Rollback seals cannot be bypassed",
        "cint.seal.validation.v1 — integrity score report-only",
      ],
      deliverable: "Seal Integrity Score + bypass/missing-dependency/broken-chain detection.",
      inventPages: false,
      requiresHumanApprovalForExecute: true,
      constructionStatus: "delivered",
    },
    {
      id: "phase_14_trust_engine",
      title: "System Trust Engine",
      constitutionalBasis: [
        "CI health confidence scoring",
        "cint.trust.engine.v1 — not honestLabel / PDS",
      ],
      deliverable: "Repository/Architecture/Repair/Audit/Governance trust dimensions + overall score.",
      inventPages: false,
      requiresHumanApprovalForExecute: true,
      constructionStatus: "delivered",
    },
    {
      id: "phase_15_memory_engine",
      title: "Repository Memory Engine",
      constitutionalBasis: ["Learn · Remember · Compare · Improve", "cint.memory.engine.v1"],
      deliverable: "Past audits/repairs/issues/failures/ADRs/governance exceptions memory.",
      inventPages: false,
      requiresHumanApprovalForExecute: true,
      constructionStatus: "delivered",
    },
    {
      id: "phase_16_impact_analysis",
      title: "Change Impact Analysis",
      constitutionalBasis: ["Consequences before mutate", "cint.impact.analysis.v1"],
      deliverable: "Files/services/APIs/databases blast radius + LOW→CRITICAL risk.",
      inventPages: false,
      requiresHumanApprovalForExecute: true,
      constructionStatus: "delivered",
    },
    {
      id: "phase_17_predictive_risk",
      title: "Predictive Risk Engine",
      constitutionalBasis: ["Advisory deterministic heuristics", "cint.predictive.risk.v1"],
      deliverable: "Smell/design/dependency/drift/security/debt signals with probability.",
      inventPages: false,
      requiresHumanApprovalForExecute: true,
      constructionStatus: "delivered",
    },
    {
      id: "phase_18_architecture_intelligence",
      title: "Architecture Intelligence",
      constitutionalBasis: [
        "Extends Pack 08 architectureKnowledgeEngine",
        "cint.architecture.intelligence.v1",
      ],
      deliverable: "Dependency/service/flow/database/API map authority — no parallel graph.",
      inventPages: false,
      requiresHumanApprovalForExecute: true,
      constructionStatus: "delivered",
    },
    {
      id: "phase_19_self_healing_governance",
      title: "Self-Healing Governance (Repair Guard)",
      constitutionalBasis: [
        "No repair without Evidence→Governance→Impact→Risk→Approval→Recovery",
        "cint.governance.repair.guard.v1",
      ],
      deliverable: "CI mutate gate over existing Repair — not a parallel repair pipeline.",
      inventPages: false,
      requiresHumanApprovalForExecute: true,
      constructionStatus: "delivered",
    },
    {
      id: "phase_20_operations_center",
      title: "Platform Operations Centre",
      constitutionalBasis: [
        "Aggregated sealed telemetry dashboard report",
        "cint.operations.center.v1 — inventPages=false",
      ],
      deliverable: "Executive summary: status · trust · risk · issues · failed verifications.",
      inventPages: false,
      requiresHumanApprovalForExecute: true,
      constructionStatus: "delivered",
    },
    {
      id: "phase_21_live_agent_runtime",
      title: "Live Agent Runtime",
      constitutionalBasis: [
        "Subordinate to cint.agents.v1 — never a super-agent",
        "cint.agents.runtime.v1 — dispatch to existing engines only",
      ],
      deliverable:
        "L1–L3 live dispatch; Remediation Engineer deferred; no parallel analyzers; freeze ON.",
      inventPages: false,
      requiresHumanApprovalForExecute: true,
      constructionStatus: "delivered",
    },
    {
      id: "phase_22_agent_interaction",
      title: "Agent Interaction",
      constitutionalBasis: [
        "Interactive L1–L3 passes via sealed runtime",
        "cint.agents.interaction.v1",
      ],
      deliverable: "Observe/analyse/prepare interaction — L4/L5 forbidden until connectors.",
      inventPages: false,
      requiresHumanApprovalForExecute: true,
      constructionStatus: "delivered",
    },
    {
      id: "phase_23_connector_readiness",
      title: "Connector Freeze Lift Readiness",
      constitutionalBasis: [
        "Healthy architecture audit required",
        "cint.connector.lift.v1 — authorized_not_wired only",
      ],
      deliverable:
        "Human lift after runtime+interaction+healthy audit — still no live OAuth wire.",
      inventPages: false,
      requiresHumanApprovalForExecute: true,
      constructionStatus: "delivered",
    },
    {
      id: "phase_24_part_ii_delivery_emit",
      title: "Part II Delivery Emit (PGMS·PGBE·SCW·PLS)",
      constitutionalBasis: [
        "Part II PGMS-1.0 · PGBE-1.0 · SCW-1.0 · PLS-1.0",
        "cint.delivery.emit.v1 — projects delivery schema into productGenerationModel",
      ],
      deliverable:
        "Sealed PGMS model + PGBE routes + SCW markers + PLS smoke — demo localStorage no longer sole store.",
      inventPages: false,
      requiresHumanApprovalForExecute: true,
      constructionStatus: "delivered",
    },
    {
      id: "phase_25_connector_wire",
      title: "Live Connector Wire",
      constitutionalBasis: [
        "After freeze lift + Part II emit",
        "cint.connector.wire.v1 — local_snapshot · github_read",
      ],
      deliverable:
        "Advance authorized_not_wired → wired; clear CINT_NO_LIVE_INDEX honesty blocker.",
      inventPages: false,
      requiresHumanApprovalForExecute: true,
      constructionStatus: "delivered",
    },
    {
      id: "phase_26_remediation_engineer_writes",
      title: "Remediation Engineer Source Writes",
      constitutionalBasis: [
        "L4/L5 human approval + recovery snapshot + repair guard",
        "Connectors wired — never silent disk mutate",
      ],
      deliverable:
        "Authorized writes recorded via PGBE remediation table under governance gates.",
      inventPages: false,
      requiresHumanApprovalForExecute: true,
      constructionStatus: "delivered",
    },
  ] as const;

/** First active or queued construction phase (roadmap pointer). */
export function getCodeIntelligenceActiveConstructionPhase(
  phases: readonly CodeIntelligenceNextPhasePlan[] = CODE_INTELLIGENCE_CONSTITUTIONAL_NEXT_PHASES,
): CodeIntelligenceNextPhasePlan | undefined {
  return (
    phases.find((p) => p.constructionStatus === "active") ??
    phases.find((p) => p.constructionStatus === "queued")
  );
}

export function buildCodeIntelligencePlatformConstitution(
  options?: { sealed?: boolean },
): CodeIntelligencePlatformConstitution {
  const sealed = options?.sealed === true;
  const preamble = [
    "The Code Intelligence Platform exists to analyse, understand, assess, verify, improve and govern software systems through evidence-based intelligence, controlled execution and accountable decision-making.",
    "The platform shall not operate as an autonomous authority.",
    "Intelligence shall be separated from governance.",
    "Recommendations shall be separated from approvals.",
    "Execution shall be separated from verification.",
    "No agent, subsystem, specialist, workflow or intelligence engine shall supersede the authority established within this Constitution.",
    "This Constitution serves as the supreme governing authority of the platform.",
  ] as const;

  const purpose = [
    "Analyse software systems",
    "Discover facts through evidence",
    "Assess architecture, quality and risk",
    "Recommend improvements",
    "Coordinate remediation",
    "Support engineering teams",
    "Preserve engineering integrity",
    "Maintain accountability",
    "Prevent uncontrolled autonomous behaviour",
    "Assist engineering decisions — never replace engineering authority",
  ] as const;

  const principles = [
    {
      id: "P1",
      title: "One Source of Truth",
      clauses: [
        "Product Identity → Product Blueprint / cint.identity.v1",
        "Taxonomies → Canonical Registry / cint.registry.v1",
        "Engineering Standards → Standards Registry",
        "Evidence → Evidence Registry",
        "Authority → this Constitution",
        "No competing truths shall be created",
      ],
    },
    {
      id: "P2",
      title: "Evidence Before Conclusions",
      clauses: [
        "Every verified finding requires Evidence Reference, Assessment Criteria, Confidence Level, Verification Status, Responsible Specialist, Timestamp",
        "No evidence — no verified conclusion",
        "Without Import/Upload/Repository ingress and Export/Report egress, the platform cannot constitutionally claim or test findings",
      ],
    },
    {
      id: "P3",
      title: "Intelligence Is Not Authority",
      clauses: [
        "Agents may: Observe, Analyse, Recommend, Prepare, Explain",
        "Agents may not: Approve, Govern, Redefine Truth, Modify Authority, Expand Permissions — unless explicitly authorized",
      ],
    },
    {
      id: "P4",
      title: "Governance Before Execution",
      clauses: [
        "Planning precedes implementation",
        "Authorization precedes modification",
        "Verification follows execution",
      ],
    },
    {
      id: "P5",
      title: "Accountability",
      clauses: [
        "Know who requested, proposed, approved, executed, and verified",
        "Anonymous authority shall not exist",
      ],
    },
  ] as const;

  const authorityHierarchy = [
    "1. Constitution (cint.constitution.v1)",
    "2. Product Blueprint / Identity (cint.identity.v1)",
    "3. Canonical Registries (cint.registry.v1)",
    "4. Governance Layer",
    "5. Human Authority",
    "6. Project Management",
    "7. Specialist Agents",
    "8. Execution Agents",
    "9. Supporting Systems",
  ] as const;

  const foundingMaxims = [
    "Truth Comes From Evidence",
    "Authority Comes From Governance",
    "Intelligence Provides Recommendations",
    "Humans Retain Accountability",
    "Verification Establishes Reality",
    "No Evidence, No Truth",
    "No Authority, No Action",
    "No Verification, No Completion",
    "One Constitution",
    "One Governance Model",
    "One Source Of Truth",
  ] as const;

  const missionStatement =
    "The Code Intelligence Platform shall be an evidence-driven, governance-first engineering intelligence system where intelligence assists, governance controls, humans authorize, verification validates, and accountability preserves trust.";

  const articles: CodeIntelligenceConstitutionArticle[] = [
    { id: "I", title: "Purpose", clauses: [...purpose] },
    {
      id: "II",
      title: "Core Principles",
      clauses: principles.flatMap((p) => [`${p.title}: ${p.clauses.join("; ")}`]),
    },
    { id: "III", title: "Authority Hierarchy", clauses: [...authorityHierarchy] },
    {
      id: "IV",
      title: "Sources of Authority",
      clauses: [
        "Constitutional Authority — Constitution, hierarchy, governance rules, decision rights",
        "Product Authority — Approved Product Blueprint",
        "Engineering Authority — Standards, architectural principles, approved policies",
        "Human Authority — Authorized engineers, owners, reviewers, administrators",
        "Agents possess delegated authority only",
      ],
    },
    {
      id: "V",
      title: "Agent Rights and Limitations",
      clauses: [
        "May: Read, Analyse, Assess, Propose, Plan, Prepare remediation, Request approval, Perform authorized actions",
        "Shall not: Rewrite Constitution, modify governance, alter hierarchy, approve/verify own work, declare assumptions as facts, override humans, expand permissions",
        "Must: Provide evidence, identify limitations, declare confidence, record actions, respect permissions and governance",
      ],
    },
    {
      id: "VI",
      title: "Separation of Responsibilities",
      clauses: [
        "No single agent is Investigator + Approver + Executor + Verifier for the same action",
        "PM: coordination, prioritization, workflow",
        "Repository Intelligence: discovery, classification, synchronization",
        "Evidence Intelligence: collection, validation, readiness",
        "Architecture / Security / Quality / Remediation specialists own their domains only",
      ],
    },
    {
      id: "VII",
      title: "Approval Governance",
      clauses: [
        "L1 Observe — read/index — no approval",
        "L2 Analyse — scan/assess — no approval",
        "L3 Prepare — plan/patch/report — no approval, execution prohibited",
        "L4 Execute — modify/install/apply — approval required",
        "L5 Consequential — delete/DB/auth/prod/restructure — explicit human authorization",
      ],
    },
    {
      id: "VIII",
      title: "Change Control",
      clauses: [
        "Purpose, Scope, Affected Systems/Files, Dependencies, Risk, Rollback, Verification Plan",
        "No major rewrite without a change proposal",
      ],
    },
    {
      id: "IX",
      title: "Verification",
      clauses: [
        "Independent from execution",
        "Confirm requirement, build, tests, standards, evidence recorded",
        "Failure triggers reassessment",
      ],
    },
    {
      id: "X",
      title: "Auditability",
      clauses: [
        "Timestamp, Actor, Agent, Action, Evidence, Decision, Approval, Execution, Verification",
        "Audit records immutable",
      ],
    },
    {
      id: "XI",
      title: "Notifications and Escalation",
      clauses: [
        "Notify on critical risk, approval needed, execution/verification failure, stale evidence, remediation attention",
        "Notifications never imply approval or create authority",
      ],
    },
    {
      id: "XII",
      title: "Emergency Controls",
      clauses: [
        "Pause execution, freeze autonomous actions, suspend permissions, emergency rollback, incident response",
        "Invoked only by authorized governance authorities",
      ],
    },
    {
      id: "XIII",
      title: "Constitutional Supremacy",
      clauses: [
        "No override of Constitution or governance",
        "No alternate sources of truth",
        "No circumvention of approvals",
        "No alteration of constitutional rules without authorization",
        "All platform capabilities subordinate to this Constitution",
      ],
    },
  ];

  return {
    version: "cint.constitution.v1",
    charterVersion: CINT_CONSTITUTION_VERSION,
    sealed,
    sealedAt: sealed ? new Date().toISOString() : null,
    fieldRegistryId: "field:code_intelligence",
    title: "Code Intelligence Platform Constitution",
    preamble,
    purpose,
    principles,
    authorityHierarchy,
    sourcesOfAuthority: [
      {
        id: "constitutional",
        title: "Constitutional Authority",
        origins: ["Constitution", "Authority Hierarchy", "Governance Rules", "Decision Rights"],
      },
      {
        id: "product",
        title: "Product Authority",
        origins: ["Approved Product Blueprint", "cint.identity.v1"],
      },
      {
        id: "engineering",
        title: "Engineering Authority",
        origins: ["Engineering Standards", "Architectural Principles", "Approved Policies"],
      },
      {
        id: "human",
        title: "Human Authority",
        origins: ["Authorized Engineers", "Project Owners", "Reviewers", "Administrators"],
      },
    ],
    agentRights: {
      may: [
        "Read Information",
        "Analyse Information",
        "Generate Assessments",
        "Generate Proposals",
        "Generate Plans",
        "Prepare Remediation",
        "Request Approval",
        "Perform Authorized Actions",
      ],
      shallNot: [
        "Rewrite Constitutional Rules",
        "Modify Governance Structures",
        "Alter Authority Hierarchies",
        "Approve Their Own Work",
        "Verify Their Own Findings",
        "Declare Assumptions As Facts",
        "Override Human Decisions",
        "Expand Their Own Permissions",
      ],
      must: [
        "Provide Evidence",
        "Identify Limitations",
        "Declare Confidence",
        "Record Actions",
        "Respect Permissions",
        "Respect Governance",
      ],
    },
    separationOfResponsibilities: [
      { role: "Project Manager", owns: ["Coordination", "Prioritization", "Workflow Management"] },
      {
        role: "Repository Intelligence",
        owns: ["Discovery", "Classification", "Synchronization"],
      },
      {
        role: "Evidence Intelligence",
        owns: ["Evidence Collection", "Evidence Validation", "Readiness Analysis"],
      },
      {
        role: "Architecture Specialist",
        owns: ["Architecture Assessment", "Structural Integrity", "Technical Recommendations"],
      },
      {
        role: "Security Specialist",
        owns: ["Security Analysis", "Security Findings", "Risk Detection"],
      },
      {
        role: "Quality Specialist",
        owns: ["Independent Verification", "Quality Reviews", "Validation"],
      },
      {
        role: "Remediation Specialist",
        owns: ["Authorized Changes", "Implementation", "Correction Activities"],
      },
    ],
    approvalLevels: [
      {
        level: "level_1_observe",
        label: "Observe",
        examples: ["Read Files", "Repository Inspection", "Indexing"],
        approvalRequired: false,
        executionAllowed: false,
      },
      {
        level: "level_2_analyse",
        label: "Analyse",
        examples: ["Assessment", "Scanning", "Risk Analysis"],
        approvalRequired: false,
        executionAllowed: false,
      },
      {
        level: "level_3_prepare",
        label: "Prepare",
        examples: ["Create Plan", "Prepare Patch", "Generate Report"],
        approvalRequired: false,
        executionAllowed: false,
      },
      {
        level: "level_4_execute",
        label: "Execute",
        examples: ["Modify Files", "Install Dependencies", "Apply Fixes"],
        approvalRequired: true,
        executionAllowed: true,
      },
      {
        level: "level_5_consequential",
        label: "Consequential Execution",
        examples: [
          "Delete Files",
          "Database Changes",
          "Authentication Changes",
          "Production Deployment",
          "Repository Restructuring",
        ],
        approvalRequired: "explicit_human",
        executionAllowed: true,
      },
    ],
    changeControlRequired: [
      "Purpose",
      "Scope",
      "Affected Systems",
      "Affected Files",
      "Dependencies",
      "Risk Assessment",
      "Rollback Strategy",
      "Verification Plan",
    ],
    verificationRequired: [
      "Requirement Fulfilled",
      "Build Passing",
      "Tests Passing",
      "Standards Met",
      "Evidence Recorded",
    ],
    auditRecordFields: [
      "Timestamp",
      "Actor",
      "Agent",
      "Action",
      "Evidence",
      "Decision",
      "Approval Status",
      "Execution Status",
      "Verification Status",
    ],
    notificationTriggers: [
      "Critical Risks Are Found",
      "Approval Is Needed",
      "Execution Fails",
      "Verification Fails",
      "Evidence Becomes Stale",
      "Remediation Requires Attention",
    ],
    emergencyControls: [
      "Pause Execution",
      "Freeze Autonomous Actions",
      "Suspend Agent Permissions",
      "Emergency Rollback",
      "Incident Response Mode",
    ],
    supremacy: [
      "No Override The Constitution",
      "No Override Governance Controls",
      "No Alternate Sources Of Truth",
      "No Circumvent Approval Requirements",
      "No Alter Constitutional Rules Without Authorization",
    ],
    foundingMaxims,
    missionStatement,
    articles,
    nextPhases: CODE_INTELLIGENCE_CONSTITUTIONAL_NEXT_PHASES,
    constitution: [
      ...foundingMaxims,
      "Intelligence assists; governance controls; humans authorize; verification validates.",
      "Phase 7 Integration Host Surfaces are constitutionally required for evidence ingress/egress — still no PAGE invent.",
      "Phase 9–10 Governance Gates + Audit/Emergency required before any connector freeze lift.",
      "Replica Part I/II remain host factory law; this charter governs the sealed CI product meaning and agent behaviour.",
    ],
  };
}

export function persistCodeIntelligencePlatformConstitutionDraft(
  metadata: unknown,
): { metadata: Record<string, unknown>; constitution: CodeIntelligencePlatformConstitution } {
  const base = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  const constitution = buildCodeIntelligencePlatformConstitution({ sealed: false });
  base[CINT_CONSTITUTION_KEY] = constitution;
  return { metadata: base, constitution };
}

export function sealCodeIntelligencePlatformConstitution(
  metadata: unknown,
): { metadata: Record<string, unknown>; constitution: CodeIntelligencePlatformConstitution } {
  const base = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  const constitution = buildCodeIntelligencePlatformConstitution({ sealed: true });
  base[CINT_CONSTITUTION_KEY] = constitution;
  return { metadata: base, constitution };
}

export function readCodeIntelligencePlatformConstitution(
  metadata?: unknown,
): CodeIntelligencePlatformConstitution | null {
  const block = asRecord(asRecord(metadata)?.[CINT_CONSTITUTION_KEY]);
  if (!block || block.version !== "cint.constitution.v1") return null;
  return block as CodeIntelligencePlatformConstitution;
}

export function isCodeIntelligencePlatformConstitutionSealed(metadata?: unknown): boolean {
  const doc = readCodeIntelligencePlatformConstitution(metadata);
  return Boolean(doc?.sealed && doc.sealedAt);
}

export function detectCodeIntelligenceConstitutionSealIntent(text: string): boolean {
  const t = text.toLowerCase();
  return (
    /\bseal\b.*\bconstitution\b/.test(t) ||
    /\bplatform constitution\b/.test(t) ||
    /\bcint\.constitution\.v1\b/.test(t) ||
    /\bfoundational governance\b/.test(t) ||
    /\bconstitutional supremacy\b/.test(t)
  );
}

export function formatCodeIntelligenceConstitutionSummaryLines(
  doc: CodeIntelligencePlatformConstitution,
): string[] {
  const next = getCodeIntelligenceActiveConstructionPhase(doc.nextPhases);
  const nextLine = next
    ? `○ Next: ${next.id} — ${next.title} (inventPages=false)`
    : "○ Next: Phases 7–10 construction delivered — connector freeze remains until explicit human lift";
  return [
    `${doc.sealed ? "✓" : "○"} ${doc.title} v${doc.charterVersion} (${CINT_CONSTITUTION_KEY})`,
    `○ Mission: ${doc.missionStatement.slice(0, 120)}…`,
    `○ Hierarchy: Constitution → Blueprint → Registries → Governance → Humans → Agents`,
    nextLine,
    `○ Maxims: No Evidence, No Truth · No Authority, No Action · No Verification, No Completion`,
  ];
}
