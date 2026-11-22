/**
 * cint.registry.v1 — Phase 3 Registry Authority (Code Intelligence).
 *
 * Maps sealed identity authority domains → pack-owned pages/entities/features/
 * engines/taxonomies. Reuses REG-OWN-1.0 (`auditRegistryAuthority`) — does not
 * invent a parallel registry. No HTML generation. Repair freeze stays ON.
 */

import {
  CINT_IDENTITY_AUTHORITY_DOMAINS,
  isCodeIntelligenceIdentitySealed,
  readCodeIntelligenceIdentity,
  type CodeIntelligenceIdentityConstitution,
} from "@/core/codeIntelligence/codeIntelligenceIdentityConstitution";
import { CODE_INTELLIGENCE_DOMAIN_PACK } from "@/core/domainPack/codeIntelligenceDomainPack";
import {
  auditRegistryAuthority,
  type RegistryAuthorityReport,
} from "@/core/domainPack/registryAuthority";

export const CINT_REGISTRY_KEY = "cint.registry.v1" as const;

export type CodeIntelligenceRegistryDomainId =
  (typeof CINT_IDENTITY_AUTHORITY_DOMAINS)[number];

export type CodeIntelligenceRegistryDomainSlice = Readonly<{
  id: CodeIntelligenceRegistryDomainId;
  purpose: string;
  pages: readonly string[];
  entities: readonly string[];
  features: readonly string[];
  workflows: readonly string[];
  engines: readonly string[];
  taxonomies: readonly string[];
  /** Explicit: no PAGE invent under this domain. */
  forbiddenPageInvent: readonly string[];
}>;

export type CodeIntelligenceRegistryAuthority = Readonly<{
  version: "cint.registry.v1";
  sealed: boolean;
  sealedAt: string | null;
  fieldRegistryId: "field:code_intelligence";
  productFamily: "Engineering Intelligence";
  productType: "Code Intelligence Platform";
  /** Identity must already be sealed before registry seal. */
  requiresIdentitySealed: true;
  domains: readonly CodeIntelligenceRegistryDomainSlice[];
  packAudit: RegistryAuthorityReport;
  coverageOk: boolean;
  constitution: readonly string[];
}>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/**
 * Sealed domain → ownership map.
 * Report Authority uses History + Overview — never invents a Reports PAGE.
 */
export const CINT_REGISTRY_DOMAIN_SLICES: readonly CodeIntelligenceRegistryDomainSlice[] = [
  {
    id: "Repository Authority",
    purpose: "Repository Intelligence",
    pages: ["Repositories"],
    entities: ["Repository", "Branch", "Commit", "Module", "File", "Dependency"],
    features: ["Repository Analysis", "Dependency Health"],
    workflows: ["Analysis"],
    engines: ["01", "02", "03"],
    taxonomies: ["Purpose", "AnalysisType"],
    forbiddenPageInvent: ["Repos", "Sources", "GitHub", "Code Editor"],
  },
  {
    id: "Analysis Authority",
    purpose: "Repository Intelligence",
    pages: ["Findings", "Overview", "History"],
    entities: ["AnalysisRun", "Finding", "Recommendation"],
    features: ["Finding Management", "Release Readiness", "History Timeline"],
    workflows: ["Analysis"],
    engines: ["01", "02", "04"],
    taxonomies: ["AnalysisType", "Confidence", "Lifecycle"],
    forbiddenPageInvent: ["Scans", "Jobs", "Pipelines"],
  },
  {
    id: "Finding Authority",
    purpose: "Security Intelligence",
    pages: ["Findings", "Security", "Quality"],
    entities: ["Finding", "TechnicalDebt", "Recommendation"],
    features: ["Finding Management", "Security Posture", "Technical Debt Registry", "Quality Insights"],
    workflows: ["Finding"],
    engines: ["04"],
    taxonomies: ["Severity", "Confidence", "FindingCategory", "Lifecycle", "DebtType"],
    forbiddenPageInvent: ["Tickets", "Issues Board", "Jira"],
  },
  {
    id: "Evidence Authority",
    purpose: "Security Intelligence",
    pages: ["Findings", "Security"],
    entities: ["Evidence", "Finding", "DocumentationAsset"],
    features: ["Evidence Explorer", "Security Posture"],
    workflows: ["Finding", "Investigation"],
    engines: ["05"],
    taxonomies: ["EvidenceType", "Confidence"],
    forbiddenPageInvent: ["Attachments", "Uploads"],
  },
  {
    id: "Investigation Authority",
    purpose: "Engineering Governance",
    pages: ["Findings"],
    entities: ["Investigation", "Finding", "Evidence"],
    features: ["Investigation Workspace", "Finding Management"],
    workflows: ["Investigation"],
    engines: ["06"],
    taxonomies: ["Lifecycle", "Confidence", "Severity"],
    forbiddenPageInvent: ["Investigations", "Cases"],
  },
  {
    id: "Remediation Authority",
    purpose: "Engineering Governance",
    pages: ["Remediation"],
    entities: ["RemediationPlan", "Finding", "TechnicalDebt", "Recommendation"],
    features: ["Remediation Workspace"],
    workflows: ["Remediation"],
    engines: ["07"],
    taxonomies: ["Lifecycle", "Confidence", "Severity"],
    forbiddenPageInvent: ["Fixes", "Patches", "PRs"],
  },
  {
    id: "Architecture Authority",
    purpose: "Architecture Intelligence",
    pages: ["Architecture", "Dependencies", "Overview"],
    entities: ["ArchitectureNode", "ArchitectureDecision", "Module", "Dependency", "KnowledgeGraphNode"],
    features: ["Architecture Review", "Architecture Drift Detection", "Impact Analysis", "Knowledge Graph"],
    workflows: ["Analysis"],
    engines: ["03", "08"],
    taxonomies: ["Purpose", "Confidence"],
    forbiddenPageInvent: ["Diagrams", "C4", "UML"],
  },
  {
    id: "Knowledge Authority",
    purpose: "Knowledge Preservation",
    pages: ["Documentation", "History", "Assistant", "Overview"],
    entities: ["DocumentationAsset", "KnowledgeGraphNode", "KnowledgeNode", "Conversation", "ArchitectureDecision"],
    features: ["Documentation Workspace", "Engineering Memory", "Knowledge Graph", "Assistant Chat"],
    workflows: ["Analysis"],
    engines: ["08", "09"],
    taxonomies: ["DocumentFreshness", "Confidence"],
    forbiddenPageInvent: ["Wiki", "Confluence", "Knowledge Base"],
  },
  {
    id: "Report Authority",
    purpose: "Engineering Governance",
    pages: ["History", "Overview"],
    entities: ["AnalysisRun", "Finding", "Notification"],
    features: ["History Timeline", "Release Readiness", "Command Centre"],
    workflows: ["Analysis"],
    engines: ["09", "10"],
    taxonomies: ["Lifecycle", "Severity", "Confidence"],
    /** Draft marketing copy said Reports — SECTIONS/features only, never a PAGE. */
    forbiddenPageInvent: ["Reports", "Evidence", "Dashboards"],
  },
] as const;

