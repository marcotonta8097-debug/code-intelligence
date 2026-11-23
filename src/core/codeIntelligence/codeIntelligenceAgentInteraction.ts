/**
 * cint.agents.interaction.v1 — Phase 22 Agent Interaction.
 *
 * Enables L1–L3 interactive passes through the sealed agent runtime.
 * Does not lift connector freeze. Does not enable Remediation Engineer writes.
 */

import {
  isCodeIntelligenceAgentRuntimeSealed,
  runCodeIntelligenceLiveAgentPass,
  type AgentDispatchResult,
} from "@/core/codeIntelligence/codeIntelligenceAgentRuntime";
import type { CodeIntelligenceAnalysis } from "@/core/codeIntelligence/codeIntelligenceAnalysis";
import type { RepositoryTreeSnapshot } from "@/core/codeIntelligence/repositoryIntelligenceEngine";

export const CINT_AGENTS_INTERACTION_KEY = "cint.agents.interaction.v1" as const;
export const CINT_AGENTS_INTERACTION_VERSION = "CINT-AINT-1.0" as const;

export type CodeIntelligenceAgentInteractionAuthority = Readonly<{
  version: "cint.agents.interaction.v1";
  sealed: boolean;
  sealedAt: string | null;
  interactionVersion: typeof CINT_AGENTS_INTERACTION_VERSION;
  inventPages: false;
  allowedLevels: readonly ["L1", "L2", "L3"];
  forbiddenLevelsUntilConnector: readonly ["L4", "L5"];
  lastPassSummary: string | null;
  rule: "Interaction enables observe/analyse/prepare only — execute waits for connectors + human L4/L5";
  constitution: readonly string[];
}>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function buildCodeIntelligenceAgentInteractionAuthority(options?: {
  sealed?: boolean;
  lastPassSummary?: string | null;
}): CodeIntelligenceAgentInteractionAuthority {
  const sealed = options?.sealed === true;
  return {
    version: "cint.agents.interaction.v1",
    sealed,
    sealedAt: sealed ? new Date().toISOString() : null,
    interactionVersion: CINT_AGENTS_INTERACTION_VERSION,
    inventPages: false,
    allowedLevels: ["L1", "L2", "L3"],
    forbiddenLevelsUntilConnector: ["L4", "L5"],
    lastPassSummary: options?.lastPassSummary ?? null,
    rule: "Interaction enables observe/analyse/prepare only — execute waits for connectors + human L4/L5",
    constitution: [
      "Phase 22 — Agent Interaction after Live Agent Runtime (Phase 21)",
      "Uses cint.agents.runtime.v1 dispatch — no parallel interaction engine",
      "Connector freeze remains ON",
      "inventPages=false",
    ],
  };
}

export function sealCodeIntelligenceAgentInteraction(metadata: unknown): {
  metadata: Record<string, unknown>;
  interaction: CodeIntelligenceAgentInteractionAuthority;
  blockedReason?: string;
} {
  const base = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  if (!isCodeIntelligenceAgentRuntimeSealed(base)) {
    return {
      metadata: base,
      interaction: buildCodeIntelligenceAgentInteractionAuthority({ sealed: false }),
      blockedReason: "Phase 21 Agent Runtime must be sealed before Phase 22 Interaction.",
    };
  }
  const interaction = buildCodeIntelligenceAgentInteractionAuthority({ sealed: true });
  base[CINT_AGENTS_INTERACTION_KEY] = interaction;
  return { metadata: base, interaction };
}

export function readCodeIntelligenceAgentInteraction(
  metadata?: unknown,
): CodeIntelligenceAgentInteractionAuthority | null {
  const block = asRecord(asRecord(metadata)?.[CINT_AGENTS_INTERACTION_KEY]);
  if (!block || block.version !== "cint.agents.interaction.v1") return null;
  return block as CodeIntelligenceAgentInteractionAuthority;
}

export function isCodeIntelligenceAgentInteractionSealed(metadata?: unknown): boolean {
  const i = readCodeIntelligenceAgentInteraction(metadata);
  return Boolean(i?.sealed && i.sealedAt);
}

export function detectCodeIntelligenceAgentInteractionSealIntent(text: string): boolean {
  const t = text.toLowerCase();
  return (
    /\bphase\s*22\b/.test(t) ||
    /\bagent interaction\b/.test(t) ||
    /\binteraction phase\b/.test(t) ||
    /\bcint\.agents\.interaction\.v1\b/.test(t) ||
    /\benable\b.{0,20}\binteraction\b/.test(t)
  );
}

export function runCodeIntelligenceInteractivePass(input: {
  metadata?: unknown;
  tree?: RepositoryTreeSnapshot;
}): {
  metadata: Record<string, unknown>;
  results: readonly AgentDispatchResult[];
  analysis: CodeIntelligenceAnalysis | null;
  blockedReason?: string;
} {
  if (!isCodeIntelligenceAgentInteractionSealed(input.metadata)) {
    return {
      metadata: asRecord(input.metadata) ? { ...asRecord(input.metadata)! } : {},
      results: [],
      analysis: null,
      blockedReason: "Agent Interaction not sealed",
    };
  }
  const pass = runCodeIntelligenceLiveAgentPass(input);
  if (pass.blockedReason) return pass;
  const ok = pass.results.filter((r) => r.ok).length;
  const blocked = pass.results.length - ok;
  const summary = `Interactive pass: ${ok} ok · ${blocked} blocked (L4/L5 deferred)`;
  const existing = readCodeIntelligenceAgentInteraction(pass.metadata)!;
  const next: CodeIntelligenceAgentInteractionAuthority = {
    ...existing,
    lastPassSummary: summary,
  };
  const base = { ...pass.metadata, [CINT_AGENTS_INTERACTION_KEY]: next };
  return { ...pass, metadata: base };
}

export function formatCodeIntelligenceAgentInteractionSummaryLines(
  interaction: CodeIntelligenceAgentInteractionAuthority,
): string[] {
  return [
    `${interaction.sealed ? "✓" : "○"} Agent Interaction ${interaction.interactionVersion} (${CINT_AGENTS_INTERACTION_KEY})`,
    `○ Allowed: ${interaction.allowedLevels.join(" · ")} · Forbidden until connectors: ${interaction.forbiddenLevelsUntilConnector.join(" · ")}`,
    interaction.lastPassSummary
      ? `○ ${interaction.lastPassSummary}`
      : "○ No interactive pass recorded yet",
  ];
}
