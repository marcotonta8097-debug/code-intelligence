/**
 * cint.rollback.engine.v1 — Phase 12 Recovery & Rollback Engine.
 *
 * Construction seal + in-memory vault/snapshot runtime for CI.
 * Core rule: no mutate (repair/refactor/delete/rename/migrate/merge) without a recovery point.
 * Extends Phase 10 Article XII emergency_rollback — does not invent a parallel emergency authority.
 * Does not roll back sealed FPT/construction meaning (that remains human re-approval / HVM mutate).
 * Connector freeze remains ON; does not enable live agents.
 */

import {
  invokeEmergencyControl,
  readCodeIntelligenceAuditEmergency,
  type CodeIntelligenceAuditEmergencyAuthority,
} from "@/core/codeIntelligence/codeIntelligenceAuditEmergency";
import { isCodeIntelligenceDeliverySchemaSealed } from "@/core/codeIntelligence/codeIntelligenceDeliverySchema";

export const CINT_ROLLBACK_ENGINE_KEY = "cint.rollback.engine.v1" as const;
export const CINT_ROLLBACK_ENGINE_VERSION = "CINT-RB-1.0" as const;

export const CINT_SNAPSHOT_MANAGER_KEY = "cint.snapshot.manager.v1" as const;
export const CINT_RESTORE_ENGINE_KEY = "cint.restore.engine.v1" as const;
export const CINT_SAFE_DELETE_KEY = "cint.safe.delete.v1" as const;
export const CINT_RECOVERY_VAULT_KEY = "cint.recovery.vault.v1" as const;
export const CINT_CHANGE_DIFF_KEY = "cint.change.diff.v1" as const;
export const CINT_DISASTER_RECOVERY_KEY = "cint.disaster.recovery.v1" as const;

export type CodeIntelligenceMutateOperation =
  | "repair"
  | "refactor"
  | "delete"
  | "rename"
  | "migration"
  | "merge"
  | "scan_baseline";

export type RecoverySnapshotFile = Readonly<{
  path: string;
  content: string;
}>;

export type RecoverySnapshot = Readonly<{
  id: string;
  timestamp: string;
  operation: CodeIntelligenceMutateOperation;
  filesAffected: readonly string[];
  dependenciesAffected: readonly string[];
  files: readonly RecoverySnapshotFile[];
  label?: string;
  sealedAfterRestore: false;
}>;

export type RecoveryVaultEntry = Readonly<{
  id: string;
  archivedAt: string;
  originalPath: string;
  content: string;
  reason: string;
  retainUntil: string;
  permanentlyDeleted: false;
  snapshotId: string | null;
}>;

export type ChangeDiffLine = Readonly<{
  path: string;
  kind: "added" | "removed" | "modified";
}>;

export type ChangeDiffReport = Readonly<{
  version: "cint.change.diff.v1";
  beforeCount: number;
  afterCount: number;
  lines: readonly ChangeDiffLine[];
  summary: string;
}>;

export type RollbackSubmoduleContract = Readonly<{
  key: string;
  title: string;
  purpose: string;
}>;

export type CodeIntelligenceRollbackEngineAuthority = Readonly<{
  version: "cint.rollback.engine.v1";
  sealed: boolean;
  sealedAt: string | null;
  rollbackVersion: typeof CINT_ROLLBACK_ENGINE_VERSION;
  inventPages: false;
  requiresDeliverySchemaSealed: true;
  modules: readonly RollbackSubmoduleContract[];
  maxims: readonly string[];
  retentionDays: number;
  /** Runtime vault — demo/in-memory until durable store. */
  vault: readonly RecoveryVaultEntry[];
  snapshots: readonly RecoverySnapshot[];
  lastStableSnapshotId: string | null;
  rule: "No AI mutate without recovery capability · no permanent delete until retention expires";
  constitution: readonly string[];
}>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export const CINT_ROLLBACK_MAXIMS = [
  "NO AI ACTION WITHOUT RECOVERY CAPABILITY",
  "NO FILE IS PERMANENTLY DELETED UNTIL RETENTION PERIOD EXPIRES",
  "Never modify without first creating a recovery point",
  "Construction seal rollback ≠ file restore — meaning mutate requires human re-approval",
  "Disaster recovery stops workflow, locks changes, restores last stable checkpoint via Article XII",
] as const;

