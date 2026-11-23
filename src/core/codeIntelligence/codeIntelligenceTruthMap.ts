/**
 * Phase 1 — Project Truth Map (Code Intelligence).
 * Export-only: navigation, frozen contract, preview panels, sealed pack authority.
 * Verification layers: Navigation · Contract · Route · Alias.
 * No HTML mutation. No FPT invent. Architecture-first rebase before repairs.
 */

import { normalizePageKey } from "@/lib/audit/blueprintPageTruth";
import {
  CODE_INTELLIGENCE_DOMAIN_PACK,
  CODE_INTELLIGENCE_PAGE_LABELS,
} from "@/core/domainPack/codeIntelligenceDomainPack";
import { CODE_INTELLIGENCE_NAV_GROUPS } from "@/lib/ai/generation/codeIntelligencePanels";
import type { FrozenProjectTruth } from "@/core/truth/frozenProjectTruthTypes";
import { readFrozenPageContract } from "@/core/truth/frozenProjectTruthGuard";
import { isCodeIntelligenceRepairTarget } from "@/lib/ai/generation/codeIntelligenceRepairHeal";
import {
  isCodeIntelligenceIdentitySealed,
  sealCodeIntelligenceIdentity,
} from "@/core/codeIntelligence/codeIntelligenceIdentityConstitution";
import {
  isCodeIntelligenceRegistrySealed,
  sealCodeIntelligenceRegistry,
} from "@/core/codeIntelligence/codeIntelligenceRegistryAuthority";
import {
  isCodeIntelligenceEntitySealed,
  sealCodeIntelligenceEntity,
} from "@/core/codeIntelligence/codeIntelligenceEntityAuthority";
import {
  isCodeIntelligenceWorkflowSealed,
  sealCodeIntelligenceWorkflow,
} from "@/core/codeIntelligence/codeIntelligenceWorkflowAuthority";
import {
  isCodeIntelligenceIntegrationSealed,
  sealCodeIntelligenceIntegration,
} from "@/core/codeIntelligence/codeIntelligenceIntegrationAuthority";

export const CINT_TRUTH_REBASE_KEY = "cint.truthRebase.v1" as const;
export const CINT_TRUTH_MAP_KEY = "cint.truthMap.v1" as const;

export type CodeIntelligenceRebasePhase =
  | "phase_1_truth_map"
  | "phase_2_identity"
  | "phase_3_registry"
  | "phase_4_entity"
  | "phase_5_workflow"
  | "phase_6_integration";

/**
 * CREATE/FREEZE Truth Map floor only (≤12). Repair expansion pages are optional catalog —
 * promoted later via Unlock + Advanced Repair, not baked into first freeze.
 */
export const CINT_TRUTH_MAP_REQUIRED_PAGES = [
  "Landing",
  "Login",
  "Signup",
  "Forgot Password",
  "Overview",
  "Repositories",
  "Findings",
  "Settings",
] as const;

export type ContractPageStatus = "present" | "missing" | "duplicate" | "orphan";

export type CodeIntelligenceTruthRebaseState = Readonly<{
  frozen: boolean;
  phase: CodeIntelligenceRebasePhase;
  lockedAt: string | null;
  unlockedAt: string | null;
  acceptedAt: string | null;
  identitySealedAt: string | null;
  registrySealedAt: string | null;
  entitySealedAt: string | null;
  workflowSealedAt: string | null;
  integrationSealedAt: string | null;
  reason: string | null;
}>;

export type CodeIntelligencePageContractRow = Readonly<{
  page: string;
  key: string;
  status: ContractPageStatus;
  inContract: boolean;
  contractCount: number;
}>;

export type CodeIntelligenceRouteChainRow = Readonly<{
  page: string;
  key: string;
  hasNavigation: boolean;
  hasRoute: boolean;
  hasPanel: boolean;
  chainOk: boolean;
}>;

