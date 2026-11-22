/**
 * cint.audit.v1 — Phase 10 Immutable Audit & Emergency Controls.
 *
 * Ledger: proposal → authority → approval → execution → verification (Article X).
 * Emergency: pause / freeze / suspend / rollback / incident (Article XII).
 * Notifications never imply approval (Article XI).
 */

export const CINT_AUDIT_KEY = "cint.audit.v1" as const;
export const CINT_AUDIT_VERSION = "CINT-AUD-1.0" as const;

export type AuditLedgerStage =
  | "proposal"
  | "authority"
  | "approval"
  | "execution"
  | "verification";

export type AuditLedgerEntry = Readonly<{
  id: string;
  timestamp: string;
  actor: string;
  agent: string;
  action: string;
  evidence?: string | null;
  decision?: string | null;
  approvalStatus?: string | null;
  executionStatus?: string | null;
  verificationStatus?: string | null;
  stage: AuditLedgerStage;
  /** Prior entry id — chain link; null for genesis. */
  prevId: string | null;
  immutable: true;
}>;

export type EmergencyControlId =
  | "pause_execution"
  | "freeze_autonomous_actions"
  | "suspend_agent_permissions"
  | "emergency_rollback"
  | "incident_response_mode";

export type EmergencyControlState = Readonly<{
  control: EmergencyControlId;
  active: boolean;
  invokedBy: string | null;
  invokedAt: string | null;
  reason: string | null;
}>;

export type CodeIntelligenceAuditEmergencyAuthority = Readonly<{
  version: "cint.audit.v1";
  sealed: boolean;
  sealedAt: string | null;
  auditVersion: typeof CINT_AUDIT_VERSION;
  inventPages: false;
  requiredStages: readonly AuditLedgerStage[];
  recordFields: readonly string[];
  emergencyControls: readonly EmergencyControlState[];
  /** Append-only ledger snapshot (demo/runtime may extend via append). */
  ledger: readonly AuditLedgerEntry[];
  rule: "Audit immutable · notifications ≠ approval · emergency by governance only";
  constitution: readonly string[];
}>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export const CINT_AUDIT_REQUIRED_STAGES: readonly AuditLedgerStage[] = [
  "proposal",
  "authority",
  "approval",
  "execution",
  "verification",
] as const;

export const CINT_AUDIT_RECORD_FIELDS = [
  "Timestamp",
  "Actor",
  "Agent",
  "Action",
  "Evidence",
  "Decision",
  "Approval Status",
  "Execution Status",
  "Verification Status",
] as const;

export const CINT_EMERGENCY_CONTROL_IDS: readonly EmergencyControlId[] = [
  "pause_execution",
  "freeze_autonomous_actions",
  "suspend_agent_permissions",
  "emergency_rollback",
  "incident_response_mode",
] as const;

function defaultEmergencyControls(): EmergencyControlState[] {
  return CINT_EMERGENCY_CONTROL_IDS.map((control) => ({
    control,
    active: false,
    invokedBy: null,
    invokedAt: null,
    reason: null,
  }));
}

export function buildCodeIntelligenceAuditEmergencyAuthority(options?: {
  sealed?: boolean;
  ledger?: readonly AuditLedgerEntry[];
  emergencyControls?: readonly EmergencyControlState[];
}): CodeIntelligenceAuditEmergencyAuthority {
  const sealed = options?.sealed === true;
  return {
    version: "cint.audit.v1",
    sealed,
    sealedAt: sealed ? new Date().toISOString() : null,
    auditVersion: CINT_AUDIT_VERSION,
    inventPages: false,
    requiredStages: CINT_AUDIT_REQUIRED_STAGES,
    recordFields: CINT_AUDIT_RECORD_FIELDS,
    emergencyControls: options?.emergencyControls
      ? [...options.emergencyControls]
      : defaultEmergencyControls(),
    ledger: options?.ledger ? [...options.ledger] : [],
    rule: "Audit immutable · notifications ≠ approval · emergency by governance only",
    constitution: [
      "Article X — Auditability (immutable records)",
      "Article XI — Notifications never imply approval",
      "Article XII — Emergency Controls by authorized governance only",
      "proposal → authority → approval → execution → verification",
    ],
  };
}

