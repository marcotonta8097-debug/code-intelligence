/**
 * CI durable entity store — Supabase when CINT_SUPABASE_* configured,
 * else in-process pgbeMemoryStore (demo / local without keys).
 *
 * Tier 1: every list/get/mutate is scoped by projectId (no cross-project leak).
 */

import { pgbeTableOps, type PgbeRecord } from "@/lib/backend/pgbeMemoryStore";
import {
  getCintSupabaseConfig,
  resolveCintSupabase,
} from "@/lib/cint/cintSupabaseConfig";

export const CINT_ENTITY_TABLES = [
  "repositories",
  "findings",
  "evidence",
  "investigations",
  "remediation",
  "analysis_runs",
] as const;

export type CintEntityTable = (typeof CINT_ENTITY_TABLES)[number];

function isCintTable(table: string): table is CintEntityTable {
  return (CINT_ENTITY_TABLES as readonly string[]).includes(table.trim().toLowerCase());
}

function normalizeTable(table: string): string {
  return table.trim().toLowerCase() || "records";
}

function requireProjectId(projectId: string): string {
  const id = projectId.trim();
  if (!id || id === "local" || id === "oauth") {
    throw new Error("CINT store requires a real projectId");
  }
  return id;
}

/** Memory namespace — isolates projects without a shared table scan. */
export function cintMemoryTableKey(projectId: string, table: string): string {
  return `${requireProjectId(projectId)}::${normalizeTable(table)}`;
}

