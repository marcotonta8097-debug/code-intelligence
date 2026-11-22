/**
 * cint.impact.analysis.v1 — Phase 16 Change Impact Analysis.
 *
 * Understand consequences before changes. Requires Phase 15 Memory sealed.
 * Does not execute repairs. Feeds L3 prepare / human review.
 */

import { isCodeIntelligenceMemoryEngineSealed } from "@/core/codeIntelligence/codeIntelligenceMemoryEngine";

export const CINT_IMPACT_ANALYSIS_KEY = "cint.impact.analysis.v1" as const;
export const CINT_IMPACT_ANALYSIS_VERSION = "CINT-IA-1.0" as const;

export type ImpactRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ImpactAnalysisInput = Readonly<{
  files?: readonly string[];
  services?: readonly string[];
  apis?: readonly string[];
  databases?: readonly string[];
}>;

export type ImpactAnalysisReport = Readonly<{
  filesAffected: number;
  servicesAffected: number;
  apisAffected: number;
  databasesAffected: number;
  riskLevel: ImpactRiskLevel;
  rationale: string;
  paths: readonly string[];
}>;

export type CodeIntelligenceImpactAnalysisAuthority = Readonly<{
  version: "cint.impact.analysis.v1";
  sealed: boolean;
  sealedAt: string | null;
  impactVersion: typeof CINT_IMPACT_ANALYSIS_VERSION;
  inventPages: false;
  lastReport: ImpactAnalysisReport | null;
  rule: "Impact is prepare-only — execution still requires L4/L5 + recovery point";
  constitution: readonly string[];
}>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function analyzeChangeImpact(input: ImpactAnalysisInput): ImpactAnalysisReport {
  const files = input.files ?? [];
  const services = input.services ?? [];
  const apis = input.apis ?? [];
  const databases = input.databases ?? [];
  const score =
    files.length + services.length * 3 + apis.length * 4 + databases.length * 6;
  let riskLevel: ImpactRiskLevel = "LOW";
  if (score >= 40 || databases.length >= 2) riskLevel = "CRITICAL";
  else if (score >= 20 || databases.length >= 1 || apis.length >= 3) riskLevel = "HIGH";
  else if (score >= 8 || services.length >= 2 || apis.length >= 1) riskLevel = "MEDIUM";
  return {
    filesAffected: files.length,
    servicesAffected: services.length,
    apisAffected: apis.length,
    databasesAffected: databases.length,
    riskLevel,
    rationale: `Change affects ${files.length} files, ${services.length} services, ${apis.length} APIs, ${databases.length} databases`,
    paths: [...files, ...services, ...apis, ...databases],
  };
}

export function buildCodeIntelligenceImpactAnalysisAuthority(options?: {
  sealed?: boolean;
  lastReport?: ImpactAnalysisReport | null;
}): CodeIntelligenceImpactAnalysisAuthority {
  const sealed = options?.sealed === true;
  return {
    version: "cint.impact.analysis.v1",
    sealed,
    sealedAt: sealed ? new Date().toISOString() : null,
    impactVersion: CINT_IMPACT_ANALYSIS_VERSION,
    inventPages: false,
    lastReport: options?.lastReport ?? null,
    rule: "Impact is prepare-only — execution still requires L4/L5 + recovery point",
    constitution: [
      "Phase 16 — Change Impact after Memory (Phase 15)",
      "Does not mutate source",
      "Connector freeze remains ON",
      "inventPages=false",
    ],
  };
}

export function sealCodeIntelligenceImpactAnalysis(metadata: unknown): {
  metadata: Record<string, unknown>;
  impact: CodeIntelligenceImpactAnalysisAuthority;
  blockedReason?: string;
} {
  const base = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  if (!isCodeIntelligenceMemoryEngineSealed(base)) {
    return {
      metadata: base,
      impact: buildCodeIntelligenceImpactAnalysisAuthority({ sealed: false }),
      blockedReason: "Phase 15 Memory Engine must be sealed before Phase 16 Impact Analysis.",
    };
  }
  const existing = readCodeIntelligenceImpactAnalysis(base);
  const impact = buildCodeIntelligenceImpactAnalysisAuthority({
    sealed: true,
    lastReport: existing?.lastReport,
  });
  base[CINT_IMPACT_ANALYSIS_KEY] = impact;
  return { metadata: base, impact };
}

export function persistImpactAnalysisReport(
  metadata: unknown,
  report: ImpactAnalysisReport,
): Record<string, unknown> {
  const existing = readCodeIntelligenceImpactAnalysis(metadata);
  const base = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  if (!existing?.sealed) return base;
  base[CINT_IMPACT_ANALYSIS_KEY] = { ...existing, lastReport: report };
  return base;
}

export function readCodeIntelligenceImpactAnalysis(
  metadata?: unknown,
): CodeIntelligenceImpactAnalysisAuthority | null {
  const block = asRecord(asRecord(metadata)?.[CINT_IMPACT_ANALYSIS_KEY]);
  if (!block || block.version !== "cint.impact.analysis.v1") return null;
  return block as CodeIntelligenceImpactAnalysisAuthority;
}

export function isCodeIntelligenceImpactAnalysisSealed(metadata?: unknown): boolean {
  const i = readCodeIntelligenceImpactAnalysis(metadata);
  return Boolean(i?.sealed && i.sealedAt);
}

export function detectCodeIntelligenceImpactAnalysisSealIntent(text: string): boolean {
  const t = text.toLowerCase();
  return (
    /\bphase\s*16\b/.test(t) ||
    /\bimpact analysis\b/.test(t) ||
    /\bchange impact\b/.test(t) ||
    /\bcint\.impact\.analysis\.v1\b/.test(t)
  );
}

export function formatCodeIntelligenceImpactAnalysisSummaryLines(
  impact: CodeIntelligenceImpactAnalysisAuthority,
): string[] {
  const last = impact.lastReport;
  return [
    `${impact.sealed ? "✓" : "○"} Impact Analysis ${impact.impactVersion} (${CINT_IMPACT_ANALYSIS_KEY})`,
    last
      ? `○ Last risk: ${last.riskLevel} — ${last.rationale}`
      : "○ No impact report recorded yet (prepare-only)",
    `○ Rule: ${impact.rule}`,
  ];
}