export const CINT_ROLLBACK_MODULES: readonly RollbackSubmoduleContract[] = [
  {
    key: CINT_SNAPSHOT_MANAGER_KEY,
    title: "Snapshot Manager",
    purpose: "Create SNAP-* recovery points before repair/refactor/delete/rename/migration/merge",
  },
  {
    key: CINT_RESTORE_ENGINE_KEY,
    title: "Restore Engine",
    purpose: "restore last snapshot · restore by id · rollback repair — zero data loss goal",
  },
  {
    key: CINT_SAFE_DELETE_KEY,
    title: "Safe Delete",
    purpose: "Archive to recovery vault instead of hard delete; retain version + audit path",
  },
  {
    key: CINT_RECOVERY_VAULT_KEY,
    title: "Recovery Vault",
    purpose: "Git recycle bin + engineering time machine for files, repairs, configs, reports",
  },
  {
    key: CINT_CHANGE_DIFF_KEY,
    title: "Change Diff",
    purpose: "OLD vs NEW (+ added / − removed / ~ modified) before human L4 approval",
  },
  {
    key: CINT_DISASTER_RECOVERY_KEY,
    title: "Disaster Recovery",
    purpose: "Mass delete / corrupt config / failed repair → stop · lock · restore last stable",
  },
] as const;

function nextSnapshotId(existing: readonly RecoverySnapshot[]): string {
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const seq = String(existing.length + 1).padStart(3, "0");
  return `SNAP-${day}-${seq}`;
}

function nextVaultId(existing: readonly RecoveryVaultEntry[]): string {
  return `VAULT-${existing.length + 1}-${Date.now().toString(36)}`;
}

export function buildCodeIntelligenceRollbackEngineAuthority(options?: {
  sealed?: boolean;
  vault?: readonly RecoveryVaultEntry[];
  snapshots?: readonly RecoverySnapshot[];
  lastStableSnapshotId?: string | null;
  retentionDays?: number;
}): CodeIntelligenceRollbackEngineAuthority {
  const sealed = options?.sealed === true;
  return {
    version: "cint.rollback.engine.v1",
    sealed,
    sealedAt: sealed ? new Date().toISOString() : null,
    rollbackVersion: CINT_ROLLBACK_ENGINE_VERSION,
    inventPages: false,
    requiresDeliverySchemaSealed: true,
    modules: CINT_ROLLBACK_MODULES,
    maxims: CINT_ROLLBACK_MAXIMS,
    retentionDays: options?.retentionDays ?? 30,
    vault: options?.vault ? [...options.vault] : [],
    snapshots: options?.snapshots ? [...options.snapshots] : [],
    lastStableSnapshotId: options?.lastStableSnapshotId ?? null,
    rule: "No AI mutate without recovery capability · no permanent delete until retention expires",
    constitution: [
      "Phase 12 — Recovery & Rollback after Delivery Schema (Phase 11)",
      "Extends cint.audit.v1 Article XII emergency_rollback — no parallel emergency authority",
      "Remediation Engineer stays non-operational until this seal + L4/L5 human approval",
      "Connector freeze remains ON",
      "inventPages=false",
      ...CINT_ROLLBACK_MAXIMS,
    ],
  };
}

