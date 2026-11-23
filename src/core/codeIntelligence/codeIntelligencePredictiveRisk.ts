/**
 * cint.predictive.risk.v1 — Phase 17 Predictive Risk Engine.
 *
 * Deterministic heuristics (smells, dependency risk, version drift signals, debt).
 * Not a live ML connector. Requires Phase 16 Impact sealed.
 */

import { isCodeIntelligenceImpactAnalysisSealed } from "@/core/codeIntelligence/codeIntelligenceImpactAnalysis";
import { readCodeIntelligenceMemoryEngine } from "@/core/codeIntelligence/codeIntelligenceMemoryEngine";
import {
  analyzeChangeImpact,
  type ImpactRiskLevel,
} from "@/core/codeIntelligence/codeIntelligenceImpactAnalysis";

export const CINT_PREDICTIVE_RISK_KEY = "cint.predictive.risk.v1" as const;
export const CINT_PREDICTIVE_RISK_VERSION = "CINT-PR-1.0" as const;

export type PredictiveRiskSignal = Readonly<{
  id: string;
  title: string;
  category:
    | "code_smell"
    | "design_weakness"
    | "dependency_risk"
    | "version_drift"
    | "security_exposure"
    | "technical_debt";
  probability: number;
  reason: string;
  severity: ImpactRiskLevel;
}>;

export type CodeIntelligencePredictiveRiskAuthority = Readonly<{
  version: "cint.predictive.risk.v1";
  sealed: boolean;
  sealedAt: string | null;
  predictiveVersion: typeof CINT_PREDICTIVE_RISK_VERSION;
  inventPages: false;
  signals: readonly PredictiveRiskSignal[];
  rule: "Predictive signals are advisory — not autonomous execute authority";
  constitution: readonly string[];
}>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function evaluatePredictiveRiskSignals(input: {
  metadata?: unknown;
  paths?: readonly string[];
}): PredictiveRiskSignal[] {
  const signals: PredictiveRiskSignal[] = [];
  const paths = input.paths ?? [];
  const memory = readCodeIntelligenceMemoryEngine(input.metadata);
  const priorFailures = memory?.entries.filter((e) => e.kind === "previous_failure").length ?? 0;
  const knownIssues = memory?.entries.filter((e) => e.kind === "known_issue").length ?? 0;

  const authPaths = paths.filter((p) => /auth|session|middleware/i.test(p));
  if (authPaths.length > 0 || priorFailures > 0) {
    const probability = Math.min(95, 55 + authPaths.length * 8 + priorFailures * 10);
    signals.push({
      id: "PRED-AUTH-1",
      title: "Potential Authentication Failure",
      category: "security_exposure",
      probability,
      reason:
        priorFailures > 0
          ? "Historical pattern detected in repository memory"
          : "Auth/session surface present without verified recovery rehearsal",
      severity: probability >= 80 ? "HIGH" : "MEDIUM",
    });
  }

  if (paths.some((p) => /package-lock|yarn.lock|pnpm-lock/i.test(p))) {
    signals.push({
      id: "PRED-DEP-1",
      title: "Dependency / version drift exposure",
      category: "version_drift",
      probability: 62,
      reason: "Lockfile present — drift checks required before mutate",
      severity: "MEDIUM",
    });
  }

  if (knownIssues >= 2) {
    signals.push({
      id: "PRED-DEBT-1",
      title: "Technical debt concentration",
      category: "technical_debt",
      probability: Math.min(90, 50 + knownIssues * 12),
      reason: `${knownIssues} known issues retained in memory`,
      severity: knownIssues >= 4 ? "HIGH" : "MEDIUM",
    });
  }

  if (paths.length >= 15) {
    const impact = analyzeChangeImpact({ files: paths });
    signals.push({
      id: "PRED-DESIGN-1",
      title: "Wide blast-radius change set",
      category: "design_weakness",
      probability: impact.riskLevel === "CRITICAL" ? 88 : 70,
      reason: impact.rationale,
      severity: impact.riskLevel,
    });
  }

  if (signals.length === 0) {
    signals.push({
      id: "PRED-BASE-1",
      title: "Baseline residual engineering risk",
      category: "code_smell",
      probability: 28,
      reason: "No elevated historical or auth signals — residual risk remains",
      severity: "LOW",
    });
  }

  return signals;
}