export type CodeIntelligenceTruthMap = Readonly<{
  generatedAt: string;
  product: {
    fieldRegistryId: "field:code_intelligence";
    title: string;
    familyHint: "Engineering Intelligence";
    category: "code_intelligence";
    productType: "Code Intelligence Platform";
    commandCentre: "Overview";
  };
  repairFreeze: CodeIntelligenceTruthRebaseState;
  requiredManifest: readonly string[];
  sealedAuthority: {
    gatewayPages: readonly string[];
    workspacePages: readonly string[];
    allPageLabels: readonly string[];
    navRouteIds: readonly string[];
  };
  exports: {
    navigation: readonly string[];
    frozenContract: readonly string[];
    previewPanels: readonly string[];
    previewAliases: readonly string[];
    routes: readonly string[];
  };
  layers: {
    navigation: Readonly<Record<string, boolean>>;
    contract: readonly CodeIntelligencePageContractRow[];
    route: readonly CodeIntelligenceRouteChainRow[];
    alias: {
      dashboardMapsTo: "Overview";
      dashboardPresent: boolean;
      foreignDashboardUses: readonly string[];
      policyOk: boolean;
    };
  };
  parity: {
    inAllThree: readonly string[];
    contractOnly: readonly string[];
    previewOnly: readonly string[];
    navOnly: readonly string[];
    sealedMissingFromContract: readonly string[];
    sealedMissingFromPreview: readonly string[];
    sealedMissingFromNav: readonly string[];
    duplicatesInPreview: readonly string[];
    duplicatesInContract: readonly string[];
    dashboardAliasPresent: boolean;
  };
  acceptance: {
    /** All 16 required pages appear as layer rows (map is complete to review). */
    requiredPagesCovered: boolean;
    contractLayerClassified: boolean;
    routeLayerRowsComplete: boolean;
    aliasLayerDocumented: boolean;
    /**
     * Map structure is complete and reviewable — accept even if project has gaps.
     * Gaps are recorded for Phase 3+; they do not block Truth Map acceptance.
     */
    readyToAccept: boolean;
    /** Stricter: no missing/dupe/orphan/broken chains/Dashboard residue — later phases. */
    projectParityClean: boolean;
    blockers: readonly string[];
  };
  summaryLines: readonly string[];
}>;

function key(label: string): string {
  return normalizePageKey(label);
}

function uniqueKeys(labels: readonly string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const label of labels) {
    const k = key(label);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}

function findDuplicates(labels: readonly string[]): string[] {
  const counts = new Map<string, number>();
  for (const label of labels) {
    const k = key(label);
    if (!k) continue;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts.entries()].filter(([, n]) => n > 1).map(([k]) => k);
}

function countKeys(labels: readonly string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const label of labels) {
    const k = key(label);
    if (!k) continue;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return counts;
}

export function exportCodeIntelligencePreviewPanels(html: string): string[] {
  const found: string[] = [];
  const re =
    /<(?:section|div|article)\b[^>]*\b(?:data-view|data-route|data-cint-page)\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    found.push(m[1] ?? "");
  }
  return found.filter(Boolean);
}