function newId(): string {
  return `cint_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function rowProjectId(row: Record<string, unknown>): string {
  const direct = row.project_id ?? row.projectId;
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  const payload =
    row.payload && typeof row.payload === "object" && !Array.isArray(row.payload)
      ? (row.payload as Record<string, unknown>)
      : null;
  const nested = payload?.project_id ?? payload?.projectId;
  return typeof nested === "string" ? nested.trim() : "";
}

/** Map API/camelCase bodies onto CI snake_case columns + payload bag. */
function toSupabaseRow(
  table: CintEntityTable,
  body: Record<string, unknown>,
  id: string,
  projectId: string,
): Record<string, unknown> {
  const str = (k: string) => (typeof body[k] === "string" ? (body[k] as string) : undefined);
  const bool = (k: string) => (typeof body[k] === "boolean" ? (body[k] as boolean) : undefined);
  const payload = { ...body, project_id: projectId, projectId };
  const base: Record<string, unknown> = {
    id,
    project_id: projectId,
    payload,
    updated_at: new Date().toISOString(),
  };

  switch (table) {
    case "repositories":
      return {
        ...base,
        name: str("name") || str("key") || id,
        url: str("url"),
        provider: str("provider") || "demo",
        last_synced_at: str("lastSyncedAt") || str("last_synced_at") || null,
      };
    case "findings":
      return {
        ...base,
        title: str("title") || str("name") || id,
        severity: str("severity") || "medium",
        status: str("status") || "open",
        confidence: str("confidence") || "medium",
        repository_id: str("repositoryId") || str("repository_id") || null,
        location: str("location"),
        criteria: str("criteria"),
        specialist: str("specialist"),
        evidence_ids: body.evidenceIds ?? body.evidence_ids ?? [],
        verification_status: str("verificationStatus") || str("verification_status") || "unverified",
      };
    case "evidence":
      return {
        ...base,
        finding_id: str("findingId") || str("finding_id") || null,
        summary: str("summary") || str("name") || id,
        location: str("location"),
        captured_at: str("capturedAt") || str("captured_at") || new Date().toISOString(),
        source: str("source"),
        trace_ref: str("traceRef") || str("trace_ref"),
      };
    case "investigations":
      return {
        ...base,
        finding_id: str("findingId") || str("finding_id") || null,
        status: str("status") || "open",
        hypothesis: str("hypothesis"),
        evidence_ids: body.evidenceIds ?? body.evidence_ids ?? [],
      };
    case "remediation":
      return {
        ...base,
        finding_id: str("findingId") || str("finding_id") || null,
        proposal: str("proposal") || str("name") || id,
        risk: str("risk") || "medium",
        approval_level: str("approvalLevel") || str("approval_level") || "L3",
        human_approval_id: str("humanApprovalId") || str("human_approval_id"),
        execution_status: str("executionStatus") || str("execution_status") || "proposed",
        writes_source: bool("writesSource") ?? bool("writes_source") ?? false,
        recovery_snapshot_id: str("recoverySnapshotId") || str("recovery_snapshot_id"),
        agent_id: str("agentId") || str("agent_id"),
      };
    case "analysis_runs":
      return {
        ...base,
        repository_id: str("repositoryId") || str("repository_id") || null,
        repository_name: str("repositoryName") || str("repository_name") || str("repository") || null,
        commit_sha: str("commitSha") || str("commit_sha") || null,
        state: str("state") || "COMPLETED",
        duration_ms:
          typeof body.durationMs === "number"
            ? body.durationMs
            : typeof body.duration_ms === "number"
              ? body.duration_ms
              : null,
        findings_count:
          typeof body.findingsCount === "number"
            ? body.findingsCount
            : typeof body.findings_count === "number"
              ? body.findings_count
              : 0,
        evidence_count:
          typeof body.evidenceCount === "number"
            ? body.evidenceCount
            : typeof body.evidence_count === "number"
              ? body.evidence_count
              : 0,
        investigations_count:
          typeof body.investigationsCount === "number"
            ? body.investigationsCount
            : typeof body.investigations_count === "number"
              ? body.investigations_count
              : 0,
        remediations_count:
          typeof body.remediationsCount === "number"
            ? body.remediationsCount
            : typeof body.remediations_count === "number"
              ? body.remediations_count
              : 0,
      };
    default:
      return base;
  }
}

function fromSupabaseRow(row: Record<string, unknown>): PgbeRecord {
  const payload =
    row.payload && typeof row.payload === "object" && !Array.isArray(row.payload)
      ? (row.payload as Record<string, unknown>)
      : {};
  return { ...payload, ...row, id: String(row.id) } as PgbeRecord;
}

export function cintStoreMode(): "supabase" | "memory" {
  return getCintSupabaseConfig() ? "supabase" : "memory";
}

export const cintEntityStore = {
  async list(table: string, projectId: string): Promise<PgbeRecord[]> {
    const pid = requireProjectId(projectId);
    const key = normalizeTable(table);
    if (cintStoreMode() === "memory" || !isCintTable(key)) {
      return pgbeTableOps.list(cintMemoryTableKey(pid, key));
    }
    const sb = resolveCintSupabase();
    const { data, error } = await sb
      .from(key)
      .select("*")
      .eq("project_id", pid)
      .order("created_at", { ascending: false });
    if (error) throw new Error(`CINT store list ${key}: ${error.message}`);
    return (data ?? []).map((row) => fromSupabaseRow(row as Record<string, unknown>));
  },

  async get(table: string, id: string, projectId: string): Promise<PgbeRecord | null> {
    const pid = requireProjectId(projectId);
    const key = normalizeTable(table);
    if (cintStoreMode() === "memory" || !isCintTable(key)) {
      return pgbeTableOps.get(cintMemoryTableKey(pid, key), id);
    }
    const sb = resolveCintSupabase();
    const { data, error } = await sb
      .from(key)
      .select("*")
      .eq("id", id)
      .eq("project_id", pid)
      .maybeSingle();
    if (error) throw new Error(`CINT store get ${key}: ${error.message}`);
    return data ? fromSupabaseRow(data as Record<string, unknown>) : null;
  },

  async create(table: string, body: Record<string, unknown>, projectId: string): Promise<PgbeRecord> {
    const pid = requireProjectId(projectId);
    const key = normalizeTable(table);
    const stamped = { ...body, project_id: pid, projectId: pid };
    if (cintStoreMode() === "memory" || !isCintTable(key)) {
      return pgbeTableOps.create(cintMemoryTableKey(pid, key), stamped);
    }
    const id = typeof body.id === "string" && body.id.trim() ? body.id.trim() : newId();
    const row = toSupabaseRow(key, stamped, id, pid);
    const sb = resolveCintSupabase();
    const { data, error } = await sb.from(key).insert(row).select("*").single();
    if (error) throw new Error(`CINT store create ${key}: ${error.message}`);
    return fromSupabaseRow(data as Record<string, unknown>);
  },

  async upsert(table: string, body: Record<string, unknown>, projectId: string): Promise<PgbeRecord> {
    const pid = requireProjectId(projectId);
    const key = normalizeTable(table);
    const id = typeof body.id === "string" && body.id.trim() ? body.id.trim() : newId();
    const stamped = { ...body, id, project_id: pid, projectId: pid };
    if (cintStoreMode() === "memory" || !isCintTable(key)) {
      return pgbeTableOps.upsert(cintMemoryTableKey(pid, key), stamped);
    }
    const existing = await cintEntityStore.get(key, id, pid);
    if (existing) {
      const updated = await cintEntityStore.update(key, id, stamped, pid);
      if (updated) return updated;
    }
    return cintEntityStore.create(key, stamped, pid);
  },

  async update(
    table: string,
    id: string,
    body: Record<string, unknown>,
    projectId: string,
  ): Promise<PgbeRecord | null> {
    const pid = requireProjectId(projectId);
    const key = normalizeTable(table);
    const stamped = { ...body, project_id: pid, projectId: pid };
    if (cintStoreMode() === "memory" || !isCintTable(key)) {
      return pgbeTableOps.update(cintMemoryTableKey(pid, key), id, stamped);
    }
    const existing = await cintEntityStore.get(key, id, pid);
    if (!existing) return null;
    const merged = { ...existing, ...stamped, id };
    const row = toSupabaseRow(key, merged, id, pid);
    const sb = resolveCintSupabase();
    const { data, error } = await sb
      .from(key)
      .update(row)
      .eq("id", id)
      .eq("project_id", pid)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(`CINT store update ${key}: ${error.message}`);
    return data ? fromSupabaseRow(data as Record<string, unknown>) : null;
  },

  async remove(table: string, id: string, projectId: string): Promise<boolean> {
    const pid = requireProjectId(projectId);
    const key = normalizeTable(table);
    if (cintStoreMode() === "memory" || !isCintTable(key)) {
      return pgbeTableOps.remove(cintMemoryTableKey(pid, key), id);
    }
    const sb = resolveCintSupabase();
    const { error, count } = await sb
      .from(key)
      .delete({ count: "exact" })
      .eq("id", id)
      .eq("project_id", pid);
    if (error) throw new Error(`CINT store delete ${key}: ${error.message}`);
    return (count ?? 0) > 0;
  },
};

/** Test helper — assert a row belongs to a project. */
export function cintRowBelongsToProject(row: Record<string, unknown>, projectId: string): boolean {
  return rowProjectId(row) === projectId.trim();
}
