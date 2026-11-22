/**
 * CI ingress/egress proof pipeline — extract → store → export / upload ledger.
 * Owner for concrete reliability of Import / Export / Upload before analyzers.
 * GitHub OAuth remains required for live github_read; local_snapshot proves the loop offline.
 */

import type { RepositoryTreeSnapshot } from "@/core/codeIntelligence/repositoryIntelligenceEngine";
import { CODE_INTELLIGENCE_DEMO_TREES } from "@/core/codeIntelligence/repositoryIntelligenceEngine";
import {
  cintDurableFileMode,
  cintDurableList,
  cintDurablePut,
  type CintDurableBackend,
} from "@/lib/cint/cintDurableFileStore";
import { cintEntityStore, cintStoreMode } from "@/lib/cint/cintEntityStore";
import {
  CINT_LIVE_INDEX_KEY,
  getCintGitHubTokenDurability,
  type CodeIntelligenceLiveIndexEvidence,
  persistCintProjectLiveIndexMetadata,
  sealCodeIntelligenceLiveIndexEvidence,
} from "@/lib/cint/cintGitHubConnectionStore";
import { isCintGitHubOAuthConfigured } from "@/lib/cint/cintGitHubConfig";
import { normalizeCintGitHubFullName } from "@/lib/cint/cintGitHubRepoOps";
import { extractZipToRepositoryTree } from "@/lib/cint/cintZipExtract";
import { isCintSupabaseConfigured } from "@/lib/cint/cintSupabaseConfig";

export const CINT_EXPORT_VERSION = "cint.export.v1" as const;
export const CINT_UPLOAD_LEDGER_KEY = "cint.upload.ledger.v1" as const;
export const CINT_UPLOAD_DURABLE_NS = "upload_ledger" as const;

export type CintExportFormat = "json" | "csv" | "markdown" | "pdf" | "download" | "file";

export type CintUploadRecord = {
  id: string;
  projectId: string;
  kind: string;
  filename: string;
  status: "REGISTERED" | "EXTRACTED" | "FAILED";
  registeredAt: string;
  bytesNoted: number | null;
  note: string;
  fileCount?: number;
  repositoryId?: string;
  durability?: CintDurableBackend;
};

export type CintPipelineReadiness = {
  oauthConfigured: boolean;
  storeMode: string;
  tokenDurability: CintDurableBackend;
  canLiveGithub: boolean;
  canLocalExtract: boolean;
  canZipExtract: boolean;
  canExport: boolean;
  canUploadRegister: boolean;
  blockers: string[];
};

export type CintExportBundle = {
  version: typeof CINT_EXPORT_VERSION;
  exportedAt: string;
  projectId: string;
  store: string;
  liveIndex: CodeIntelligenceLiveIndexEvidence | null;
  repositories: unknown[];
  findings: unknown[];
  evidence: unknown[];
  investigations: unknown[];
  remediation: unknown[];
  uploads?: CintUploadRecord[];
  readiness?: CintPipelineReadiness;
};

const memoryUploads = new Map<string, CintUploadRecord[]>();

function rememberUpload(rec: CintUploadRecord): void {
  const prev = memoryUploads.get(rec.projectId) ?? [];
  prev.unshift(rec);
  memoryUploads.set(rec.projectId, prev.slice(0, 100));
  cintDurablePut(CINT_UPLOAD_DURABLE_NS, rec.id, rec);
}

export function assessCintIngressEgressReadiness(): CintPipelineReadiness {
  const oauthConfigured = isCintGitHubOAuthConfigured();
  const storeMode = cintStoreMode();
  const tokenDurability = getCintGitHubTokenDurability();
  const blockers: string[] = [];
  if (!oauthConfigured) {
    blockers.push("CINT_GITHUB_CLIENT_ID / CINT_GITHUB_CLIENT_SECRET (or GITHUB_*) required for live GitHub extract");
  }
  if (!isCintSupabaseConfigured() && tokenDurability === "file_plaintext") {
    blockers.push("Set CINT_OAUTH_STATE_SECRET (or CINT_SUPABASE_*) so OAuth tokens encrypt at rest on disk");
  }
  return {
    oauthConfigured,
    storeMode,
    tokenDurability,
    canLiveGithub: oauthConfigured,
    canLocalExtract: true,
    canZipExtract: true,
    canExport: true,
    canUploadRegister: true,
    blockers,
  };
}

/** Redact secrets from export payloads. */
export function redactCintExportValue(key: string, value: unknown): unknown {
  if (/token|secret|password|authorization/i.test(key)) return undefined;
  return value;
}

export function buildCintExportBundle(input: {
  projectId: string;
  liveIndex?: CodeIntelligenceLiveIndexEvidence | null;
  repositories: unknown[];
  findings: unknown[];
  evidence: unknown[];
  investigations: unknown[];
  remediation: unknown[];
}): CintExportBundle {
  return {
    version: CINT_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    projectId: input.projectId,
    store: cintStoreMode(),
    liveIndex: input.liveIndex ?? null,
    repositories: input.repositories,
    findings: input.findings,
    evidence: input.evidence,
    investigations: input.investigations,
    remediation: input.remediation,
  };
}