function packLabels(): {
  pages: Set<string>;
  entities: Set<string>;
  features: Set<string>;
  workflows: Set<string>;
} {
  const pack = CODE_INTELLIGENCE_DOMAIN_PACK;
  return {
    pages: new Set([...pack.gatewayPages, ...pack.defaultPages, ...pack.optionalPages]),
    entities: new Set(pack.entities.map((e) => e.label)),
    features: new Set(pack.features.map((f) => f.label)),
    workflows: new Set(pack.workflows.map((w) => w.label)),
  };
}

export function auditCodeIntelligenceRegistrySlices(
  slices: readonly CodeIntelligenceRegistryDomainSlice[] = CINT_REGISTRY_DOMAIN_SLICES,
): {
  ok: boolean;
  missingPages: readonly string[];
  missingEntities: readonly string[];
  missingFeatures: readonly string[];
  missingWorkflows: readonly string[];
  domainCountOk: boolean;
} {
  const owned = packLabels();
  const missingPages: string[] = [];
  const missingEntities: string[] = [];
  const missingFeatures: string[] = [];
  const missingWorkflows: string[] = [];

  for (const slice of slices) {
    for (const page of slice.pages) {
      if (!owned.pages.has(page)) missingPages.push(`${slice.id}:${page}`);
    }
    for (const entity of slice.entities) {
      if (!owned.entities.has(entity)) missingEntities.push(`${slice.id}:${entity}`);
    }
    for (const feature of slice.features) {
      if (!owned.features.has(feature)) missingFeatures.push(`${slice.id}:${feature}`);
    }
    for (const workflow of slice.workflows) {
      if (!owned.workflows.has(workflow)) missingWorkflows.push(`${slice.id}:${workflow}`);
    }
  }

  const domainCountOk =
    slices.length === CINT_IDENTITY_AUTHORITY_DOMAINS.length &&
    CINT_IDENTITY_AUTHORITY_DOMAINS.every((id) => slices.some((s) => s.id === id));

  return {
    ok:
      domainCountOk &&
      missingPages.length === 0 &&
      missingEntities.length === 0 &&
      missingFeatures.length === 0 &&
      missingWorkflows.length === 0,
    missingPages,
    missingEntities,
    missingFeatures,
    missingWorkflows,
    domainCountOk,
  };
}

