/**
 * cint.workflow.v1 — Phase 5 Workflow Authority (Code Intelligence).
 *
 * Seals pack workflows + lifecycle states under registry domains.
 * No foreign workflow invent. Repair freeze stays ON until explicit unlock.
 */

import { isCodeIntelligenceEntitySealed } from "@/core/codeIntelligence/codeIntelligenceEntityAuthority";
import {
  CINT_REGISTRY_DOMAIN_SLICES,
  type CodeIntelligenceRegistryDomainId,
} from "@/core/codeIntelligence/codeIntelligenceRegistryAuthority";
import { CODE_INTELLIGENCE_DOMAIN_PACK } from "@/core/domainPack/codeIntelligenceDomainPack";
import {
  CODE_INTELLIGENCE_REQUIRED_WORKFLOWS,
  FOREIGN_WORKFLOW_LABELS,
  FOREIGN_WORKFLOW_STATES,
} from "@/core/domainPack/registryAuthority";
import {
  ANALYSIS_RUN_LIFECYCLE_VALUES,
  FINDING_LIFECYCLE_VALUES,
  INVESTIGATION_LIFECYCLE_VALUES,
  REMEDIATION_LIFECYCLE_VALUES,
} from "@/core/domainPack/taxonomyRegistry";

export const CINT_WORKFLOW_KEY = "cint.workflow.v1" as const;

export type CodeIntelligenceWorkflowRecord = Readonly<{
  key: string;
  label: string;
  hostPage: string;
  states: readonly string[];
  authorityDomain: CodeIntelligenceRegistryDomainId | "Supporting";
  sourceEvents: readonly string[];
}>;

export type CodeIntelligenceWorkflowAuthority = Readonly<{
  version: "cint.workflow.v1";
  sealed: boolean;
  sealedAt: string | null;
  fieldRegistryId: "field:code_intelligence";
  requiresEntitySealed: true;
  workflows: readonly CodeIntelligenceWorkflowRecord[];
  requiredCore: readonly string[];
  forbiddenWorkflowInvent: readonly string[];
  forbiddenStates: readonly string[];
  canonicalStates: Readonly<{
    Finding: readonly string[];
    Investigation: readonly string[];
    Remediation: readonly string[];
    Analysis: readonly string[];
  }>;
  coverageOk: boolean;
  constitution: readonly string[];
}>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function resolveAuthorityDomain(label: string): CodeIntelligenceRegistryDomainId | "Supporting" {
  for (const slice of CINT_REGISTRY_DOMAIN_SLICES) {
    if (slice.workflows.includes(label)) return slice.id;
  }
  // Host-page fallback for primary four.
  if (label === "Finding" || label === "Investigation" || label === "Analysis") {
    return label === "Finding"
      ? "Finding Authority"
      : label === "Investigation"
        ? "Investigation Authority"
        : "Analysis Authority";
  }
  if (label === "Remediation") return "Remediation Authority";
  return "Supporting";
}

export function buildCodeIntelligenceWorkflowAuthority(options?: {
  sealed?: boolean;
}): CodeIntelligenceWorkflowAuthority {
  const sealed = options?.sealed === true;
  const pack = CODE_INTELLIGENCE_DOMAIN_PACK;
  const workflows: CodeIntelligenceWorkflowRecord[] = pack.workflows.map((workflow) => ({
    key: workflow.key,
    label: workflow.label,
    hostPage: workflow.hostPage?.trim() || workflow.label,
    states: [...workflow.states],
    authorityDomain: resolveAuthorityDomain(workflow.label),
    sourceEvents: pack.events
      .filter((event) => event.sourceWorkflow === workflow.key)
      .map((event) => event.label),
  }));

  const owned = new Set(workflows.map((w) => w.label));
  const missingRequired = CODE_INTELLIGENCE_REQUIRED_WORKFLOWS.filter((label) => !owned.has(label));
  const hostOk = workflows.every((w) => Boolean(w.hostPage?.trim()));
  const statesOk = workflows.every((w) => w.states.length > 0);
  const coverageOk = missingRequired.length === 0 && hostOk && statesOk && workflows.length >= 4;

  return {
    version: "cint.workflow.v1",
    sealed,
    sealedAt: sealed ? new Date().toISOString() : null,
    fieldRegistryId: "field:code_intelligence",
    requiresEntitySealed: true,
    workflows,
    requiredCore: [...CODE_INTELLIGENCE_REQUIRED_WORKFLOWS],
    forbiddenWorkflowInvent: [...FOREIGN_WORKFLOW_LABELS],
    forbiddenStates: [...FOREIGN_WORKFLOW_STATES],
    canonicalStates: {
      Finding: [...FINDING_LIFECYCLE_VALUES],
      Investigation: [...INVESTIGATION_LIFECYCLE_VALUES],
      Remediation: [...REMEDIATION_LIFECYCLE_VALUES],
      Analysis: [...ANALYSIS_RUN_LIFECYCLE_VALUES],
    },
    coverageOk,
    constitution: [
      "Four core workflows only: Finding · Investigation · Remediation · Analysis.",
      "Lifecycle states are taxonomy-sealed — no SHIPPED/PAID/DELIVERED invent.",
      "Investigation hosts on Findings — no Investigations PAGE invent.",
      "Workflows reference sealed entities only (Phase 4).",
      "Repair freeze remains ON until explicit unlock after Phase 5 seal.",
    ],
  };
}

