/**
 * Composes Pack 02–08: profile, graph, findings, evidence, investigations,
 * remediations, architecture/knowledge.
 */

import {
  buildArchitectureKnowledge,
  type ArchitectureKnowledgeSnapshot,
} from "@/core/codeIntelligence/architectureKnowledgeEngine";
import {
  assertEvidenceCoverage,
  indexFindingEvidence,
  type EvidenceRecord,
} from "@/core/codeIntelligence/evidenceExplorer";
import { runFindingEngine, type EngineFinding } from "@/core/codeIntelligence/findingEngine";
import {
  assertInvestigationIntegrity,
  openInvestigationsFromFindings,
  type EngineInvestigation,
} from "@/core/codeIntelligence/investigationEngine";
import {
  assertRemediationIntegrity,
  proposeRemediationsFromFindings,
  type EngineRemediationPlan,
} from "@/core/codeIntelligence/remediationEngine";
import {
  analyzeRepositoryIntelligence,
  CODE_INTELLIGENCE_DEMO_TREES,
  type RepositoryIntelligence,
  type RepositoryTreeSnapshot,
} from "@/core/codeIntelligence/repositoryIntelligenceEngine";

export const CODE_INTELLIGENCE_ANALYSIS_VERSION = "CINT-EE-1.2" as const;

export const DEMO_SNAPSHOT_COMMITS: Readonly<Record<string, string>> = {
  "payments-api": "c0ffee1",
  "catalog-service": "bada55e",
};

export type CodeIntelligenceAnalysis = Readonly<{
  intelligence: RepositoryIntelligence;
  findings: readonly EngineFinding[];
  evidence: readonly EvidenceRecord[];
  investigations: readonly EngineInvestigation[];
  remediations: readonly EngineRemediationPlan[];
  architecture: ArchitectureKnowledgeSnapshot;
}>;

export function analyzeCodeIntelligenceSnapshot(tree: RepositoryTreeSnapshot): CodeIntelligenceAnalysis {
  const intelligence = analyzeRepositoryIntelligence(tree);
  const findings = runFindingEngine(tree, intelligence.dependencies);
  const evidence = indexFindingEvidence(findings, { commits: DEMO_SNAPSHOT_COMMITS, tree });
  assertEvidenceCoverage(findings, evidence);
  const investigations = openInvestigationsFromFindings(findings, evidence);
  assertInvestigationIntegrity(investigations, findings, evidence);
  const remediations = proposeRemediationsFromFindings(findings, evidence);
  assertRemediationIntegrity(remediations, findings, evidence);
  const architecture = buildArchitectureKnowledge(tree);
  return { intelligence, findings, evidence, investigations, remediations, architecture };
}

export function analyzeDemoCodeIntelligence(): Record<string, CodeIntelligenceAnalysis> {
  return Object.fromEntries(
    Object.entries(CODE_INTELLIGENCE_DEMO_TREES).map(([id, tree]) => [
      id,
      analyzeCodeIntelligenceSnapshot(tree),
    ]),
  );
}

export const CINT_SECURITY_FINDING_CATEGORIES = [
  "SECRETS",
  "AUTH",
  "ACCESS",
  "TLS",
  "SEC",
  "CONFIG",
  "SECURITY",
] as const;
export const CINT_QUALITY_FINDING_CATEGORIES = [
  "DUP",
  "COMPLEX",
  "MAINT",
  "PERF",
  "DOC",
  "DEAD",
  "LARGE",
  "QUALITY",
] as const;

const SECURITY_CATS = new Set<string>(CINT_SECURITY_FINDING_CATEGORIES);
const QUALITY_CATS = new Set<string>(CINT_QUALITY_FINDING_CATEGORIES);

export function isSecurityFindingCategory(category: string | null | undefined): boolean {
  return SECURITY_CATS.has(String(category || "").toUpperCase());
}

export function isQualityFindingCategory(category: string | null | undefined): boolean {
  return QUALITY_CATS.has(String(category || "").toUpperCase());
}

export function demoRuntimeWorkspaceSeed(): {
  profiles: Record<string, RepositoryIntelligence>;
  findings: readonly Record<string, unknown>[];
  deps: readonly Record<string, unknown>[];
  evidence: readonly Record<string, unknown>[];
  investigations: readonly Record<string, unknown>[];
  remediations: readonly Record<string, unknown>[];
  architecture: Record<string, ArchitectureKnowledgeSnapshot>;
} {
  const demo = analyzeDemoCodeIntelligence();
  const profiles: Record<string, RepositoryIntelligence> = {};
  const findings: Record<string, unknown>[] = [];
  const deps: Record<string, unknown>[] = [];
  const evidence: Record<string, unknown>[] = [];
  const investigations: Record<string, unknown>[] = [];
  const remediations: Record<string, unknown>[] = [];
  const architecture: Record<string, ArchitectureKnowledgeSnapshot> = {};
  for (const [id, analysis] of Object.entries(demo)) {
    profiles[id] = analysis.intelligence;
    architecture[id] = analysis.architecture;
    for (const node of analysis.intelligence.dependencies.nodes) {
      deps.push({
        repo: id,
        name: node.name,
        kind: node.relation,
        version: node.version,
        advisory: "none (deterministic graph — not a CVE)",
        license: "unknown",
        upgrade: "—",
      });
    }
    for (const finding of analysis.findings) {
      const location = finding.evidence[0]?.location ?? "";
      findings.push({
        id: finding.id,
        repo: id,
        title: finding.title,
        category: finding.category,
        area: finding.category,
        severity: finding.severity,
        confidence: finding.confidence,
        lifecycle: finding.lifecycle,
        file: location,
        why: finding.why,
        evidence: finding.evidence
          .map((item) => `${item.id} ${item.kind} @ ${item.location}: ${item.summary}`)
          .join(" | "),
        evidenceIds: analysis.evidence.filter((row) => row.findingId === finding.id).map((row) => row.id),
        rec: "Review evidence. Engines never modify source.",
        security: SECURITY_CATS.has(finding.category),
        quality: QUALITY_CATS.has(finding.category),
        kind: finding.kind,
      });
    }
    for (const row of analysis.evidence) {
      evidence.push({ ...row, repo: id });
    }
    for (const inv of analysis.investigations) {
      investigations.push({
        id: inv.id,
        repo: inv.repositoryId,
        findingId: inv.findingId,
        question: inv.question,
        hypotheses: inv.hypotheses,
        evidenceIds: inv.evidenceIds,
        analysis: inv.analysis,
        conclusion: inv.conclusion,
        state: inv.state,
        provenance: inv.provenance,
      });
    }
    for (const plan of analysis.remediations) {
      remediations.push({
        id: plan.id,
        repo: plan.repositoryId,
        findingId: plan.findingId,
        title: plan.title,
        impact: plan.impact,
        tests: plan.tests,
        status: plan.status,
        diff: plan.diff,
        evidenceIds: plan.evidenceIds,
        rationale: plan.rationale,
        neverWritesSource: true,
        provenance: plan.provenance,
      });
    }
  }
  return { profiles, findings, deps, evidence, investigations, remediations, architecture };
}
