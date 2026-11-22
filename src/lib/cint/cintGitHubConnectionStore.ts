/**
 * Per-CI-project GitHub connection + sync evidence.
 * Durability order: memory cache → CINT Supabase github_connections → encrypted/plaintext file KV.
 */

import {
  cintDurableDelete,
  cintDurableFileMode,
  cintDurableGet,
  cintDurablePut,
  type CintDurableBackend,
} from "@/lib/cint/cintDurableFileStore";
import {
  getCintSupabaseConfig,
  resolveCintSupabaseServiceRole,
} from "@/lib/cint/cintSupabaseConfig";
import { createServiceRoleSupabase } from "@/serverFns/security.server";
import type { Json } from "@/integrations/supabase/types";

export const CINT_GITHUB_CONN_DURABLE_NS = "github_connections" as const;

export const CINT_LIVE_INDEX_KEY = "cint.connector.liveIndex.v1" as const;
export const CINT_LIVE_INDEX_VERSION = "CINT-LI-1.0" as const;

export type CintGitHubConnection = {
  projectId: string;
  accessToken: string;
  accountLogin: string | null;
  scope: string;
  selectedRepo: string | null;
  defaultBranch: string | null;
  lastSyncedAt: string | null;
  syncCommitSha: string | null;
  syncFileCount: number;
  updatedAt: string;
};

export type CodeIntelligenceLiveIndexEvidence = Readonly<{
  version: "cint.connector.liveIndex.v1";
  liveIndexVersion: typeof CINT_LIVE_INDEX_VERSION;
  synced: boolean;
  syncedAt: string | null;
  repository: string | null;
  commitSha: string | null;
  fileCount: number;
  provider: "github_read" | "local_snapshot";
  accountLogin: string | null;
}>;

const memory = new Map<string, CintGitHubConnection>();
let lastTokenDurability: CintDurableBackend = "memory";