export function buildCodeIntelligencePredictiveRiskAuthority(options?: {
  sealed?: boolean;
  metadata?: unknown;
  paths?: readonly string[];
}): CodeIntelligencePredictiveRiskAuthority {
  const sealed = options?.sealed === true;
  return {
    version: "cint.predictive.risk.v1",
    sealed,
    sealedAt: sealed ? new Date().toISOString() : null,
    predictiveVersion: CINT_PREDICTIVE_RISK_VERSION,
    inventPages: false,
    signals: evaluatePredictiveRiskSignals({
      metadata: options?.metadata,
      paths: options?.paths,
    }),
    rule: "Predictive signals are advisory — not autonomous execute authority",
    constitution: [
      "Phase 17 — Predictive Risk after Impact (Phase 16)",
      "Deterministic heuristics only — no live ML connector",
      "Connector freeze remains ON",
      "inventPages=false",
    ],
  };
}

export function sealCodeIntelligencePredictiveRisk(
  metadata: unknown,
  options?: { paths?: readonly string[] },
): {
  metadata: Record<string, unknown>;
  predictive: CodeIntelligencePredictiveRiskAuthority;
  blockedReason?: string;
} {
  const base = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  if (!isCodeIntelligenceImpactAnalysisSealed(base)) {
    return {
      metadata: base,
      predictive: buildCodeIntelligencePredictiveRiskAuthority({ sealed: false }),
      blockedReason: "Phase 16 Impact Analysis must be sealed before Phase 17 Predictive Risk.",
    };
  }
  const predictive = buildCodeIntelligencePredictiveRiskAuthority({
    sealed: true,
    metadata: base,
    paths: options?.paths,
  });
  base[CINT_PREDICTIVE_RISK_KEY] = predictive;
  return { metadata: base, predictive };
}

export function readCodeIntelligencePredictiveRisk(
  metadata?: unknown,
): CodeIntelligencePredictiveRiskAuthority | null {
  const block = asRecord(asRecord(metadata)?.[CINT_PREDICTIVE_RISK_KEY]);
  if (!block || block.version !== "cint.predictive.risk.v1") return null;
  return block as CodeIntelligencePredictiveRiskAuthority;
}

export function isCodeIntelligencePredictiveRiskSealed(metadata?: unknown): boolean {
  const p = readCodeIntelligencePredictiveRisk(metadata);
  return Boolean(p?.sealed && p.sealedAt);
}

export function detectCodeIntelligencePredictiveRiskSealIntent(text: string): boolean {
  const t = text.toLowerCase();
  return (
    /\bphase\s*17\b/.test(t) ||
    /\bpredictive risk\b/.test(t) ||
    /\bcint\.predictive\.risk\.v1\b/.test(t) ||
    /\bseal\b.{0,20}\bpredictive\b/.test(t)
  );
}

export function formatCodeIntelligencePredictiveRiskSummaryLines(
  predictive: CodeIntelligencePredictiveRiskAuthority,
): string[] {
  const top = predictive.signals[0];
  return [
    `${predictive.sealed ? "✓" : "○"} Predictive Risk ${predictive.predictiveVersion} (${CINT_PREDICTIVE_RISK_KEY})`,
    top
      ? `○ Top: ${top.title} · Probability ${top.probability}% · ${top.severity}`
      : "○ No signals",
    `○ Signals: ${predictive.signals.length} · Rule: ${predictive.rule}`,
  ];
}
