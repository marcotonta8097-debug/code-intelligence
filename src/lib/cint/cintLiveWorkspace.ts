/**
 * Live CI workspace helpers — load synced GitHub trees and persist engine results.
 * No demo tree fallback when requireLive=true.
 */

import {
  analyzeCodeIntelligenceSnapshot,
  isQualityFindingCategory,
  isSecurityFindingCategory,
} from "@/core/codeIntelligence/codeIntelligenceAnalysis";
import { stampCintObjectGovernance } from "@/core/codeIntelligence/codeIntelligenceObjectGovernance";
import { buildAnalysisRunId } from "@/core/codeIntelligence/codeIntelligenceObjectIdentity";
import {
  buildCintKilBundle,
  serializeCintKilForClient,
} from "@/core/codeIntelligence/codeIntelligenceKilBundle";
import type { RepositoryTreeSnapshot } from "@/core/codeIntelligence/repositoryIntelligenceEngine";
import { cintEntityStore } from "@/lib/cint/cintEntityStore";
import { getCintGitHubConnection } from "@/lib/cint/cintGitHubConnectionStore";
import { createServiceRoleSupabase } from "@/serverFns/security.server";

export type CintLoadedTree = {
  repository: string;
  commitSha: string | null;
  defaultBranch: string | null;
  tree: RepositoryTreeSnapshot;
  source: "repositories_entity" | "connection_hint";
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function treeFromRow(row: Record<string, unknown>): RepositoryTreeSnapshot | null {
  const payload = asRecord(row.payload) ?? row;
  const tree = asRecord(payload.tree) ?? asRecord(row.tree);
  if (!tree) return null;
  const id = String(tree.id || payload.name || row.name || row.id || "repo");
  const files = Array.isArray(tree.files) ? tree.files : [];
  return {
    id,
    files: files
      .map((f) => {
        const file = asRecord(f) ?? {};
        return {
          path: String(file.path ?? ""),
          bytes: typeof file.bytes === "number" ? file.bytes : undefined,
          content: typeof file.content === "string" ? file.content : undefined,
        };
      })
      .filter((f) => f.path),
  };
}

export async function loadCintSyncedTree(
  projectId: string,
  repository?: string | null,
): Promise<CintLoadedTree | null> {
  const wanted = (repository || "").trim();
  const rows = await cintEntityStore.list("repositories");
  const match =
    (wanted
      ? rows.find((r) => {
          const name = String(r.name ?? r.id ?? "");
          return name === wanted || name.endsWith(`/${wanted}`) || name.includes(wanted);
        })
      : null) ||
    rows.find((r) => asRecord(r)?.tree || asRecord(asRecord(r)?.payload)?.tree) ||
    rows[0];

  if (match) {
    const tree = treeFromRow(match as Record<string, unknown>);
    if (tree && tree.files.length > 0) {
      const payload = asRecord(match.payload) ?? (match as Record<string, unknown>);
      return {
        repository: String(match.name ?? tree.id),
        commitSha: (payload.commitSha as string) || (match.commitSha as string) || null,
        defaultBranch:
          (payload.defaultBranch as string) || (match.default_branch as string) || null,
        tree,
        source: "repositories_entity",
      };
    }
  }

  const conn = await getCintGitHubConnection(projectId);
  if (conn?.selectedRepo && conn.syncFileCount > 0) {
    return null;
  }
  return null;
}

export async function loadCintProjectMetadata(
  projectId: string,
): Promise<Record<string, unknown>> {
  try {
    const sb = createServiceRoleSupabase();
    const { data } = await sb.from("projects").select("metadata").eq("id", projectId).maybeSingle();
    const meta = asRecord(data?.metadata);
    return meta ? { ...meta } : {};
  } catch {
    return {};
  }
}

/** Stable repositories.id for GitHub owner/repo (must match sync create). */
export function cintRepositoryStoreId(repository: string): string {
  return `repo_${repository.replace(/[^\w.-]+/g, "_")}`;
}

export function cintFindingStoreId(repository: string, findingId: string): string {
  return `finding_${repository.replace(/[^\w.-]+/g, "_")}_${findingId}`.slice(0, 120);
}

async function ensureCintRepositoryRow(repository: string): Promise<string> {
  const wanted = repository.trim();
  const expectedId = cintRepositoryStoreId(wanted);
  const rows = await cintEntityStore.list("repositories");
  const match = rows.find((r) => {
    const id = String(r.id ?? "");
    const name = String(r.name ?? "");
    return (
      id === wanted ||
      id === expectedId ||
      name === wanted ||
      name.endsWith(`/${wanted}`) ||
      name.includes(wanted)
    );
  });
  if (match?.id) return String(match.id);

  await cintEntityStore.create("repositories", {
    id: expectedId,
    name: wanted,
    provider: wanted.includes("/") ? "github_read" : "local",
    url: wanted.includes("/") ? `https://github.com/${wanted}` : `local-snapshot://${wanted}`,
    lastSyncedAt: new Date().toISOString(),
  });
  return expectedId;
}

async function upsertCintEntity(
  table: "findings" | "evidence" | "investigations" | "remediation" | "analysis_runs",
  id: string,
  body: Record<string, unknown>,
): Promise<void> {
  const existing = await cintEntityStore.get(table, id);
  if (existing) {
    await cintEntityStore.update(table, id, { ...body, id });
    return;
  }
  await cintEntityStore.create(table, { ...body, id });
}

export async function persistCintAnalysisResults(input: {
  repository: string;
  commitSha: string | null;
  analysis: ReturnType<typeof analyzeCodeIntelligenceSnapshot>;
  runId?: string;
  durationMs?: number;
  state?: string;
}): Promise<{
  findings: number;
  evidence: number;
  investigations: number;
  remediations: number;
  repositoryStoreId: string;
  runId: string;
}> {
  const { repository, commitSha, analysis } = input;
  const repositoryStoreId = await ensureCintRepositoryRow(repository);
  let findings = 0;
  let evidence = 0;
  let investigations = 0;
  let remediations = 0;
  const runId = (input.runId || buildAnalysisRunId()).slice(0, 120);

  const findingIdMap = new Map<string, string>();
  for (const f of analysis.findings) {
    const storeId = cintFindingStoreId(repository, f.id);
    findingIdMap.set(f.id, storeId);
    const location = f.evidence[0]?.location ?? repository;
    const gov = stampCintObjectGovernance({
      confidence: f.confidence,
      engineProvenance: f.provenance,
    });
    await upsertCintEntity("findings", storeId, {
      title: f.title,
      severity: f.severity,
      status: "open",
      confidence: f.confidence,
      // FK → repositories.id (not owner/repo display name)
      repositoryId: repositoryStoreId,
      location,
      criteria: f.category,
      specialist: "code_intelligence",
      evidenceIds: f.evidence.map((e) => e.id),
      verificationStatus: "unverified",
      commitSha,
      category: f.category,
      kind: f.kind,
      why: f.why,
      repositoryName: repository,
      objectStatus: gov.status,
      objectProvenance: gov.provenance,
      objectTrust: gov.trust,
      governanceVersion: gov.governanceVersion,
    });
    findings += 1;
  }
  for (const e of analysis.evidence) {
    const storeId = `evidence_${e.id}`.slice(0, 120);
    const findingStoreId = findingIdMap.get(e.findingId) || cintFindingStoreId(repository, e.findingId);
    const gov = stampCintObjectGovernance({
      engineProvenance: "Engine",
      trust: "Medium",
    });
    await upsertCintEntity("evidence", storeId, {
      findingId: findingStoreId,
      summary: e.summary,
      location: e.location,
      source: e.kind,
      traceRef: e.slot,
      capturedAt: new Date().toISOString(),
      commitSha,
      snippet: e.snippet,
      repositoryId: repositoryStoreId,
      repositoryName: repository,
      objectStatus: gov.status,
      objectProvenance: gov.provenance,
      objectTrust: gov.trust,
      governanceVersion: gov.governanceVersion,
    });
    evidence += 1;
  }
  for (const inv of analysis.investigations) {
    const storeId = `inv_${inv.id}`.slice(0, 120);
    const findingStoreId =
      findingIdMap.get(inv.findingId) || cintFindingStoreId(repository, inv.findingId);
    const gov = stampCintObjectGovernance({
      status: inv.state === "IN_REVIEW" ? "NeedsReview" : "Active",
      engineProvenance: "Engine",
    });
    await upsertCintEntity("investigations", storeId, {
      findingId: findingStoreId,
      status: inv.state,
      hypothesis: inv.hypotheses.join(" · ") || inv.question,
      evidenceIds: inv.evidenceIds ?? [],
      analysis: inv.analysis,
      conclusion: inv.conclusion,
      repositoryId: repositoryStoreId,
      repositoryName: repository,
      objectStatus: gov.status,
      objectProvenance: gov.provenance,
      objectTrust: gov.trust,
      governanceVersion: gov.governanceVersion,
    });
    investigations += 1;
  }
  for (const rem of analysis.remediations) {
    const storeId = `rem_${rem.id}`.slice(0, 120);
    const findingStoreId =
      findingIdMap.get(rem.findingId) || cintFindingStoreId(repository, rem.findingId);
    const gov = stampCintObjectGovernance({
      status: rem.status === "PROPOSED" ? "NeedsReview" : "Active",
      engineProvenance: "Engine",
      trust: "Medium",
    });
    await upsertCintEntity("remediation", storeId, {
      findingId: findingStoreId,
      proposal: rem.title,
      risk: rem.impact,
      approvalLevel: "L3",
      executionStatus: rem.status === "PROPOSED" ? "proposed" : String(rem.status).toLowerCase(),
      writesSource: false,
      diff: rem.diff,
      tests: rem.tests,
      rationale: rem.rationale,
      repositoryId: repositoryStoreId,
      repositoryName: repository,
      objectStatus: gov.status,
      objectProvenance: gov.provenance,
      objectTrust: gov.trust,
      governanceVersion: gov.governanceVersion,
    });
    remediations += 1;
  }

  const runGov = stampCintObjectGovernance({
    engineProvenance: "Engine",
    trust: "High",
  });
  await upsertCintEntity("analysis_runs", runId, {
    repositoryId: repositoryStoreId,
    repositoryName: repository,
    commitSha,
    state: input.state || "COMPLETED",
    durationMs: typeof input.durationMs === "number" ? input.durationMs : null,
    findingsCount: findings,
    evidenceCount: evidence,
    investigationsCount: investigations,
    remediationsCount: remediations,
    repository,
    objectStatus: runGov.status,
    objectProvenance: runGov.provenance,
    objectTrust: runGov.trust,
    governanceVersion: runGov.governanceVersion,
  });

  return { findings, evidence, investigations, remediations, repositoryStoreId, runId };
}

export function serializeCintAnalysisForClient(
  analysis: ReturnType<typeof analyzeCodeIntelligenceSnapshot>,
  options?: { runId?: string | null },
) {
  const deps = analysis.intelligence.dependencies;
  const kil = buildCintKilBundle(analysis, { runId: options?.runId });
  const kilClient = serializeCintKilForClient(kil);
  return {
    profile: analysis.intelligence.profile,
    tech: analysis.intelligence.tech,
    dependencies: {
      nodes: deps.nodes,
      edges: deps.edges,
      cycles: deps.cycles,
      provenance: deps.provenance,
    },
    dependencyNodeCount: deps.nodes.length,
    findings: analysis.findings.map((f) => {
      const category = f.category;
      const location = f.evidence[0]?.location ?? null;
      const gov = stampCintObjectGovernance({
        confidence: f.confidence,
        engineProvenance: f.provenance,
      });
      return {
        id: f.id,
        title: f.title,
        severity: f.severity,
        confidence: f.confidence,
        category,
        location,
        file: location,
        why: f.why,
        rec: "Review evidence. Engines never modify source.",
        security: isSecurityFindingCategory(category),
        quality: isQualityFindingCategory(category),
        area: category,
        objectStatus: gov.status,
        objectProvenance: gov.provenance,
        objectTrust: gov.trust,
        governanceVersion: gov.governanceVersion,
      };
    }),
    evidence: analysis.evidence.map((e) => {
      const gov = stampCintObjectGovernance({ engineProvenance: "Engine", trust: "Medium" });
      return {
        id: e.id,
        findingId: e.findingId,
        summary: e.summary,
        location: e.location,
        slot: e.slot,
        kind: e.kind,
        snippet: e.snippet,
        objectStatus: gov.status,
        objectProvenance: gov.provenance,
        objectTrust: gov.trust,
        governanceVersion: gov.governanceVersion,
      };
    }),
    investigations: analysis.investigations.map((i) => {
      const gov = stampCintObjectGovernance({
        status: i.state === "IN_REVIEW" ? "NeedsReview" : "Active",
        engineProvenance: "Engine",
      });
      return {
        id: i.id,
        findingId: i.findingId,
        status: i.state,
        state: i.state,
        hypothesis: i.question,
        question: i.question,
        hypotheses: i.hypotheses,
        analysis: i.analysis,
        conclusion: i.conclusion,
        evidenceIds: i.evidenceIds,
        objectStatus: gov.status,
        objectProvenance: gov.provenance,
        objectTrust: gov.trust,
        governanceVersion: gov.governanceVersion,
      };
    }),
    remediations: analysis.remediations.map((r) => {
      const gov = stampCintObjectGovernance({
        status: r.status === "PROPOSED" ? "NeedsReview" : "Active",
        engineProvenance: "Engine",
        trust: "Medium",
      });
      return {
        id: r.id,
        findingId: r.findingId,
        proposal: r.title,
        title: r.title,
        risk: r.impact,
        impact: r.impact,
        tests: r.tests,
        diff: r.diff,
        rationale: r.rationale,
        status: r.status,
        objectStatus: gov.status,
        objectProvenance: gov.provenance,
        objectTrust: gov.trust,
        governanceVersion: gov.governanceVersion,
      };
    }),
    architecture: {
      nodes: analysis.architecture.nodes,
      edges: analysis.architecture.edges,
      decisions: analysis.architecture.decisions,
      knowledge: analysis.architecture.knowledge,
      intendedVsObserved: analysis.architecture.intendedVsObserved,
      provenance: analysis.architecture.provenance,
    },
    architectureModules: analysis.architecture.nodes.length,
    objectRegistry: kilClient.registry,
    kil: kilClient,
  };
}