export function exportCodeIntelligenceNavigation(html: string): string[] {
  const found: string[] = [];
  const attrRe = /\b(?:data-view-nav|data-cint-route)\s*=\s*["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = attrRe.exec(html))) {
    found.push(m[1] ?? "");
  }
  const hrefRe = /<a\b[^>]*\bhref\s*=\s*["']#([^"']+)["'][^>]*>/gi;
  while ((m = hrefRe.exec(html))) {
    found.push(m[1] ?? "");
  }
  // Gateway CTAs often use data-cint-auth / form surfaces without rail links.
  if (/\bdata-cint-auth\b|\bdata-view=["']landing["']/i.test(html)) {
    found.push("landing");
  }
  if (/\bdata-view=["']login["']|Sign in/i.test(html)) found.push("login");
  if (/\bdata-view=["']signup["']|Create account/i.test(html)) found.push("signup");
  if (/\bdata-view=["']forgot-password["']|Forgot password/i.test(html)) {
    found.push("forgot-password");
  }
  return found.filter(Boolean);
}

export function exportCodeIntelligenceRoutes(html: string): string[] {
  const found: string[] = [];
  const re = /\b(?:data-route|href)\s*=\s*["']#?([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const raw = (m[1] ?? "").replace(/^#/, "");
    if (raw) found.push(raw);
  }
  return uniqueKeys(found);
}

export function exportCodeIntelligenceFrozenContract(
  truth: FrozenProjectTruth | null | undefined,
  userPrompt?: string | null,
): string[] {
  if (!truth) return [];
  return [...readFrozenPageContract(truth, { externalPrompt: userPrompt ?? undefined })];
}

export function sealedCodeIntelligenceNavRouteIds(): string[] {
  return CODE_INTELLIGENCE_NAV_GROUPS.flatMap((group) => group.items.map((item) => item.id));
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function readCodeIntelligenceTruthRebase(
  metadata?: unknown,
): CodeIntelligenceTruthRebaseState {
  const root = asRecord(metadata);
  const block = asRecord(root?.[CINT_TRUTH_REBASE_KEY]);
  if (!block) {
    return {
      frozen: true,
      phase: "phase_1_truth_map",
      lockedAt: null,
      unlockedAt: null,
      acceptedAt: null,
      identitySealedAt: null,
      registrySealedAt: null,
      entitySealedAt: null,
      workflowSealedAt: null,
      integrationSealedAt: null,
      reason: "default_freeze_until_truth_map_accepted",
    };
  }
  const phaseRaw = typeof block.phase === "string" ? block.phase : "phase_1_truth_map";
  const phase: CodeIntelligenceRebasePhase =
    phaseRaw === "phase_2_identity" ||
    phaseRaw === "phase_3_registry" ||
    phaseRaw === "phase_4_entity" ||
    phaseRaw === "phase_5_workflow" ||
    phaseRaw === "phase_6_integration"
      ? phaseRaw
      : "phase_1_truth_map";
  return {
    frozen: block.frozen !== false,
    phase,
    lockedAt: typeof block.lockedAt === "string" ? block.lockedAt : null,
    unlockedAt: typeof block.unlockedAt === "string" ? block.unlockedAt : null,
    acceptedAt: typeof block.acceptedAt === "string" ? block.acceptedAt : null,
    identitySealedAt: typeof block.identitySealedAt === "string" ? block.identitySealedAt : null,
    registrySealedAt: typeof block.registrySealedAt === "string" ? block.registrySealedAt : null,
    entitySealedAt: typeof block.entitySealedAt === "string" ? block.entitySealedAt : null,
    workflowSealedAt: typeof block.workflowSealedAt === "string" ? block.workflowSealedAt : null,
    integrationSealedAt:
      typeof block.integrationSealedAt === "string" ? block.integrationSealedAt : null,
    reason: typeof block.reason === "string" ? block.reason : null,
  };
}

export function lockCodeIntelligenceTruthRebase(
  metadata: unknown,
  reason = "phase_1_stop_repairs_rebase_truth",
): { metadata: Record<string, unknown>; state: CodeIntelligenceTruthRebaseState } {
  const base = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  const prev = readCodeIntelligenceTruthRebase(metadata);
  const state: CodeIntelligenceTruthRebaseState = {
    frozen: true,
    phase: "phase_1_truth_map",
    lockedAt: prev.lockedAt ?? new Date().toISOString(),
    unlockedAt: null,
    acceptedAt: prev.acceptedAt,
    identitySealedAt: prev.identitySealedAt,
    registrySealedAt: prev.registrySealedAt,
    entitySealedAt: prev.entitySealedAt,
    workflowSealedAt: prev.workflowSealedAt,
    integrationSealedAt: prev.integrationSealedAt,
    reason,
  };
  base[CINT_TRUTH_REBASE_KEY] = { ...state };
  return { metadata: base, state };
}

/**
 * Operator accepts the Truth Map (Phase 1 PASS) and seals cint.identity.v1 (Phase 2).
 * Keeps repair freeze ON — identity first; do not unfreeze for registry/entity/workflow yet.
 */
export function acceptCodeIntelligenceTruthMap(
  metadata: unknown,
  reason = "truth_map_accepted_identity_sealed",
): {
  metadata: Record<string, unknown>;
  state: CodeIntelligenceTruthRebaseState;
  identitySealed: true;
} {
  const base = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  const prev = readCodeIntelligenceTruthRebase(metadata);
  const acceptedAt = prev.acceptedAt ?? new Date().toISOString();
  const withIdentity = sealCodeIntelligenceIdentity(base);
  const identitySealedAt =
    withIdentity.identity.sealedAt ?? new Date().toISOString();
  const state: CodeIntelligenceTruthRebaseState = {
    frozen: true,
    phase: "phase_2_identity",
    lockedAt: prev.lockedAt ?? new Date().toISOString(),
    unlockedAt: null,
    acceptedAt,
    identitySealedAt,
    registrySealedAt: prev.registrySealedAt,
    entitySealedAt: prev.entitySealedAt,
    workflowSealedAt: prev.workflowSealedAt,
    integrationSealedAt: prev.integrationSealedAt,
    reason,
  };
  withIdentity.metadata[CINT_TRUTH_REBASE_KEY] = { ...state };
  return { metadata: withIdentity.metadata, state, identitySealed: true };
}

/**
 * Phase 3 — seal cint.registry.v1 after identity. Keeps repair freeze ON.
 */
export function advanceCodeIntelligenceRegistryAuthority(
  metadata: unknown,
  reason = "registry_authority_sealed_phase_3",
): {
  metadata: Record<string, unknown>;
  state: CodeIntelligenceTruthRebaseState;
  ok: boolean;
  reason: string;
} {
  const sealed = sealCodeIntelligenceRegistry(metadata);
  if (!sealed.ok) {
    const prev = readCodeIntelligenceTruthRebase(sealed.metadata);
    return {
      metadata: sealed.metadata,
      state: prev,
      ok: false,
      reason: sealed.reason,
    };
  }
  const prev = readCodeIntelligenceTruthRebase(sealed.metadata);
  const registrySealedAt = sealed.registry.sealedAt ?? new Date().toISOString();
  const state: CodeIntelligenceTruthRebaseState = {
    frozen: true,
    phase: "phase_3_registry",
    lockedAt: prev.lockedAt ?? new Date().toISOString(),
    unlockedAt: null,
    acceptedAt: prev.acceptedAt,
    identitySealedAt: prev.identitySealedAt,
    registrySealedAt,
    entitySealedAt: prev.entitySealedAt,
    workflowSealedAt: prev.workflowSealedAt,
    integrationSealedAt: prev.integrationSealedAt,
    reason,
  };
  sealed.metadata[CINT_TRUTH_REBASE_KEY] = { ...state };
  return {
    metadata: sealed.metadata,
    state,
    ok: true,
    reason,
  };
}

/**
 * Phase 4 — seal cint.entity.v1 after registry. Keeps repair freeze ON.
 */
export function advanceCodeIntelligenceEntityAuthority(
  metadata: unknown,
  reason = "entity_authority_sealed_phase_4",
): {
  metadata: Record<string, unknown>;
  state: CodeIntelligenceTruthRebaseState;
  ok: boolean;
  reason: string;
} {
  const sealed = sealCodeIntelligenceEntity(metadata);
  if (!sealed.ok) {
    return {
      metadata: sealed.metadata,
      state: readCodeIntelligenceTruthRebase(sealed.metadata),
      ok: false,
      reason: sealed.reason,
    };
  }
  const prev = readCodeIntelligenceTruthRebase(sealed.metadata);
  const entitySealedAt = sealed.entity.sealedAt ?? new Date().toISOString();
  const state: CodeIntelligenceTruthRebaseState = {
    frozen: true,
    phase: "phase_4_entity",
    lockedAt: prev.lockedAt ?? new Date().toISOString(),
    unlockedAt: null,
    acceptedAt: prev.acceptedAt,
    identitySealedAt: prev.identitySealedAt,
    registrySealedAt: prev.registrySealedAt,
    entitySealedAt,
    workflowSealedAt: prev.workflowSealedAt,
    integrationSealedAt: prev.integrationSealedAt,
    reason,
  };
  sealed.metadata[CINT_TRUTH_REBASE_KEY] = { ...state };
  return { metadata: sealed.metadata, state, ok: true, reason };
}

/**
 * Phase 5 — seal cint.workflow.v1 after entity. Keeps repair freeze ON.
 */
export function advanceCodeIntelligenceWorkflowAuthority(
  metadata: unknown,
  reason = "workflow_authority_sealed_phase_5",
): {
  metadata: Record<string, unknown>;
  state: CodeIntelligenceTruthRebaseState;
  ok: boolean;
  reason: string;
} {
  const sealed = sealCodeIntelligenceWorkflow(metadata);
  if (!sealed.ok) {
    return {
      metadata: sealed.metadata,
      state: readCodeIntelligenceTruthRebase(sealed.metadata),
      ok: false,
      reason: sealed.reason,
    };
  }
  const prev = readCodeIntelligenceTruthRebase(sealed.metadata);
  const workflowSealedAt = sealed.workflow.sealedAt ?? new Date().toISOString();
  const state: CodeIntelligenceTruthRebaseState = {
    frozen: true,
    phase: "phase_5_workflow",
    lockedAt: prev.lockedAt ?? new Date().toISOString(),
    unlockedAt: null,
    acceptedAt: prev.acceptedAt,
    identitySealedAt: prev.identitySealedAt,
    registrySealedAt: prev.registrySealedAt,
    entitySealedAt: prev.entitySealedAt,
    workflowSealedAt,
    integrationSealedAt: prev.integrationSealedAt,
    reason,
  };
  sealed.metadata[CINT_TRUTH_REBASE_KEY] = { ...state };
  return { metadata: sealed.metadata, state, ok: true, reason };
}

/**
 * Phase 6 — seal cint.integration.v1 after workflow. Keeps repair freeze ON.
 * Authority model only — no UI / page invent.
 */
export function advanceCodeIntelligenceIntegrationAuthority(
  metadata: unknown,
  reason = "integration_authority_sealed_phase_6",
): {
  metadata: Record<string, unknown>;
  state: CodeIntelligenceTruthRebaseState;
  ok: boolean;
  reason: string;
} {
  const sealed = sealCodeIntelligenceIntegration(metadata);
  if (!sealed.ok) {
    return {
      metadata: sealed.metadata,
      state: readCodeIntelligenceTruthRebase(sealed.metadata),
      ok: false,
      reason: sealed.reason,
    };
  }
  const prev = readCodeIntelligenceTruthRebase(sealed.metadata);
  const integrationSealedAt = sealed.integration.sealedAt ?? new Date().toISOString();
  const state: CodeIntelligenceTruthRebaseState = {
    frozen: true,
    phase: "phase_6_integration",
    lockedAt: prev.lockedAt ?? new Date().toISOString(),
    unlockedAt: null,
    acceptedAt: prev.acceptedAt,
    identitySealedAt: prev.identitySealedAt,
    registrySealedAt: prev.registrySealedAt,
    entitySealedAt: prev.entitySealedAt,
    workflowSealedAt: prev.workflowSealedAt,
    integrationSealedAt,
    reason,
  };
  sealed.metadata[CINT_TRUTH_REBASE_KEY] = { ...state };
  return { metadata: sealed.metadata, state, ok: true, reason };
}

/** Detect operator intent to accept Truth Map / seal identity (metadata-only; no HTML heal). */
export function detectCodeIntelligenceTruthMapAcceptIntent(
  userPrompt?: string | null,
): boolean {
  const text = String(userPrompt || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return false;
  return (
    /\baccept\b.{0,40}\btruth\s*map\b/.test(text) ||
    /\btruth\s*map\b.{0,40}\baccept/.test(text) ||
    /\baccept\s+truth\s+map\b/.test(text) ||
    /\bseal\b.{0,40}\bidentity\b/.test(text) ||
    /\bcint\.identity\.v1\b.{0,20}\bseal/.test(text)
  );
}

/** Detect operator intent to unlock CI repair freeze for controlled parity heals. */
export function detectCodeIntelligenceUnlockIntent(
  userPrompt?: string | null,
): boolean {
  const raw = String(userPrompt || "").toLowerCase();
  if (!raw.trim()) return false;
  // Maintenance merges project description + operator intent with "\n".
  // Bare "unlock" must still match when it is its own trailing line.
  if (/(?:^|[\n\r])\s*(unlock|unfreeze)\s*$/m.test(raw)) return true;
  const text = raw.replace(/\s+/g, " ").trim();
  return (
    /^(unlock|unfreeze)$/.test(text) ||
    /\bunlock\b.{0,40}\b(repair|freeze|parity|heal|rebase|ci)\b/.test(text) ||
    /\bunfreeze\b.{0,40}\b(repair|freeze|parity|heal|rebase|ci)\b/.test(text) ||
    /\bunlock\s+(?:ci\s+)?(?:repair|freeze)\b/.test(text) ||
    /\bunlock\s+ci\b/.test(text) ||
    /\bci\s+unlock\b/.test(text) ||
    /\bparity\s+heal\b/.test(text) ||
    /\bphase_unlock_authorized\b/.test(text)
  );
}

/**
 * Unlock mutations only after foundations are sealed.
 * When operator unlocks, missing seals are advanced from pack authority first
 * (Phases 1–6) so live metadata can catch up in one pass.
 */
export function unlockCodeIntelligenceTruthRebase(
  metadata: unknown,
  reason = "phase_unlock_authorized_parity_heal",
): {
  metadata: Record<string, unknown>;
  state: CodeIntelligenceTruthRebaseState;
  ok: boolean;
  reason: string;
  sealedDuringUnlock: readonly string[];
} {
  let working = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  const sealedDuringUnlock: string[] = [];
  let prev = readCodeIntelligenceTruthRebase(working);

  if (!prev.acceptedAt || !isCodeIntelligenceIdentitySealed(working)) {
    const accepted = acceptCodeIntelligenceTruthMap(working, "unlock_cascade_accept_identity");
    working = accepted.metadata;
    sealedDuringUnlock.push("identity");
    prev = accepted.state;
  }
  if (!isCodeIntelligenceRegistrySealed(working)) {
    const registry = advanceCodeIntelligenceRegistryAuthority(working, "unlock_cascade_registry");
    working = registry.metadata;
    if (!registry.ok) {
      return {
        metadata: working,
        state: registry.state,
        ok: false,
        reason: registry.reason,
        sealedDuringUnlock,
      };
    }
    sealedDuringUnlock.push("registry");
    prev = registry.state;
  }
  if (!isCodeIntelligenceEntitySealed(working)) {
    const entity = advanceCodeIntelligenceEntityAuthority(working, "unlock_cascade_entity");
    working = entity.metadata;
    if (!entity.ok) {
      return {
        metadata: working,
        state: entity.state,
        ok: false,
        reason: entity.reason,
        sealedDuringUnlock,
      };
    }
    sealedDuringUnlock.push("entity");
    prev = entity.state;
  }
  if (!isCodeIntelligenceWorkflowSealed(working)) {
    const workflow = advanceCodeIntelligenceWorkflowAuthority(working, "unlock_cascade_workflow");
    working = workflow.metadata;
    if (!workflow.ok) {
      return {
        metadata: working,
        state: workflow.state,
        ok: false,
        reason: workflow.reason,
        sealedDuringUnlock,
      };
    }
    sealedDuringUnlock.push("workflow");
    prev = workflow.state;
  }
  if (!isCodeIntelligenceIntegrationSealed(working)) {
    const integration = advanceCodeIntelligenceIntegrationAuthority(
      working,
      "unlock_cascade_integration",
    );
    working = integration.metadata;
    if (!integration.ok) {
      return {
        metadata: working,
        state: integration.state,
        ok: false,
        reason: integration.reason,
        sealedDuringUnlock,
      };
    }
    sealedDuringUnlock.push("integration");
    prev = integration.state;
  }

  prev = readCodeIntelligenceTruthRebase(working);
  const state: CodeIntelligenceTruthRebaseState = {
    frozen: false,
    phase: "phase_6_integration",
    lockedAt: prev.lockedAt,
    unlockedAt: new Date().toISOString(),
    acceptedAt: prev.acceptedAt,
    identitySealedAt: prev.identitySealedAt,
    registrySealedAt: prev.registrySealedAt,
    entitySealedAt: prev.entitySealedAt,
    workflowSealedAt: prev.workflowSealedAt,
    integrationSealedAt: prev.integrationSealedAt,
    reason,
  };
  working[CINT_TRUTH_REBASE_KEY] = { ...state };
  return {
    metadata: working,
    state,
    ok: true,
    reason,
    sealedDuringUnlock,
  };
}

export function isCodeIntelligenceAutoRepairFrozen(input: {
  html?: string | null;
  userPrompt?: string | null;
  truth?: FrozenProjectTruth | null;
  metadata?: unknown;
}): boolean {
  if (
    !isCodeIntelligenceRepairTarget({
      html: input.html,
      userPrompt: input.userPrompt,
      truth: input.truth,
    })
  ) {
    return false;
  }
  return readCodeIntelligenceTruthRebase(input.metadata).frozen;
}

export function buildCodeIntelligenceTruthMap(input: {
  html: string;
  truth?: FrozenProjectTruth | null;
  userPrompt?: string | null;
  metadata?: unknown;
}): CodeIntelligenceTruthMap {
  const repairFreeze = readCodeIntelligenceTruthRebase(input.metadata);
  const navigationRaw = exportCodeIntelligenceNavigation(input.html);
  const previewRaw = exportCodeIntelligencePreviewPanels(input.html);
  const contractRaw = exportCodeIntelligenceFrozenContract(input.truth, input.userPrompt);
  const routesRaw = exportCodeIntelligenceRoutes(input.html);

  const navigation = uniqueKeys(navigationRaw);
  const previewPanels = uniqueKeys(previewRaw);
  const frozenContract = uniqueKeys(contractRaw);
  const routes = uniqueKeys(routesRaw);
  const previewAliases = findDuplicates(previewRaw);
  const duplicatesInContract = findDuplicates(contractRaw);
  const contractCounts = countKeys(contractRaw);

  const sealedGateway = CODE_INTELLIGENCE_DOMAIN_PACK.gatewayPages.map(key);
  const sealedWorkspace = CODE_INTELLIGENCE_DOMAIN_PACK.defaultPages.map(key);
  const sealedAll = uniqueKeys([...CODE_INTELLIGENCE_PAGE_LABELS]);
  const sealedNav = sealedCodeIntelligenceNavRouteIds();
  const requiredKeys = CINT_TRUTH_MAP_REQUIRED_PAGES.map((label) => key(label));
  const requiredSet = new Set(requiredKeys);

  const navSet = new Set(navigation);
  const previewSet = new Set(previewPanels);
  const contractSet = new Set(frozenContract);
  const routeSet = new Set(routes);

  const navigationLayer: Record<string, boolean> = {};
  for (const label of CINT_TRUTH_MAP_REQUIRED_PAGES) {
    navigationLayer[label] = navSet.has(key(label)) || previewSet.has(key(label));
  }

  const contractLayer: CodeIntelligencePageContractRow[] = CINT_TRUTH_MAP_REQUIRED_PAGES.map(
    (page) => {
      const k = key(page);
      const count = contractCounts.get(k) ?? 0;
      let status: ContractPageStatus = "missing";
      if (count > 1) status = "duplicate";
      else if (count === 1) status = "present";
      return {
        page,
        key: k,
        status,
        inContract: count > 0,
        contractCount: count,
      };
    },
  );
  // Contract orphans: in FPT but outside required sealed manifest.
  for (const k of frozenContract) {
    if (requiredSet.has(k)) continue;
    if (k === "dashboard") continue; // alias — handled in alias layer
    contractLayer.push({
      page: k,
      key: k,
      status: "orphan",
      inContract: true,
      contractCount: contractCounts.get(k) ?? 1,
    });
  }

  const routeLayer: CodeIntelligenceRouteChainRow[] = CINT_TRUTH_MAP_REQUIRED_PAGES.map((page) => {
    const k = key(page);
    const hasNavigation = Boolean(navigationLayer[page]);
    const hasRoute = routeSet.has(k) || navSet.has(k) || previewSet.has(k);
    const hasPanel = previewSet.has(k);
    return {
      page,
      key: k,
      hasNavigation,
      hasRoute,
      hasPanel,
      chainOk: hasNavigation && hasRoute && hasPanel,
    };
  });

  const foreignDashboardUses = [
    ...navigation.filter((k) => k === "dashboard"),
    ...previewPanels.filter((k) => k === "dashboard"),
    ...frozenContract.filter((k) => k === "dashboard"),
  ];
  const dashboardPresent = foreignDashboardUses.length > 0;
  // Alias policy documented: Dashboard → Overview only (never a required PAGE).
  // Residue is recorded via dashboardPresent / parity blockers — not a ReferenceError.
  const aliasLayerOk =
    !requiredSet.has("dashboard") &&
    !frozenContract.some((k) => k === "dashboard" && !contractSet.has("overview"));

  const inAllThree = navigation.filter((k) => previewSet.has(k) && contractSet.has(k));
  const contractOnly = frozenContract.filter((k) => !previewSet.has(k));
  const previewOnly = previewPanels.filter((k) => !contractSet.has(k));
  const navOnly = navigation.filter((k) => !previewSet.has(k) && k !== "dashboard");
  const sealedMissingFromContract = sealedAll.filter((k) => !contractSet.has(k));
  const sealedMissingFromPreview = sealedAll.filter((k) => !previewSet.has(k));
  const sealedMissingFromNav = sealedNav.filter((k) => !navSet.has(k));

  const requiredPagesCovered =
    CINT_TRUTH_MAP_REQUIRED_PAGES.every((page) => page in navigationLayer) &&
    routeLayer.length >= CINT_TRUTH_MAP_REQUIRED_PAGES.length;
  const contractLayerClassified = contractLayer.every((row) =>
    ["present", "missing", "duplicate", "orphan"].includes(row.status),
  );
  const routeLayerRowsComplete = routeLayer.length === CINT_TRUTH_MAP_REQUIRED_PAGES.length;
  const aliasLayerDocumented = true;
  const blockers: string[] = [];
  for (const page of CINT_TRUTH_MAP_REQUIRED_PAGES) {
    if (!navigationLayer[page]) blockers.push(`nav_absent:${key(page)}`);
  }
  if (contractLayer.some((row) => row.status === "missing")) {
    blockers.push(
      `contract_missing:${contractLayer.filter((r) => r.status === "missing").map((r) => r.key).join("|")}`,
    );
  }
  if (contractLayer.some((row) => row.status === "duplicate")) {
    blockers.push(
      `contract_duplicate:${contractLayer.filter((r) => r.status === "duplicate").map((r) => r.key).join("|")}`,
    );
  }
  if (contractLayer.some((row) => row.status === "orphan")) {
    blockers.push(
      `contract_orphan:${contractLayer.filter((r) => r.status === "orphan").map((r) => r.key).join("|")}`,
    );
  }
  if (routeLayer.some((row) => !row.chainOk)) {
    blockers.push(
      `route_chain_broken:${routeLayer.filter((r) => !r.chainOk).map((r) => r.key).join("|")}`,
    );
  }
  if (dashboardPresent) {
    blockers.push("dashboard_alias_present_collapse_to_overview");
  }
  const readyToAccept =
    requiredPagesCovered && contractLayerClassified && routeLayerRowsComplete && aliasLayerDocumented;
  const projectParityClean = blockers.length === 0;

  const identitySealed =
    Boolean(repairFreeze.identitySealedAt) || isCodeIntelligenceIdentitySealed(input.metadata);
  const registrySealed =
    Boolean(repairFreeze.registrySealedAt) || isCodeIntelligenceRegistrySealed(input.metadata);
  const entitySealed =
    Boolean(repairFreeze.entitySealedAt) || isCodeIntelligenceEntitySealed(input.metadata);
  const workflowSealed =
    Boolean(repairFreeze.workflowSealedAt) || isCodeIntelligenceWorkflowSealed(input.metadata);
  const integrationSealed =
    Boolean(repairFreeze.integrationSealedAt) ||
    isCodeIntelligenceIntegrationSealed(input.metadata);
  const summaryLines = [
    `○ CI Truth Map — nav ${navigation.length} · contract ${frozenContract.length} · preview ${previewPanels.length} · sealed ${sealedAll.length}`,
    repairFreeze.frozen
      ? integrationSealed
        ? "✕ CI auto-repair FROZEN (Phase 6 integration sealed) — explicit unlock still required"
        : workflowSealed
          ? "✕ CI auto-repair FROZEN (Phase 5 workflow sealed) — integration next; do not unfreeze yet"
          : entitySealed
            ? "✕ CI auto-repair FROZEN (Phase 4 entity sealed) — workflow next; do not unfreeze yet"
            : registrySealed
              ? "✕ CI auto-repair FROZEN (Phase 3 registry sealed) — entity/workflow next; do not unfreeze yet"
              : identitySealed
                ? "✕ CI auto-repair FROZEN (Phase 2 identity sealed) — registry next; do not unfreeze yet"
                : "✕ CI auto-repair FROZEN (Phase 1) — scan/report only until Truth Map accepted"
      : "✓ CI auto-repair unlocked",
    repairFreeze.acceptedAt
      ? `✓ Truth Map accepted at ${repairFreeze.acceptedAt}`
      : "○ Truth Map not yet accepted",
    identitySealed
      ? `✓ cint.identity.v1 SEALED${repairFreeze.identitySealedAt ? ` at ${repairFreeze.identitySealedAt}` : ""}`
      : "○ cint.identity.v1 not sealed",
    registrySealed
      ? `✓ cint.registry.v1 SEALED${repairFreeze.registrySealedAt ? ` at ${repairFreeze.registrySealedAt}` : ""}`
      : "○ cint.registry.v1 not sealed",
    entitySealed
      ? `✓ cint.entity.v1 SEALED${repairFreeze.entitySealedAt ? ` at ${repairFreeze.entitySealedAt}` : ""}`
      : "○ cint.entity.v1 not sealed",
    workflowSealed
      ? `✓ cint.workflow.v1 SEALED${repairFreeze.workflowSealedAt ? ` at ${repairFreeze.workflowSealedAt}` : ""}`
      : "○ cint.workflow.v1 not sealed",
    integrationSealed
      ? `✓ cint.integration.v1 SEALED${repairFreeze.integrationSealedAt ? ` at ${repairFreeze.integrationSealedAt}` : ""}`
      : "○ cint.integration.v1 not sealed",
    readyToAccept
      ? "✓ Truth Map structure PASS — review layers then accept (gaps may still be listed)"
      : "✕ Truth Map structure incomplete — exporter failed to cover CREATE floor pages",
    projectParityClean
      ? "✓ Project parity clean — no nav/contract/route/alias gaps"
      : `○ Project parity gaps (recorded, not acceptance blockers): ${blockers.join("; ")}`,
    `○ Alias policy — Dashboard → Overview only${dashboardPresent ? " (Dashboard residue present)" : ""}`,
  ];

  return {
    generatedAt: new Date().toISOString(),
    product: {
      fieldRegistryId: "field:code_intelligence",
      title: CODE_INTELLIGENCE_DOMAIN_PACK.title,
      familyHint: "Engineering Intelligence",
      category: "code_intelligence",
      productType: "Code Intelligence Platform",
      commandCentre: "Overview",
    },
    repairFreeze,
    requiredManifest: [...CINT_TRUTH_MAP_REQUIRED_PAGES],
    sealedAuthority: {
      gatewayPages: sealedGateway,
      workspacePages: sealedWorkspace,
      allPageLabels: [...CODE_INTELLIGENCE_PAGE_LABELS],
      navRouteIds: sealedNav,
    },
    exports: {
      navigation,
      frozenContract,
      previewPanels,
      previewAliases,
      routes,
    },
    layers: {
      navigation: navigationLayer,
      contract: contractLayer,
      route: routeLayer,
      alias: {
        dashboardMapsTo: "Overview",
        dashboardPresent,
        foreignDashboardUses: uniqueKeys(foreignDashboardUses),
        policyOk: aliasLayerOk,
      },
    },
    parity: {
      inAllThree,
      contractOnly,
      previewOnly,
      navOnly,
      sealedMissingFromContract,
      sealedMissingFromPreview,
      sealedMissingFromNav,
      duplicatesInPreview: previewAliases,
      duplicatesInContract,
      dashboardAliasPresent: dashboardPresent,
    },
    acceptance: {
      requiredPagesCovered,
      contractLayerClassified,
      routeLayerRowsComplete,
      aliasLayerDocumented,
      readyToAccept,
      projectParityClean,
      blockers,
    },
    summaryLines,
  };
}

export function persistCodeIntelligenceTruthMap(
  metadata: unknown,
  map: CodeIntelligenceTruthMap,
): Record<string, unknown> {
  const base = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  base[CINT_TRUTH_MAP_KEY] = map;
  return base;
}