/** Build registry document (draft or sealed). Does not invent pack meaning. */
export function buildCodeIntelligenceRegistryAuthority(options?: {
  sealed?: boolean;
  identity?: CodeIntelligenceIdentityConstitution | null;
}): CodeIntelligenceRegistryAuthority {
  const sealed = options?.sealed === true;
  const packAudit = auditRegistryAuthority(CODE_INTELLIGENCE_DOMAIN_PACK);
  const sliceAudit = auditCodeIntelligenceRegistrySlices();
  return {
    version: "cint.registry.v1",
    sealed,
    sealedAt: sealed ? new Date().toISOString() : null,
    fieldRegistryId: "field:code_intelligence",
    productFamily: "Engineering Intelligence",
    productType: "Code Intelligence Platform",
    requiresIdentitySealed: true,
    domains: CINT_REGISTRY_DOMAIN_SLICES,
    packAudit,
    coverageOk: packAudit.ok && sliceAudit.ok,
    constitution: [
      "Registry authority projects identity domains onto pack-owned surfaces only.",
      "REG-OWN-1.0 pack audit is the catalog health referee — no second registry scorer.",
      "Report Authority ≠ Reports PAGE — History + Overview only.",
      "Investigation Authority hosts on Findings — no Investigations PAGE invent.",
      "No foreign CRM/commerce/FOC entities, workflows, or pages.",
      "Phase 4 Entity Authority and Phase 5 Workflow Authority bind under these domains.",
      "Repair freeze remains ON until later explicit unlock.",
    ],
  };
}

export function persistCodeIntelligenceRegistryDraft(
  metadata: unknown,
): { metadata: Record<string, unknown>; registry: CodeIntelligenceRegistryAuthority } {
  const base = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  const registry = buildCodeIntelligenceRegistryAuthority({ sealed: false });
  base[CINT_REGISTRY_KEY] = registry;
  return { metadata: base, registry };
}

/**
 * Phase 3 seal — requires cint.identity.v1 sealed.
 * Does not unlock repair. Does not generate HTML.
 */
export function sealCodeIntelligenceRegistry(
  metadata: unknown,
): {
  metadata: Record<string, unknown>;
  registry: CodeIntelligenceRegistryAuthority;
  ok: boolean;
  reason: string;
} {
  const base = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  if (!isCodeIntelligenceIdentitySealed(base)) {
    const registry = buildCodeIntelligenceRegistryAuthority({ sealed: false });
    base[CINT_REGISTRY_KEY] = registry;
    return {
      metadata: base,
      registry,
      ok: false,
      reason: "seal_refused_identity_not_sealed",
    };
  }
  const identity = readCodeIntelligenceIdentity(base);
  const registry = buildCodeIntelligenceRegistryAuthority({
    sealed: true,
    identity,
  });
  if (!registry.coverageOk) {
    base[CINT_REGISTRY_KEY] = { ...registry, sealed: false, sealedAt: null };
    return {
      metadata: base,
      registry: { ...registry, sealed: false, sealedAt: null },
      ok: false,
      reason: "seal_refused_registry_coverage_incomplete",
    };
  }
  base[CINT_REGISTRY_KEY] = registry;
  return {
    metadata: base,
    registry,
    ok: true,
    reason: "registry_authority_sealed",
  };
}

export function readCodeIntelligenceRegistry(
  metadata?: unknown,
): CodeIntelligenceRegistryAuthority | null {
  const block = asRecord(asRecord(metadata)?.[CINT_REGISTRY_KEY]);
  if (!block || block.version !== "cint.registry.v1") return null;
  return block as CodeIntelligenceRegistryAuthority;
}

export function isCodeIntelligenceRegistrySealed(metadata?: unknown): boolean {
  return readCodeIntelligenceRegistry(metadata)?.sealed === true;
}

export function detectCodeIntelligenceRegistrySealIntent(
  userPrompt?: string | null,
): boolean {
  const text = String(userPrompt || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return false;
  return (
    /\bseal\b.{0,40}\bregistry\b/.test(text) ||
    /\bregistry\b.{0,40}\bseal\b/.test(text) ||
    /\baccept\b.{0,40}\bregistry\b/.test(text) ||
    /\bphase\s*3\b/.test(text) ||
    /\bregistry\s+authority\b/.test(text) ||
    /\bcint\.registry\.v1\b/.test(text) ||
    /\bstart\b.{0,30}\b(next|phase\s*3|registry)\b/.test(text)
  );
}

export function formatCodeIntelligenceRegistrySummaryLines(
  registry: CodeIntelligenceRegistryAuthority,
): string[] {
  const lines = [
    `○ CI Registry — ${registry.domains.length} authority domains · pack health ${registry.packAudit.health.overall}%`,
    registry.sealed
      ? `✓ cint.registry.v1 SEALED${registry.sealedAt ? ` at ${registry.sealedAt}` : ""}`
      : "○ cint.registry.v1 not sealed",
    registry.coverageOk
      ? "✓ Registry coverage PASS — slices map to pack pages/entities/features"
      : "✕ Registry coverage gaps — see packAudit / slice missing*",
    "○ Repair freeze remains ON — Phase 4 Entity Authority next",
  ];
  return lines;
}