export function persistCodeIntelligenceWorkflowDraft(
  metadata: unknown,
): { metadata: Record<string, unknown>; workflow: CodeIntelligenceWorkflowAuthority } {
  const base = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  const workflow = buildCodeIntelligenceWorkflowAuthority({ sealed: false });
  base[CINT_WORKFLOW_KEY] = workflow;
  return { metadata: base, workflow };
}

export function sealCodeIntelligenceWorkflow(
  metadata: unknown,
): {
  metadata: Record<string, unknown>;
  workflow: CodeIntelligenceWorkflowAuthority;
  ok: boolean;
  reason: string;
} {
  const base = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  if (!isCodeIntelligenceEntitySealed(base)) {
    const workflow = buildCodeIntelligenceWorkflowAuthority({ sealed: false });
    base[CINT_WORKFLOW_KEY] = workflow;
    return {
      metadata: base,
      workflow,
      ok: false,
      reason: "seal_refused_entity_not_sealed",
    };
  }
  const workflow = buildCodeIntelligenceWorkflowAuthority({ sealed: true });
  if (!workflow.coverageOk) {
    const draft = { ...workflow, sealed: false, sealedAt: null };
    base[CINT_WORKFLOW_KEY] = draft;
    return {
      metadata: base,
      workflow: draft,
      ok: false,
      reason: "seal_refused_workflow_coverage_incomplete",
    };
  }
  base[CINT_WORKFLOW_KEY] = workflow;
  return { metadata: base, workflow, ok: true, reason: "workflow_authority_sealed" };
}

export function readCodeIntelligenceWorkflow(
  metadata?: unknown,
): CodeIntelligenceWorkflowAuthority | null {
  const block = asRecord(asRecord(metadata)?.[CINT_WORKFLOW_KEY]);
  if (!block || block.version !== "cint.workflow.v1") return null;
  return block as CodeIntelligenceWorkflowAuthority;
}

export function isCodeIntelligenceWorkflowSealed(metadata?: unknown): boolean {
  return readCodeIntelligenceWorkflow(metadata)?.sealed === true;
}

export function detectCodeIntelligenceWorkflowSealIntent(
  userPrompt?: string | null,
): boolean {
  const text = String(userPrompt || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return false;
  return (
    /\bseal\b.{0,40}\bworkflow\b/.test(text) ||
    /\bworkflow\b.{0,40}\bseal\b/.test(text) ||
    /\baccept\b.{0,40}\bworkflow\b/.test(text) ||
    /\bphase\s*5\b/.test(text) ||
    /\bworkflow\s+authority\b/.test(text) ||
    /\bcint\.workflow\.v1\b/.test(text) ||
    /\bstart\b.{0,40}\b(next\s+phases?|phase\s*5|workflow)\b/.test(text)
  );
}

/** "start next phases" advances entity then workflow when priors are sealed. */
export function detectCodeIntelligencePhases45SealIntent(
  userPrompt?: string | null,
): boolean {
  const text = String(userPrompt || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return false;
  return (
    /\bstart\b.{0,40}\bnext\s+phases?\b/.test(text) ||
    /\bphase\s*4\b.{0,20}\band\b.{0,20}\bphase\s*5\b/.test(text) ||
    /\bphases?\s*4\s*(and|&|\/|-)?\s*5\b/.test(text)
  );
}

export function formatCodeIntelligenceWorkflowSummaryLines(
  workflow: CodeIntelligenceWorkflowAuthority,
): string[] {
  return [
    `○ CI Workflow — ${workflow.workflows.length} lifecycles · required core ${workflow.requiredCore.length}`,
    workflow.sealed
      ? `✓ cint.workflow.v1 SEALED${workflow.sealedAt ? ` at ${workflow.sealedAt}` : ""}`
      : "○ cint.workflow.v1 not sealed",
    workflow.coverageOk
      ? "✓ Workflow coverage PASS — Finding/Investigation/Remediation/Analysis present"
      : "✕ Workflow coverage gaps",
    workflow.sealed
      ? "○ Foundations complete through Phase 5 — repair freeze still ON until explicit unlock"
      : "○ Repair freeze remains ON — seal workflow after entity",
  ];
}