export async function collectCintExportBundle(
  projectId: string,
  liveIndex?: CodeIntelligenceLiveIndexEvidence | null,
): Promise<CintExportBundle> {
  return buildCintExportBundle({
    projectId,
    liveIndex: liveIndex ?? null,
    repositories: await cintEntityStore.list("repositories"),
    findings: await cintEntityStore.list("findings"),
    evidence: await cintEntityStore.list("evidence"),
    investigations: await cintEntityStore.list("investigations"),
    remediation: await cintEntityStore.list("remediation"),
  });
}

function asRows(items: unknown[]): Record<string, unknown>[] {
  return items.filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === "object");
}

/** Drop tree file bodies / long snippets so Live preview export stays downloadable. */
export function slimCintExportBundle(bundle: CintExportBundle): CintExportBundle {
  const repos = asRows(bundle.repositories).map((repo) => {
    const tree =
      repo.tree && typeof repo.tree === "object"
        ? (repo.tree as Record<string, unknown>)
        : null;
    const files = Array.isArray(tree?.files) ? (tree!.files as Record<string, unknown>[]) : null;
    const { payload: _payload, ...repoRest } = repo;
    return {
      ...repoRest,
      tree: tree
        ? {
            id: tree.id ?? null,
            fileCount: files ? files.length : (tree.fileCount ?? repo.fileCount ?? 0),
            files: files
              ? files.map((f) => ({ path: f.path ?? "", bytes: f.bytes ?? null }))
              : undefined,
          }
        : null,
    };
  });
  const evidence = asRows(bundle.evidence).map((row) => {
    const next: Record<string, unknown> = { ...row };
    if (typeof next.snippet === "string" && next.snippet.length > 500) {
      next.snippet = `${next.snippet.slice(0, 500)}…`;
    }
    if (typeof next.body === "string" && next.body.length > 500) {
      next.body = `${next.body.slice(0, 500)}…`;
    }
    delete next.content;
    delete next.raw;
    return next;
  });
  const findings = asRows(bundle.findings).map((row) => {
    const next: Record<string, unknown> = { ...row };
    delete next.tree;
    delete next.files;
    delete next.payload;
    if (typeof next.why === "string" && next.why.length > 800) {
      next.why = `${next.why.slice(0, 800)}…`;
    }
    return next;
  });
  const investigations = asRows(bundle.investigations).map((row) => {
    const next: Record<string, unknown> = { ...row };
    delete next.transcript;
    delete next.raw;
    if (typeof next.notes === "string" && next.notes.length > 1000) {
      next.notes = `${next.notes.slice(0, 1000)}…`;
    }
    return next;
  });
  return {
    ...bundle,
    repositories: repos,
    findings,
    evidence,
    investigations,
  };
}

