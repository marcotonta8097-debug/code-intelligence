/**
 * Pack 07 — Remediation Engine.
 * Proposes fix plans from findings + evidence only. Never writes source.
 * Snapshot / demo-only — no live GitHub, PR open, or model invent.
 */

import type { EvidenceRecord } from "@/core/codeIntelligence/evidenceExplorer";
import type { EngineFinding } from "@/core/codeIntelligence/findingEngine";
import { buildRemediationId } from "@/core/codeIntelligence/codeIntelligenceObjectIdentity";
import { REMEDIATION_LIFECYCLE_VALUES } from "@/core/domainPack/taxonomyRegistry";

export const REMEDIATION_ENGINE_VERSION = "CINT-RE-1.0" as const;

export type RemediationLifecycle = (typeof REMEDIATION_LIFECYCLE_VALUES)[number];

export type EngineRemediationPlan = Readonly<{
  id: string;
  repositoryId: string;
  findingId: string;
  title: string;
  impact: string;
  tests: string;
  status: RemediationLifecycle;
  diff: string;
  evidenceIds: readonly string[];
  rationale: string;
  neverWritesSource: true;
  provenance: "deterministic_scan";
}>;

export class RemediationFindingMissingError extends Error {
  readonly code = "REMEDIATION_FINDING_MISSING" as const;
  constructor(readonly planId: string) {
    super(`REMEDIATION_FINDING_MISSING: ${planId}`);
    this.name = "RemediationFindingMissingError";
  }
}

export class RemediationEvidenceMissingError extends Error {
  readonly code = "REMEDIATION_EVIDENCE_MISSING" as const;
  constructor(readonly planId: string) {
    super(`REMEDIATION_EVIDENCE_MISSING: ${planId}`);
    this.name = "RemediationEvidenceMissingError";
  }
}

function proposalFor(finding: EngineFinding, evidence: readonly EvidenceRecord[]): {
  title: string;
  impact: string;
  tests: string;
  diff: string;
  rationale: string;
} {
  const location = evidence[0]?.location || finding.evidence[0]?.location || "unknown";
  const snippet = evidence[0]?.snippet || finding.evidence[0]?.snippet || "";
  if (finding.kind === "configuration_risks" || finding.category === "SECRETS") {
    return {
      title: `Remove hardcoded secret material from ${location}`,
      impact: "Auth / config restart; rotate leaked credentials",
      tests: "config load test · secret scanner smoke",
      diff: `- ${snippet.split("\n")[0] || "secret: hardcoded"}\n+ ${location.includes("yaml") || location.includes("yml") ? "value: ${ENV_SECRET}" : "value := os.Getenv(\"SECRET\")"}`,
      rationale: finding.why,
    };
  }
  if (finding.category === "AUTH" || finding.category === "ACCESS") {
    return {
      title: `Harden auth flags in ${location}`,
      impact: "Session cookie / auth middleware behavior",
      tests: "auth middleware integration test",
      diff: `- ${snippet.split("\n")[0] || "Secure: false"}\n+ Secure: true\n+ HttpOnly: true`,
      rationale: finding.why,
    };
  }
  if (finding.kind === "unused_dependencies" || finding.category === "DEPS") {
    return {
      title: `Drop unused dependency cited by ${finding.id}`,
      impact: "Lockfile + install size",
      tests: "dependency graph smoke · build",
      diff: `- "${finding.title.replace(/^Unused dependency /, "")}"\n+ (removed — never auto-applied)`,
      rationale: finding.why,
    };
  }
  if (finding.kind === "duplicate_logic" || finding.category === "DUP") {
    return {
      title: `Consolidate duplicate logic for ${finding.id}`,
      impact: "Shared module extraction",
      tests: "unit tests for extracted helper",
      diff: `- duplicate blocks @ ${location}\n+ shared helper (proposal only)`,
      rationale: finding.why,
    };
  }
  if (finding.kind === "missing_documentation" || finding.category === "DOC") {
    return {
      title: `Add documentation asset for ${finding.repositoryId}`,
      impact: "Docs freshness only — no source mutation",
      tests: "doc freshness check",
      diff: `+ README / runbook section for ${finding.repositoryId}`,
      rationale: finding.why,
    };
  }
  return {
    title: `Address ${finding.title}`,
    impact: "Review-only proposal — no source write",
    tests: "manual evidence review",
    diff: `// Proposal for ${finding.id} @ ${location}\n// Engines never modify source.`,
    rationale: finding.why,
  };
}

/**
 * Propose remediation plans for SEV-0/1/2 findings that have evidence.
 * Never invents plans without finding + evidence. Never writes source.
 */
export function proposeRemediationsFromFindings(
  findings: readonly EngineFinding[],
  evidence: readonly EvidenceRecord[] = [],
): EngineRemediationPlan[] {
  const out: EngineRemediationPlan[] = [];
  const ranked = [...findings].sort((a, b) => {
    const rank = (sev: string) =>
      sev === "SEV-0" ? 0 : sev === "SEV-1" ? 1 : sev === "SEV-2" ? 2 : 3;
    return rank(a.severity) - rank(b.severity);
  });
  for (const finding of ranked) {
    if (!["SEV-0", "SEV-1", "SEV-2"].includes(finding.severity)) continue;
    const linked = evidence.filter((row) => row.findingId === finding.id);
    const fallback = linked.length > 0 ? linked : finding.evidence.map((item) => ({
      id: item.id,
      findingId: finding.id,
      repositoryId: finding.repositoryId,
      kind: item.kind,
      slot: "code_snippets" as const,
      summary: item.summary,
      location: item.location,
      snippet: item.snippet,
      provenance: "deterministic_scan" as const,
    }));
    if (fallback.length === 0) continue;
    const proposal = proposalFor(finding, fallback);
    const id = buildRemediationId(finding.id);
    out.push({
      id,
      repositoryId: finding.repositoryId,
      findingId: finding.id,
      title: proposal.title,
      impact: proposal.impact,
      tests: proposal.tests,
      status: "PROPOSED",
      diff: proposal.diff,
      evidenceIds: fallback.map((item) => item.id),
      rationale: proposal.rationale,
      neverWritesSource: true,
      provenance: "deterministic_scan",
    });
  }
  return out;
}

export function assertRemediationIntegrity(
  plans: readonly EngineRemediationPlan[],
  findings: readonly EngineFinding[],
  evidence: readonly EvidenceRecord[],
): void {
  const findingIds = new Set(findings.map((f) => f.id));
  const evidenceById = new Map(evidence.map((e) => [e.id, e]));
  for (const plan of plans) {
    if (!findingIds.has(plan.findingId)) {
      throw new RemediationFindingMissingError(plan.id);
    }
    if (plan.evidenceIds.length === 0) {
      throw new RemediationEvidenceMissingError(plan.id);
    }
    for (const evidenceId of plan.evidenceIds) {
      const record = evidenceById.get(evidenceId);
      if (!record && !findings.some((f) => f.evidence.some((e) => e.id === evidenceId))) {
        throw new RemediationEvidenceMissingError(plan.id);
      }
    }
    if (plan.neverWritesSource !== true) {
      throw new Error(`REMEDIATION_MUST_NEVER_WRITE_SOURCE: ${plan.id}`);
    }
  }
}
