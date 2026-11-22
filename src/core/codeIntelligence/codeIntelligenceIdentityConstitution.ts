/**
 * cint.identity.v1 — Code Intelligence Project Constitution (Phase 2 seal artifact).
 * Sealed on Truth Map acceptance. Referee for repairs, scans, upgrades, generations —
 * no identity invent. Repair freeze remains ON until later unlock.
 */

import {
  CODE_INTELLIGENCE_DOMAIN_PACK,
  CODE_INTELLIGENCE_PAGE_LABELS,
} from "@/core/domainPack/codeIntelligenceDomainPack";
import { CODE_INTELLIGENCE_PRODUCT_MANIFEST } from "@/core/domainPack/codeIntelligenceProductArtifacts";

export const CINT_IDENTITY_KEY = "cint.identity.v1" as const;

export const CINT_IDENTITY_AUTHORITY_DOMAINS = [
  "Repository Authority",
  "Analysis Authority",
  "Finding Authority",
  "Evidence Authority",
  "Investigation Authority",
  "Remediation Authority",
  "Architecture Authority",
  "Knowledge Authority",
  "Report Authority",
] as const;

export const CINT_IDENTITY_PRIMARY_PURPOSES = [
  "Repository Intelligence",
  "Dependency Intelligence",
  "Architecture Intelligence",
  "Security Intelligence",
  "Knowledge Preservation",
  "Engineering Governance",
] as const;

export type CodeIntelligenceIdentityConstitution = Readonly<{
  version: "cint.identity.v1";
  sealed: boolean;
  sealedAt: string | null;
  mission: string;
  productFamily: "Engineering Intelligence";
  productType: "Code Intelligence Platform";
  category: "code_intelligence";
  fieldRegistryId: "field:code_intelligence";
  commandCentre: "Overview";
  /**
   * PRIMARY ASSET — platform is an Engineering Intelligence System,
   * not a code editor and not a scanner.
   */
  assets: {
    primary: "Engineering Intelligence";
    secondary: "Repository Knowledge";
    tertiary: "Engineering Governance";
  };
  primaryPurposes: typeof CINT_IDENTITY_PRIMARY_PURPOSES;
  authorityDomains: typeof CINT_IDENTITY_AUTHORITY_DOMAINS;
  capabilities: readonly string[];
  coreWorkflows: readonly string[];
  coreEntities: readonly string[];
  workspaceManifest: {
    gateway: readonly string[];
    workspace: readonly string[];
    aliasPolicy: { dashboard: "Overview"; nowhereElse: true };
  };
  exclusions: {
    families: readonly string[];
    pages: readonly string[];
    neverClaims: readonly string[];
    not: readonly [
      "CRM",
      "E-Commerce",
      "Marketplace",
      "Wallet",
      "Field Operations",
      "Generic SaaS",
    ];
  };
  constitution: readonly string[];
}>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** Build the constitution document (draft or sealed). Does not invent product meaning. */
export function buildCodeIntelligenceIdentityConstitution(
  options?: { sealed?: boolean },
): CodeIntelligenceIdentityConstitution {
  const sealed = options?.sealed === true;
  return {
    version: "cint.identity.v1",
    sealed,
    sealedAt: sealed ? new Date().toISOString() : null,
    mission:
      "Provide an Engineering Intelligence Platform that understands repositories, architecture, ownership, knowledge, risks, and software systems as a whole — evidence before conclusions, never silent source mutation.",
    productFamily: "Engineering Intelligence",
    productType: "Code Intelligence Platform",
    category: "code_intelligence",
    fieldRegistryId: "field:code_intelligence",
    commandCentre: "Overview",
    assets: {
      primary: "Engineering Intelligence",
      secondary: "Repository Knowledge",
      tertiary: "Engineering Governance",
    },
    primaryPurposes: CINT_IDENTITY_PRIMARY_PURPOSES,
    authorityDomains: CINT_IDENTITY_AUTHORITY_DOMAINS,
    capabilities: [
      ...new Set(CODE_INTELLIGENCE_DOMAIN_PACK.roles.flatMap((role) => [...role.capabilities])),
    ].sort(),
    coreWorkflows: CODE_INTELLIGENCE_DOMAIN_PACK.workflows.map((workflow) => workflow.label),
    coreEntities: CODE_INTELLIGENCE_DOMAIN_PACK.entities.map((entity) => entity.label),
    workspaceManifest: {
      gateway: [...CODE_INTELLIGENCE_DOMAIN_PACK.gatewayPages],
      workspace: [...CODE_INTELLIGENCE_DOMAIN_PACK.defaultPages],
      aliasPolicy: { dashboard: "Overview", nowhereElse: true },
    },
    exclusions: {
      families: [...CODE_INTELLIGENCE_DOMAIN_PACK.forbiddenFamilies],
      pages: [...CODE_INTELLIGENCE_DOMAIN_PACK.forbiddenPageKeys],
      neverClaims: [...CODE_INTELLIGENCE_PRODUCT_MANIFEST.neverClaims],
      not: ["CRM", "E-Commerce", "Marketplace", "Wallet", "Field Operations", "Generic SaaS"],
    },
    constitution: [
      ...CODE_INTELLIGENCE_PRODUCT_MANIFEST.constitution,
      "Subordinate to cint.constitution.v1 Platform Constitution.",
      "Primary asset is Engineering Intelligence — not a code editor, not a scanner.",
      "Identity drift is more dangerous than UI drift; seal before registry/entity/workflow authority.",
      "Repair freeze remains until identity is sealed and later phases authorize unlock.",
    ],
  };
}

export function persistCodeIntelligenceIdentityDraft(
  metadata: unknown,
): { metadata: Record<string, unknown>; identity: CodeIntelligenceIdentityConstitution } {
  const base = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  const identity = buildCodeIntelligenceIdentityConstitution({ sealed: false });
  base[CINT_IDENTITY_KEY] = identity;
  base["cint.identity.draftPages"] = [...CODE_INTELLIGENCE_PAGE_LABELS];
  return { metadata: base, identity };
}

/** Phase 2 — seal identity after Truth Map acceptance. Keeps repair freeze unless caller unlocks. */
export function sealCodeIntelligenceIdentity(
  metadata: unknown,
): { metadata: Record<string, unknown>; identity: CodeIntelligenceIdentityConstitution } {
  const base = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  const identity = buildCodeIntelligenceIdentityConstitution({ sealed: true });
  base[CINT_IDENTITY_KEY] = identity;
  base["cint.identity.draftPages"] = [...CODE_INTELLIGENCE_PAGE_LABELS];
  return { metadata: base, identity };
}

export function readCodeIntelligenceIdentity(
  metadata?: unknown,
): CodeIntelligenceIdentityConstitution | null {
  const block = asRecord(asRecord(metadata)?.[CINT_IDENTITY_KEY]);
  if (!block || block.version !== "cint.identity.v1") return null;
  return block as CodeIntelligenceIdentityConstitution;
}

export function isCodeIntelligenceIdentitySealed(metadata?: unknown): boolean {
  return readCodeIntelligenceIdentity(metadata)?.sealed === true;
}