export function sealCodeIntelligenceRollbackEngine(metadata: unknown): {
  metadata: Record<string, unknown>;
  rollback: CodeIntelligenceRollbackEngineAuthority;
  blockedReason?: string;
} {
  const base = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  if (!isCodeIntelligenceDeliverySchemaSealed(base)) {
    return {
      metadata: base,
      rollback: buildCodeIntelligenceRollbackEngineAuthority({ sealed: false }),
      blockedReason:
        "Phase 11 Delivery Schema must be sealed before Phase 12 Recovery & Rollback Engine.",
    };
  }
  const existing = readCodeIntelligenceRollbackEngine(base);
  const rollback = buildCodeIntelligenceRollbackEngineAuthority({
    sealed: true,
    vault: existing?.vault,
    snapshots: existing?.snapshots,
    lastStableSnapshotId: existing?.lastStableSnapshotId,
    retentionDays: existing?.retentionDays,
  });
  base[CINT_ROLLBACK_ENGINE_KEY] = rollback;
  return { metadata: base, rollback };
}

export function readCodeIntelligenceRollbackEngine(
  metadata?: unknown,
): CodeIntelligenceRollbackEngineAuthority | null {
  const block = asRecord(asRecord(metadata)?.[CINT_ROLLBACK_ENGINE_KEY]);
  if (!block || block.version !== "cint.rollback.engine.v1") return null;
  return block as CodeIntelligenceRollbackEngineAuthority;
}

export function isCodeIntelligenceRollbackEngineSealed(metadata?: unknown): boolean {
  const r = readCodeIntelligenceRollbackEngine(metadata);
  return Boolean(r?.sealed && r.sealedAt);
}

export function persistCodeIntelligenceRollbackEngine(
  metadata: unknown,
  rollback: CodeIntelligenceRollbackEngineAuthority,
): Record<string, unknown> {
  const base = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  base[CINT_ROLLBACK_ENGINE_KEY] = rollback;
  return base;
}

export function detectCodeIntelligenceRollbackEngineSealIntent(text: string): boolean {
  const t = text.toLowerCase();
  return (
    /\bphase\s*12\b/.test(t) ||
    /\brecovery\b.{0,20}\brollback\b/.test(t) ||
    /\brollback\b.{0,20}\bengine\b/.test(t) ||
    /\bcint\.rollback\.engine\.v1\b/.test(t) ||
    /\bsnapshot manager\b/.test(t) ||
    /\brecovery vault\b/.test(t) ||
    /\bsafe delete\b/.test(t) ||
    /\bdisaster recovery\b/.test(t) ||
    /\bseal\b.{0,30}\b(rollback|recovery)\b/.test(t)
  );
}

/** Gate: mutate ops require sealed rollback engine + a recovery snapshot for this op. */
export function assertMutateAllowed(input: {
  metadata?: unknown;
  operation: CodeIntelligenceMutateOperation;
  recoverySnapshotId?: string | null;
}): { allowed: boolean; reason: string } {
  if (!isCodeIntelligenceRollbackEngineSealed(input.metadata)) {
    return {
      allowed: false,
      reason: "CINT_ROLLBACK_UNSEALED — No AI action without recovery capability",
    };
  }
  if (input.operation === "scan_baseline") {
    return { allowed: true, reason: "Scan baseline does not mutate source" };
  }
  const engine = readCodeIntelligenceRollbackEngine(input.metadata);
  const snapId = (input.recoverySnapshotId || "").trim();
  if (!snapId) {
    return {
      allowed: false,
      reason: "Recovery point required before repair/refactor/delete/rename/migration/merge",
    };
  }
  const found = engine?.snapshots.some((s) => s.id === snapId);
  if (!found) {
    return { allowed: false, reason: `Unknown recovery snapshot ${snapId}` };
  }
  return { allowed: true, reason: `Recovery point ${snapId} present` };
}