/** Append-only — returns new authority; never mutates prior entries. */
export function appendAuditLedgerEntry(
  authority: CodeIntelligenceAuditEmergencyAuthority,
  draft: Omit<AuditLedgerEntry, "immutable" | "prevId" | "id" | "timestamp"> & {
    id?: string;
    timestamp?: string;
  },
): {
  authority: CodeIntelligenceAuditEmergencyAuthority;
  entry: AuditLedgerEntry;
} {
  const prev = authority.ledger[authority.ledger.length - 1] ?? null;
  const entry: AuditLedgerEntry = {
    id: draft.id ?? `aud-${authority.ledger.length + 1}`,
    timestamp: draft.timestamp ?? new Date().toISOString(),
    actor: draft.actor,
    agent: draft.agent,
    action: draft.action,
    evidence: draft.evidence ?? null,
    decision: draft.decision ?? null,
    approvalStatus: draft.approvalStatus ?? null,
    executionStatus: draft.executionStatus ?? null,
    verificationStatus: draft.verificationStatus ?? null,
    stage: draft.stage,
    prevId: prev?.id ?? null,
    immutable: true,
  };
  return {
    authority: {
      ...authority,
      ledger: [...authority.ledger, entry],
    },
    entry,
  };
}

/** Chain integrity — each entry links prevId; entries are frozen. */
export function validateAuditLedgerChain(
  ledger: readonly AuditLedgerEntry[],
): { ok: boolean; errors: readonly string[] } {
  const errors: string[] = [];
  for (let i = 0; i < ledger.length; i++) {
    const e = ledger[i]!;
    if (e.immutable !== true) errors.push(`${e.id}: missing immutable marker`);
    if (i === 0) {
      if (e.prevId !== null) errors.push(`${e.id}: genesis must have prevId=null`);
    } else {
      const prev = ledger[i - 1]!;
      if (e.prevId !== prev.id) errors.push(`${e.id}: broken chain (expected prev ${prev.id})`);
    }
    if (!CINT_AUDIT_REQUIRED_STAGES.includes(e.stage)) {
      errors.push(`${e.id}: unknown stage ${e.stage}`);
    }
  }
  return { ok: errors.length === 0, errors };
}

/** True when a change has walked proposal→…→verification with linked ids. */
export function isChangeFullyAudited(
  ledger: readonly AuditLedgerEntry[],
  changeActionPrefix: string,
): boolean {
  const related = ledger.filter((e) => e.action.startsWith(changeActionPrefix));
  const stages = new Set(related.map((e) => e.stage));
  return CINT_AUDIT_REQUIRED_STAGES.every((s) => stages.has(s));
}

export function invokeEmergencyControl(
  authority: CodeIntelligenceAuditEmergencyAuthority,
  input: {
    control: EmergencyControlId;
    invokedBy: string;
    reason: string;
    /** Only governance authorities may invoke. */
    authorizedRole: "governance_controller" | "authority_controller" | "human_operator";
  },
): {
  allowed: boolean;
  authority: CodeIntelligenceAuditEmergencyAuthority;
  reason: string;
} {
  if (!input.invokedBy.trim() || !input.reason.trim()) {
    return {
      allowed: false,
      authority,
      reason: "Emergency invocation requires invoker and reason",
    };
  }
  if (
    input.authorizedRole !== "governance_controller" &&
    input.authorizedRole !== "authority_controller" &&
    input.authorizedRole !== "human_operator"
  ) {
    return {
      allowed: false,
      authority,
      reason: "Emergency controls restricted to governance authorities / human operator",
    };
  }

  const now = new Date().toISOString();
  const emergencyControls: readonly EmergencyControlState[] = authority.emergencyControls.map((c) =>
    c.control === input.control
      ? {
          ...c,
          active: true,
          invokedBy: input.invokedBy,
          invokedAt: now,
          reason: input.reason,
        }
      : c,
  );

  const withControls: CodeIntelligenceAuditEmergencyAuthority = {
    ...authority,
    emergencyControls,
  };
  const appended = appendAuditLedgerEntry(withControls, {
    actor: input.invokedBy,
    agent: input.authorizedRole,
    action: `emergency:${input.control}`,
    decision: "invoked",
    stage: "execution",
    evidence: input.reason,
  });

  return {
    allowed: true,
    authority: appended.authority,
    reason: `${input.control} active`,
  };
}

