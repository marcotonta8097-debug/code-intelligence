/**
 * cint.entity.v1 — Phase 4 Entity Authority (Code Intelligence).
 *
 * Seals pack entities under registry domains. No new entities invent.
 * Reuses domain pack + REG-OWN-1.0 orphan detection. Repair freeze stays ON.
 */

import {
  isCodeIntelligenceRegistrySealed,
  CINT_REGISTRY_DOMAIN_SLICES,
  type CodeIntelligenceRegistryDomainId,
} from "@/core/codeIntelligence/codeIntelligenceRegistryAuthority";
import { CODE_INTELLIGENCE_DOMAIN_PACK } from "@/core/domainPack/codeIntelligenceDomainPack";
import {
  CODE_INTELLIGENCE_REQUIRED_ENTITIES,
  detectEntityOrphans,
  FOREIGN_ENTITY_LABELS,
} from "@/core/domainPack/registryAuthority";

export const CINT_ENTITY_KEY = "cint.entity.v1" as const;

export type CodeIntelligenceEntityRecord = Readonly<{
  key: string;
  label: string;
  ownerPage: string;
  ownerFeature: string;
  ownerDomain: string;
  authorityDomain: CodeIntelligenceRegistryDomainId | "Supporting";
  neighbors: readonly string[];
}>;

export type CodeIntelligenceEntityAuthority = Readonly<{
  version: "cint.entity.v1";
  sealed: boolean;
  sealedAt: string | null;
  fieldRegistryId: "field:code_intelligence";
  requiresRegistrySealed: true;
  entities: readonly CodeIntelligenceEntityRecord[];
  requiredCore: readonly string[];
  forbiddenInvent: readonly string[];
  orphans: readonly string[];
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
    if (slice.entities.includes(label)) return slice.id;
  }
  return "Supporting";
}

export function buildCodeIntelligenceEntityAuthority(options?: {
  sealed?: boolean;
}): CodeIntelligenceEntityAuthority {
  const sealed = options?.sealed === true;
  const pack = CODE_INTELLIGENCE_DOMAIN_PACK;
  const entities: CodeIntelligenceEntityRecord[] = pack.entities.map((entity) => ({
    key: entity.key,
    label: entity.label,
    ownerPage: entity.ownerPage,
    ownerFeature: entity.ownerFeature,
    ownerDomain: entity.ownerDomain,
    authorityDomain: resolveAuthorityDomain(entity.label),
    neighbors: [...(pack.allowedNeighbors[entity.label] ?? [])],
  }));
  const orphans = detectEntityOrphans(pack);
  const ownedLabels = new Set(entities.map((e) => e.label));
  const missingRequired = CODE_INTELLIGENCE_REQUIRED_ENTITIES.filter((label) => !ownedLabels.has(label));
  const coverageOk = orphans.length === 0 && missingRequired.length === 0;

  return {
    version: "cint.entity.v1",
    sealed,
    sealedAt: sealed ? new Date().toISOString() : null,
    fieldRegistryId: "field:code_intelligence",
    requiresRegistrySealed: true,
    entities,
    requiredCore: [...CODE_INTELLIGENCE_REQUIRED_ENTITIES],
    forbiddenInvent: [...FOREIGN_ENTITY_LABELS],
    orphans: [...orphans, ...missingRequired.map((label) => `missing_required:${label}`)],
    coverageOk,
    constitution: [
      "Every entity has ownerPage + ownerFeature + ownerDomain — no orphans.",
      "Entity invent outside pack is forbidden (CRM/commerce/FOC bleed).",
      "Authority domain is projected from cint.registry.v1 slices.",
      "Phase 5 workflows may only reference sealed entities.",
      "Repair freeze remains ON until explicit unlock after Phase 5.",
    ],
  };
}

export function persistCodeIntelligenceEntityDraft(
  metadata: unknown,
): { metadata: Record<string, unknown>; entity: CodeIntelligenceEntityAuthority } {
  const base = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  const entity = buildCodeIntelligenceEntityAuthority({ sealed: false });
  base[CINT_ENTITY_KEY] = entity;
  return { metadata: base, entity };
}

export function sealCodeIntelligenceEntity(
  metadata: unknown,
): {
  metadata: Record<string, unknown>;
  entity: CodeIntelligenceEntityAuthority;
  ok: boolean;
  reason: string;
} {
  const base = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  if (!isCodeIntelligenceRegistrySealed(base)) {
    const entity = buildCodeIntelligenceEntityAuthority({ sealed: false });
    base[CINT_ENTITY_KEY] = entity;
    return {
      metadata: base,
      entity,
      ok: false,
      reason: "seal_refused_registry_not_sealed",
    };
  }
  const entity = buildCodeIntelligenceEntityAuthority({ sealed: true });
  if (!entity.coverageOk) {
    const draft = { ...entity, sealed: false, sealedAt: null };
    base[CINT_ENTITY_KEY] = draft;
    return {
      metadata: base,
      entity: draft,
      ok: false,
      reason: "seal_refused_entity_coverage_incomplete",
    };
  }
  base[CINT_ENTITY_KEY] = entity;
  return { metadata: base, entity, ok: true, reason: "entity_authority_sealed" };
}

export function readCodeIntelligenceEntity(
  metadata?: unknown,
): CodeIntelligenceEntityAuthority | null {
  const block = asRecord(asRecord(metadata)?.[CINT_ENTITY_KEY]);
  if (!block || block.version !== "cint.entity.v1") return null;
  return block as CodeIntelligenceEntityAuthority;
}

export function isCodeIntelligenceEntitySealed(metadata?: unknown): boolean {
  return readCodeIntelligenceEntity(metadata)?.sealed === true;
}

export function detectCodeIntelligenceEntitySealIntent(
  userPrompt?: string | null,
): boolean {
  const text = String(userPrompt || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return false;
  return (
    /\bseal\b.{0,40}\bentity\b/.test(text) ||
    /\bentity\b.{0,40}\bseal\b/.test(text) ||
    /\baccept\b.{0,40}\bentity\b/.test(text) ||
    /\bphase\s*4\b/.test(text) ||
    /\bentity\s+authority\b/.test(text) ||
    /\bcint\.entity\.v1\b/.test(text) ||
    /\bstart\b.{0,40}\b(next\s+phases?|phase\s*4|entity)\b/.test(text)
  );
}

export function formatCodeIntelligenceEntitySummaryLines(
  entity: CodeIntelligenceEntityAuthority,
): string[] {
  return [
    `○ CI Entity — ${entity.entities.length} sealed candidates · required core ${entity.requiredCore.length}`,
    entity.sealed
      ? `✓ cint.entity.v1 SEALED${entity.sealedAt ? ` at ${entity.sealedAt}` : ""}`
      : "○ cint.entity.v1 not sealed",
    entity.coverageOk
      ? "✓ Entity coverage PASS — no orphans / required core present"
      : `✕ Entity coverage gaps — ${entity.orphans.join("; ") || "unknown"}`,
    "○ Repair freeze remains ON — Phase 5 Workflow Authority next",
  ];
}