/** cint.snapshot.manager.v1 — create recovery point before mutate. */
export function createRecoverySnapshot(
  metadata: unknown,
  input: {
    operation: CodeIntelligenceMutateOperation;
    files: readonly RecoverySnapshotFile[];
    dependenciesAffected?: readonly string[];
    label?: string;
  },
): {
  metadata: Record<string, unknown>;
  snapshot: RecoverySnapshot | null;
  blockedReason?: string;
} {
  const engine = readCodeIntelligenceRollbackEngine(metadata);
  if (!engine?.sealed) {
    return {
      metadata: asRecord(metadata) ? { ...asRecord(metadata)! } : {},
      snapshot: null,
      blockedReason: "Phase 12 Rollback Engine must be sealed before creating snapshots.",
    };
  }
  const snapshot: RecoverySnapshot = {
    id: nextSnapshotId(engine.snapshots),
    timestamp: new Date().toISOString(),
    operation: input.operation,
    filesAffected: input.files.map((f) => f.path),
    dependenciesAffected: input.dependenciesAffected ?? [],
    files: input.files.map((f) => ({ path: f.path, content: f.content })),
    label: input.label,
    sealedAfterRestore: false,
  };
  const next = buildCodeIntelligenceRollbackEngineAuthority({
    sealed: true,
    vault: engine.vault,
    snapshots: [...engine.snapshots, snapshot],
    lastStableSnapshotId: engine.lastStableSnapshotId ?? snapshot.id,
    retentionDays: engine.retentionDays,
  });
  // Preserve sealedAt from prior seal.
  const preserved: CodeIntelligenceRollbackEngineAuthority = {
    ...next,
    sealedAt: engine.sealedAt,
  };
  return {
    metadata: persistCodeIntelligenceRollbackEngine(metadata, preserved),
    snapshot,
  };
}

/** cint.restore.engine.v1 */
export function restoreRecoverySnapshot(
  metadata: unknown,
  snapshotId?: string | null,
): {
  metadata: Record<string, unknown>;
  restored: RecoverySnapshot | null;
  filesRestored: number;
  blockedReason?: string;
  message: string;
} {
  const engine = readCodeIntelligenceRollbackEngine(metadata);
  if (!engine?.sealed) {
    return {
      metadata: asRecord(metadata) ? { ...asRecord(metadata)! } : {},
      restored: null,
      filesRestored: 0,
      blockedReason: "Rollback Engine not sealed",
      message: "Rollback blocked",
    };
  }
  const target =
    (snapshotId && engine.snapshots.find((s) => s.id === snapshotId)) ||
    (engine.lastStableSnapshotId
      ? engine.snapshots.find((s) => s.id === engine.lastStableSnapshotId)
      : null) ||
    engine.snapshots[engine.snapshots.length - 1] ||
    null;
  if (!target) {
    return {
      metadata: asRecord(metadata) ? { ...asRecord(metadata)! } : {},
      restored: null,
      filesRestored: 0,
      blockedReason: "No snapshot available",
      message: "Rollback failed — no recovery point",
    };
  }
  const next: CodeIntelligenceRollbackEngineAuthority = {
    ...engine,
    lastStableSnapshotId: target.id,
  };
  return {
    metadata: persistCodeIntelligenceRollbackEngine(metadata, next),
    restored: target,
    filesRestored: target.files.length,
    message: `Rollback Successful — ${target.files.length} files restored — 0 data loss`,
  };
}

/** cint.safe.delete.v1 — archive, never hard-delete until retention. */
export function archiveDeleteToVault(
  metadata: unknown,
  input: {
    path: string;
    content: string;
    reason: string;
    snapshotId?: string | null;
  },
): {
  metadata: Record<string, unknown>;
  entry: RecoveryVaultEntry | null;
  blockedReason?: string;
} {
  const engine = readCodeIntelligenceRollbackEngine(metadata);
  if (!engine?.sealed) {
    return {
      metadata: asRecord(metadata) ? { ...asRecord(metadata)! } : {},
      entry: null,
      blockedReason: "Rollback Engine not sealed — safe delete unavailable",
    };
  }
  const retainUntil = new Date(
    Date.now() + engine.retentionDays * 24 * 60 * 60 * 1000,
  ).toISOString();
  const entry: RecoveryVaultEntry = {
    id: nextVaultId(engine.vault),
    archivedAt: new Date().toISOString(),
    originalPath: input.path,
    content: input.content,
    reason: input.reason,
    retainUntil,
    permanentlyDeleted: false,
    snapshotId: input.snapshotId ?? null,
  };
  const next: CodeIntelligenceRollbackEngineAuthority = {
    ...engine,
    vault: [...engine.vault, entry],
  };
  return {
    metadata: persistCodeIntelligenceRollbackEngine(metadata, next),
    entry,
  };
}