export function renderCintExport(
  bundle: CintExportBundle,
  format: CintExportFormat,
): { body: string; contentType: string; filename: string } {
  const slimmed = slimCintExportBundle(bundle);
  const safe = JSON.parse(JSON.stringify(slimmed, redactCintExportValue)) as CintExportBundle;
  const base = `cint-export-${bundle.projectId}`;
  if (format === "csv") {
    const findings = asRows(safe.findings);
    const header = "id,title,severity,status,confidence,repository_id,location";
    const lines = findings.map((f) =>
      [
        f.id ?? "",
        f.title ?? f.name ?? "",
        f.severity ?? "",
        f.status ?? "",
        f.confidence ?? "",
        f.repository_id ?? f.repositoryId ?? "",
        f.location ?? "",
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(","),
    );
    return {
      body: [header, ...lines].join("\n"),
      contentType: "text/csv; charset=utf-8",
      filename: `${base}-findings.csv`,
    };
  }
  if (format === "markdown" || format === "pdf") {
    // PDF button uses Markdown body + Content-Disposition; browser print covers true PDF.
    const findings = asRows(safe.findings);
    const md = [
      `# Code Intelligence export`,
      ``,
      `- Project: \`${safe.projectId}\``,
      `- Exported: ${safe.exportedAt}`,
      `- Store: ${safe.store}`,
      `- Repositories: ${safe.repositories.length}`,
      `- Findings: ${safe.findings.length}`,
      `- Evidence: ${safe.evidence.length}`,
      ``,
      `## Findings`,
      ...findings.map(
        (f) =>
          `- **${f.title ?? f.name ?? f.id ?? "finding"}** (${f.severity ?? "?"}) — ${f.location ?? "n/a"}`,
      ),
      ``,
      format === "pdf" ? `_PDF: use browser Print on this Markdown export (no silent source mutation)._` : "",
    ]
      .filter(Boolean)
      .join("\n");
    return {
      body: md,
      contentType: "text/markdown; charset=utf-8",
      filename: `${base}.${format === "pdf" ? "md" : "md"}`,
    };
  }
  return {
    body: JSON.stringify(safe, null, 2),
    contentType: "application/json; charset=utf-8",
    filename: `${base}.json`,
  };
}

export function registerCintUpload(input: {
  projectId: string;
  kind: string;
  filename: string;
  bytesNoted?: number | null;
  status?: CintUploadRecord["status"];
  note?: string;
  fileCount?: number;
  repositoryId?: string;
}): CintUploadRecord {
  const rec: CintUploadRecord = {
    id: `upl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    projectId: input.projectId,
    kind: (input.kind || "zip").trim() || "zip",
    filename: (input.filename || "asset.bin").trim() || "asset.bin",
    status: input.status ?? "REGISTERED",
    registeredAt: new Date().toISOString(),
    bytesNoted: input.bytesNoted ?? null,
    note:
      input.note ??
      "Upload registered on durable ledger — provide ZIP bytes to extract into repository store.",
    fileCount: input.fileCount,
    repositoryId: input.repositoryId,
    durability: cintDurableFileMode(),
  };
  rememberUpload(rec);
  return rec;
}

export function listCintUploads(projectId: string): CintUploadRecord[] {
  const mem = memoryUploads.get(projectId) ?? [];
  if (mem.length) return [...mem];
  return cintDurableList<CintUploadRecord>(CINT_UPLOAD_DURABLE_NS)
    .filter((r) => r && r.projectId === projectId && r.id?.startsWith("upl_"))
    .sort((a, b) => String(b.registeredAt).localeCompare(String(a.registeredAt)))
    .slice(0, 100);
}

/** Real ZIP bytes → extract tree → entity store + durable upload ledger. */
export async function ingestZipUploadBytes(input: {
  projectId: string;
  filename: string;
  bytes: Uint8Array | Buffer;
  kind?: string;
  repositoryId?: string;
}): Promise<{
  ok: true;
  upload: CintUploadRecord;
  repository: string;
  fileCount: number;
  commitSha: string;
  skipped: number;
  liveIndex: CodeIntelligenceLiveIndexEvidence;
  metadataPersisted: boolean;
}> {
  const filename = (input.filename || "archive.zip").trim() || "archive.zip";
  const repositoryId =
    (input.repositoryId || filename.replace(/\.zip$/i, "") || "zip-upload").trim() || "zip-upload";
  const extracted = extractZipToRepositoryTree(input.bytes, { repositoryId });
  const ingested = await ingestLocalSnapshotTree({
    projectId: input.projectId,
    repositoryId,
    tree: extracted.tree,
  });
  const upload = registerCintUpload({
    projectId: input.projectId,
    kind: input.kind || "zip",
    filename,
    bytesNoted: input.bytes.byteLength,
    status: "EXTRACTED",
    fileCount: extracted.tree.files.length,
    repositoryId,
    note: `ZIP extracted (${extracted.tree.files.length} files, ${extracted.skipped} skipped) into repository store.`,
  });
  return {
    ok: true,
    upload,
    repository: ingested.repository,
    fileCount: ingested.fileCount,
    commitSha: ingested.commitSha,
    skipped: extracted.skipped,
    liveIndex: ingested.liveIndex,
    metadataPersisted: ingested.metadataPersisted,
  };
}

/** Offline extract proof — ingest a known tree without GitHub OAuth. */
export async function ingestLocalSnapshotTree(input: {
  projectId: string;
  repositoryId?: string;
  tree?: RepositoryTreeSnapshot;
}): Promise<{
  ok: true;
  repository: string;
  fileCount: number;
  commitSha: string;
  liveIndex: CodeIntelligenceLiveIndexEvidence;
  metadataPersisted: boolean;
  metadataStamp: Record<string, unknown>;
}> {
  const repositoryId = (input.repositoryId || "payments-api").trim() || "payments-api";
  const tree =
    input.tree ??
    CODE_INTELLIGENCE_DEMO_TREES[repositoryId] ??
    CODE_INTELLIGENCE_DEMO_TREES["payments-api"];
  if (!tree?.files?.length) {
    throw new Error("local_snapshot_tree_empty");
  }
  const commitSha = `local_${repositoryId}_${tree.files.length}`;
  await cintEntityStore.create("repositories", {
    id: `repo_local_${repositoryId.replace(/[^\w.-]+/g, "_")}`,
    name: repositoryId,
    url: `local-snapshot://${repositoryId}`,
    provider: "local_snapshot",
    lastSyncedAt: new Date().toISOString(),
    defaultBranch: "local",
    commitSha,
    fileCount: tree.files.length,
    tree,
  });
  const { evidence } = sealCodeIntelligenceLiveIndexEvidence(
    {},
    {
      repository: repositoryId,
      commitSha,
      fileCount: tree.files.length,
    },
  );
  const liveIndex: CodeIntelligenceLiveIndexEvidence = {
    ...evidence,
    provider: "local_snapshot",
  };
  const metadataPersisted = await persistCintProjectLiveIndexMetadata(input.projectId, liveIndex);
  return {
    ok: true,
    repository: repositoryId,
    fileCount: tree.files.length,
    commitSha,
    liveIndex,
    metadataPersisted,
    metadataStamp: { [CINT_LIVE_INDEX_KEY]: liveIndex },
  };
}

export function assertGithubSourceNormalizes(raw: string): string {
  const n = normalizeCintGitHubFullName(raw);
  if (!n) throw new Error("repository_required");
  return n;
}