export function getCintGitHubTokenDurability(): CintDurableBackend {
  if (getCintSupabaseConfig()) return "supabase";
  return lastTokenDurability === "memory" ? cintDurableFileMode() : lastTokenDurability;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function persistConnectionToFile(conn: CintGitHubConnection): CintDurableBackend {
  lastTokenDurability = cintDurablePut(CINT_GITHUB_CONN_DURABLE_NS, conn.projectId, conn);
  return lastTokenDurability;
}

function fromRow(row: Record<string, unknown>): CintGitHubConnection {
  return {
    projectId: String(row.project_id ?? row.projectId ?? ""),
    accessToken: String(row.access_token ?? row.accessToken ?? ""),
    accountLogin: (row.account_login ?? row.accountLogin ?? null) as string | null,
    scope: String(row.scope ?? ""),
    selectedRepo: (row.selected_repo ?? row.selectedRepo ?? null) as string | null,
    defaultBranch: (row.default_branch ?? row.defaultBranch ?? null) as string | null,
    lastSyncedAt: (row.last_synced_at ?? row.lastSyncedAt ?? null) as string | null,
    syncCommitSha: (row.sync_commit_sha ?? row.syncCommitSha ?? null) as string | null,
    syncFileCount: Number(row.sync_file_count ?? row.syncFileCount ?? 0) || 0,
    updatedAt: String(row.updated_at ?? row.updatedAt ?? new Date().toISOString()),
  };
}

export async function upsertCintGitHubConnection(
  conn: Omit<CintGitHubConnection, "updatedAt"> & { updatedAt?: string },
): Promise<CintGitHubConnection> {
  const next: CintGitHubConnection = {
    ...conn,
    updatedAt: conn.updatedAt ?? new Date().toISOString(),
  };
  memory.set(next.projectId, next);

  const cfg = getCintSupabaseConfig();
  if (cfg) {
    try {
      const sb = resolveCintSupabaseServiceRole();
      const { error } = await sb.from("github_connections").upsert(
        {
          project_id: next.projectId,
          access_token: next.accessToken,
          account_login: next.accountLogin,
          scope: next.scope,
          selected_repo: next.selectedRepo,
          default_branch: next.defaultBranch,
          last_synced_at: next.lastSyncedAt,
          sync_commit_sha: next.syncCommitSha,
          sync_file_count: next.syncFileCount,
          updated_at: next.updatedAt,
        },
        { onConflict: "project_id" },
      );
      if (!error) {
        lastTokenDurability = "supabase";
        // File backup so local restarts still work if Supabase blips.
        persistConnectionToFile(next);
        return next;
      }
    } catch {
      // Fall through to file durability.
    }
  }
  persistConnectionToFile(next);
  return next;
}

export async function getCintGitHubConnection(
  projectId: string,
): Promise<CintGitHubConnection | null> {
  const id = projectId.trim();
  if (!id) return null;
  const mem = memory.get(id);
  if (mem) return mem;

  const cfg = getCintSupabaseConfig();
  if (cfg) {
    try {
      const sb = resolveCintSupabaseServiceRole();
      const { data, error } = await sb
        .from("github_connections")
        .select("*")
        .eq("project_id", id)
        .maybeSingle();
      if (!error && data) {
        const conn = fromRow(data as Record<string, unknown>);
        memory.set(id, conn);
        lastTokenDurability = "supabase";
        return conn;
      }
    } catch {
      // Fall through to file.
    }
  }

  const fromFile = cintDurableGet<CintGitHubConnection>(CINT_GITHUB_CONN_DURABLE_NS, id);
  if (fromFile?.accessToken && fromFile.projectId) {
    const row = asRecord(fromFile);
    if (!row) return null;
    const conn = fromRow(row);
    memory.set(id, conn);
    lastTokenDurability = cintDurableFileMode();
    return conn;
  }
  return null;
}

export async function clearCintGitHubConnection(projectId: string): Promise<void> {
  const id = projectId.trim();
  memory.delete(id);
  cintDurableDelete(CINT_GITHUB_CONN_DURABLE_NS, id);
  const cfg = getCintSupabaseConfig();
  if (!cfg) return;
  try {
    const sb = resolveCintSupabaseServiceRole();
    await sb.from("github_connections").delete().eq("project_id", id);
  } catch {
    // ignore
  }
}

export function connectionToLiveIndexEvidence(
  conn: CintGitHubConnection | null,
): CodeIntelligenceLiveIndexEvidence {
  const synced = Boolean(
    conn?.lastSyncedAt && conn.selectedRepo && (conn.syncFileCount > 0 || conn.syncCommitSha),
  );
  return {
    version: "cint.connector.liveIndex.v1",
    liveIndexVersion: CINT_LIVE_INDEX_VERSION,
    synced,
    syncedAt: conn?.lastSyncedAt ?? null,
    repository: conn?.selectedRepo ?? null,
    commitSha: conn?.syncCommitSha ?? null,
    fileCount: conn?.syncFileCount ?? 0,
    provider: "github_read",
    accountLogin: conn?.accountLogin ?? null,
  };
}

/** Stamp sync evidence into project metadata (PDS honesty reader). */
export function stampCodeIntelligenceLiveIndexEvidence(
  metadata: unknown,
  evidence: CodeIntelligenceLiveIndexEvidence,
): Record<string, unknown> {
  const base = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  base[CINT_LIVE_INDEX_KEY] = evidence;
  return base;
}

/**
 * Persist liveIndex onto projects.metadata — shared by Sync and Import
 * so Import-only success clears the same CINT_NO_LIVE_INDEX honesty bar.
 */
export async function persistCintProjectLiveIndexMetadata(
  projectId: string,
  liveIndex: CodeIntelligenceLiveIndexEvidence | Record<string, unknown>,
): Promise<boolean> {
  try {
    const sb = createServiceRoleSupabase();
    const { data } = await sb.from("projects").select("id, metadata").eq("id", projectId).maybeSingle();
    if (!data?.id) return false;
    const prev =
      data.metadata && typeof data.metadata === "object" && !Array.isArray(data.metadata)
        ? (data.metadata as Record<string, unknown>)
        : {};
    const nextMetadata = {
      ...prev,
      [CINT_LIVE_INDEX_KEY]: liveIndex,
    } as Json;
    const { error } = await sb.from("projects").update({ metadata: nextMetadata }).eq("id", projectId);
    return !error;
  } catch {
    return false;
  }
}

export function readCodeIntelligenceLiveIndexEvidence(
  metadata?: unknown,
): CodeIntelligenceLiveIndexEvidence | null {
  const block = asRecord(asRecord(metadata)?.[CINT_LIVE_INDEX_KEY]);
  if (!block || block.version !== "cint.connector.liveIndex.v1") return null;
  return block as CodeIntelligenceLiveIndexEvidence;
}

export function isCodeIntelligenceLiveIndexSynced(metadata?: unknown): boolean {
  const ev = readCodeIntelligenceLiveIndexEvidence(metadata);
  return Boolean(ev?.synced && ev.syncedAt && ev.repository);
}

/** Test / seal helper — stamps a successful github_read sync without network. */
export function sealCodeIntelligenceLiveIndexEvidence(
  metadata: unknown,
  options?: { repository?: string; commitSha?: string; fileCount?: number },
): { metadata: Record<string, unknown>; evidence: CodeIntelligenceLiveIndexEvidence } {
  const evidence: CodeIntelligenceLiveIndexEvidence = {
    version: "cint.connector.liveIndex.v1",
    liveIndexVersion: CINT_LIVE_INDEX_VERSION,
    synced: true,
    syncedAt: new Date().toISOString(),
    repository: options?.repository ?? "acme/payments-api",
    commitSha: options?.commitSha ?? "deadbeef",
    fileCount: options?.fileCount ?? 12,
    provider: "github_read",
    accountLogin: "ci-operator",
  };
  return { metadata: stampCodeIntelligenceLiveIndexEvidence(metadata, evidence), evidence };
}