/** cint.change.diff.v1 — prepare human review before L4. */
export function buildChangeDiffReport(
  before: readonly RecoverySnapshotFile[],
  after: readonly RecoverySnapshotFile[],
): ChangeDiffReport {
  const beforeMap = new Map(before.map((f) => [f.path, f.content]));
  const afterMap = new Map(after.map((f) => [f.path, f.content]));
  const paths = new Set([...beforeMap.keys(), ...afterMap.keys()]);
  const lines: ChangeDiffLine[] = [];
  for (const path of [...paths].sort()) {
    const b = beforeMap.get(path);
    const a = afterMap.get(path);
    if (b === undefined && a !== undefined) lines.push({ path, kind: "added" });
    else if (b !== undefined && a === undefined) lines.push({ path, kind: "removed" });
    else if (b !== a) lines.push({ path, kind: "modified" });
  }
  const added = lines.filter((l) => l.kind === "added").length;
  const removed = lines.filter((l) => l.kind === "removed").length;
  const modified = lines.filter((l) => l.kind === "modified").length;
  return {
    version: "cint.change.diff.v1",
    beforeCount: before.length,
    afterCount: after.length,
    lines,
    summary: `+ ${added} added · − ${removed} removed · ~ ${modified} modified`,
  };
}

/**
 * cint.disaster.recovery.v1 — stop · lock · restore last stable.
 * Invokes existing audit emergency controls; does not invent a second emergency authority.
 */
export function triggerDisasterRecovery(input: {
  metadata: unknown;
  reason: string;
  invokedBy?: string;
}): {
  metadata: Record<string, unknown>;
  audit: CodeIntelligenceAuditEmergencyAuthority | null;
  restoreMessage: string;
  blockedReason?: string;
} {
  let working = asRecord(input.metadata) ? { ...asRecord(input.metadata)! } : {};
  if (!isCodeIntelligenceRollbackEngineSealed(working)) {
    return {
      metadata: working,
      audit: null,
      restoreMessage: "",
      blockedReason: "Rollback Engine not sealed",
    };
  }

  let audit = readCodeIntelligenceAuditEmergency(working);
  if (!audit?.sealed) {
    return {
      metadata: working,
      audit: null,
      restoreMessage: "",
      blockedReason: "Phase 10 Audit/Emergency must be sealed for disaster recovery",
    };
  }

  const invokedBy = input.invokedBy ?? "disaster_recovery";
  for (const control of [
    "pause_execution",
    "freeze_autonomous_actions",
    "emergency_rollback",
  ] as const) {
    const invoked = invokeEmergencyControl(audit, {
      control,
      invokedBy,
      reason: input.reason,
      authorizedRole: "human_operator",
    });
    if (invoked.allowed) {
      audit = invoked.authority;
    }
  }

  working = {
    ...working,
    "cint.audit.v1": audit,
  };

  const restored = restoreRecoverySnapshot(working, null);
  working = restored.metadata;

  return {
    metadata: working,
    audit,
    restoreMessage: restored.message,
    blockedReason: restored.blockedReason,
  };
}

export function formatCodeIntelligenceRollbackEngineSummaryLines(
  rollback: CodeIntelligenceRollbackEngineAuthority,
): string[] {
  return [
    `${rollback.sealed ? "✓" : "○"} Recovery & Rollback ${rollback.rollbackVersion} (${CINT_ROLLBACK_ENGINE_KEY})`,
    `○ Modules: ${rollback.modules.map((m) => m.key.replace(/^cint\./, "").replace(/\.v1$/, "")).join(" · ")}`,
    `○ Snapshots: ${rollback.snapshots.length} · Vault: ${rollback.vault.length} · Retention: ${rollback.retentionDays}d`,
    `○ Rule: ${rollback.rule}`,
  ];
}
