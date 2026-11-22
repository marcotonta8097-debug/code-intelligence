/** Shared CINT product pack identity — safe for client + server. */

export const CINT_PRODUCT_REPO_SLUG = "code-intelligence" as const;
export const CINT_PRODUCT_REPOSITORY_ID = "code-intelligence" as const;
export const CINT_PRODUCT_PACK_VERSION = "CINT-PACK-1.0" as const;

/** Directory roots that belong to the sealed CINT product (relative to repo root). */
export const CINT_PRODUCT_SOURCE_ROOTS = [
  "src/lib/cint",
  "src/core/codeIntelligence",
  "src/routes/api/projects/$projectId/cint",
  "src/routes/api/cint",
] as const;

/** Single files outside those roots that are CINT product surface. */
export const CINT_PRODUCT_SOURCE_FILES = [
  "src/lib/interaction/codeIntelligenceRuntime.ts",
  "src/lib/ai/generation/codeIntelligencePanels.ts",
  "src/lib/ai/generation/codeIntelligencePanels.test.ts",
  "src/lib/deploy/publishedProductDocument.ts",
  "src/components/deploy/PublishedProductLiveDocument.tsx",
  "docs/governance/CINT_KIL_DESIGN_ONLY.md",
] as const;