export function clearEmergencyControl(
  authority: CodeIntelligenceAuditEmergencyAuthority,
  control: EmergencyControlId,
  clearedBy: string,
): CodeIntelligenceAuditEmergencyAuthority {
  const emergencyControls: readonly EmergencyControlState[] = authority.emergencyControls.map(
    (c) =>
      c.control === control
        ? { ...c, active: false, invokedBy: null, invokedAt: null, reason: null }
        : c,
  );
  const next: CodeIntelligenceAuditEmergencyAuthority = { ...authority, emergencyControls };
  return appendAuditLedgerEntry(next, {
    actor: clearedBy,
    agent: "human_operator",
    action: `emergency:clear:${control}`,
    decision: "cleared",
    stage: "verification",
  }).authority;
}

export function isEmergencyExecutionFrozen(
  authority: CodeIntelligenceAuditEmergencyAuthority | null | undefined,
): boolean {
  if (!authority) return false;
  return authority.emergencyControls.some(
    (c) =>
      c.active &&
      (c.control === "pause_execution" ||
        c.control === "freeze_autonomous_actions" ||
        c.control === "suspend_agent_permissions" ||
        c.control === "incident_response_mode"),
  );
}

/** L4/L5 execute blocked when emergency freeze is active. */
export function mayExecuteUnderEmergency(
  authority: CodeIntelligenceAuditEmergencyAuthority | null | undefined,
): { allowed: boolean; reason: string } {
  if (isEmergencyExecutionFrozen(authority)) {
    return {
      allowed: false,
      reason: "Emergency controls active — execution paused / autonomous actions frozen",
    };
  }
  return { allowed: true, reason: "No emergency freeze" };
}

export function sealCodeIntelligenceAuditEmergency(metadata: unknown): {
  metadata: Record<string, unknown>;
  audit: CodeIntelligenceAuditEmergencyAuthority;
} {
  const base = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  const existing = readCodeIntelligenceAuditEmergency(base);
  const audit = buildCodeIntelligenceAuditEmergencyAuthority({
    sealed: true,
    ledger: existing?.ledger ?? [],
    emergencyControls: existing?.emergencyControls,
  });
  base[CINT_AUDIT_KEY] = audit;
  return { metadata: base, audit };
}

export function persistCodeIntelligenceAuditEmergency(
  metadata: unknown,
  audit: CodeIntelligenceAuditEmergencyAuthority,
): Record<string, unknown> {
  const base = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  base[CINT_AUDIT_KEY] = audit;
  return base;
}

export function readCodeIntelligenceAuditEmergency(
  metadata?: unknown,
): CodeIntelligenceAuditEmergencyAuthority | null {
  const block = asRecord(asRecord(metadata)?.[CINT_AUDIT_KEY]);
  if (!block || block.version !== "cint.audit.v1") return null;
  return block as CodeIntelligenceAuditEmergencyAuthority;
}

export function isCodeIntelligenceAuditEmergencySealed(metadata?: unknown): boolean {
  const a = readCodeIntelligenceAuditEmergency(metadata);
  return Boolean(a?.sealed && a.sealedAt);
}

export function detectCodeIntelligenceAuditEmergencySealIntent(text: string): boolean {
  const t = text.toLowerCase();
  return (
    /\bphase\s*10\b/.test(t) ||
    /\bimmutable audit\b/.test(t) ||
    /\baudit ledger\b/.test(t) ||
    /\bemergency controls?\b/.test(t) ||
    /\bcint\.audit\.v1\b/.test(t) ||
    /\bseal\b.*\baudit\b/.test(t)
  );
}

export function formatCodeIntelligenceAuditEmergencySummaryLines(
  audit: CodeIntelligenceAuditEmergencyAuthority,
): string[] {
  const active = audit.emergencyControls.filter((c) => c.active).length;
  return [
    `${audit.sealed ? "✓" : "○"} Audit/Emergency ${audit.auditVersion} (${CINT_AUDIT_KEY})`,
    `○ Ledger stages: ${audit.requiredStages.join(" → ")} · entries=${audit.ledger.length}`,
    `○ Emergency active controls: ${active}`,
  ];
}
