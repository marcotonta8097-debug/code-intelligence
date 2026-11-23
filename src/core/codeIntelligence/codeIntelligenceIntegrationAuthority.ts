/**
 * cint.integration.v1 — Phase 6 Integration Authority (Code Intelligence).
 *
 * Seals inbound/outbound information lifecycle registries.
 * Authority model only — no UI generation, no new pages, no connector invent.
 * Requires Phase 5 workflow sealed. Repair freeze stays ON until explicit unlock.
 *
 * Lifecycle: Import → Analyze → Investigate → Remediate → Report → Share → Preserve
 */

import { isCodeIntelligenceWorkflowSealed } from "@/core/codeIntelligence/codeIntelligenceWorkflowAuthority";

export const CINT_INTEGRATION_KEY = "cint.integration.v1" as const;

export type CodeIntelligenceIntegrationPipelineKind =
  | "import"
  | "upload"
  | "export"
  | "screenshot"
  | "reporting"
  | "print"
  | "share"
  | "external";

/** Shared governance fields for every integration workflow. */
export type CodeIntelligenceIntegrationFlowContract = Readonly<{
  id: string;
  label: string;
  kind: CodeIntelligenceIntegrationPipelineKind;
  source: string;
  validation: string;
  storage: string;
  ownership: string;
  permissions: readonly string[];
  exportability: string;
  auditability: string;
  /** Existing sealed pages this flow may attach to — never invents PAGE. */
  hostPages: readonly string[];
  /** Demo / interactive_prototype only until Production Authority. */
  status: "authority_sealed" | "connector_deferred";
}>;

export type CodeIntelligenceIntegrationRegistrySlice = Readonly<{
  id: string;
  title: string;
  purpose: string;
  flows: readonly CodeIntelligenceIntegrationFlowContract[];
}>;

export type CodeIntelligenceIntegrationAuthority = Readonly<{
  version: "cint.integration.v1";
  sealed: boolean;
  sealedAt: string | null;
  fieldRegistryId: "field:code_intelligence";
  requiresWorkflowSealed: true;
  lifecycle: readonly [
    "Import",
    "Analyze",
    "Investigate",
    "Remediate",
    "Report",
    "Share",
    "Preserve",
  ];
  registries: readonly CodeIntelligenceIntegrationRegistrySlice[];
  forbidden: readonly string[];
  coverageOk: boolean;
  constitution: readonly string[];
}>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function flow(
  partial: Omit<CodeIntelligenceIntegrationFlowContract, "status"> & {
    status?: CodeIntelligenceIntegrationFlowContract["status"];
  },
): CodeIntelligenceIntegrationFlowContract {
  return {
    ...partial,
    status: partial.status ?? "authority_sealed",
  };
}

/** Canonical Phase 6 registries — sealed meaning only; connectors remain deferred. */
export function buildCodeIntelligenceIntegrationRegistries(): readonly CodeIntelligenceIntegrationRegistrySlice[] {
  return [
    {
      id: "import_registry",
      title: "Import Registry",
      purpose: "Inbound repository sources → normalized analysis queue.",
      flows: [
        flow({
          id: "import.github",
          label: "GitHub",
          kind: "import",
          source: "GitHub OAuth (CINT /cint/github) + owner/repo or github.com URL — stamps cint.connector.liveIndex.v1",
          validation: "Normalize URL→owner/repo; OAuth connected; branch/tree sync; never silent source mutation",
          storage: "Repository · Branch · Commit · Manifest · liveIndex metadata (PDS honesty)",
          ownership: "Repository Authority + Analysis Authority",
          permissions: ["admin", "analyst"],
          exportability: "Normalized snapshot exportable as JSON after analysis",
          auditability: "Import event + operator id + commit SHA + timestamp",
          hostPages: ["Repositories", "Overview", "History"],
          status: "authority_sealed",
        }),
        flow({
          id: "import.gitlab",
          label: "GitLab",
          kind: "import",
          source: "GitLab project URL / token (deferred)",
          validation: "Project access + default branch resolve",
          storage: "Repository · Branch · Commit · Manifest · Dependencies",
          ownership: "Repository Authority",
          permissions: ["admin", "analyst"],
          exportability: "JSON snapshot",
          auditability: "Import audit trail",
          hostPages: ["Repositories", "History"],
          status: "connector_deferred",
        }),
        flow({
          id: "import.azure_devops",
          label: "Azure DevOps",
          kind: "import",
          source: "Azure DevOps repo URL / PAT (deferred)",
          validation: "Org/project/repo resolve",
          storage: "Repository · Branch · Commit · Manifest · Dependencies",
          ownership: "Repository Authority",
          permissions: ["admin", "analyst"],
          exportability: "JSON snapshot",
          auditability: "Import audit trail",
          hostPages: ["Repositories", "History"],
          status: "connector_deferred",
        }),
        flow({
          id: "import.bitbucket",
          label: "Bitbucket",
          kind: "import",
          source: "Bitbucket workspace/repo (deferred)",
          validation: "Workspace access + branch",
          storage: "Repository · Branch · Commit · Manifest · Dependencies",
          ownership: "Repository Authority",
          permissions: ["admin", "analyst"],
          exportability: "JSON snapshot",
          auditability: "Import audit trail",
          hostPages: ["Repositories", "History"],
          status: "connector_deferred",
        }),
        flow({
          id: "import.zip_upload",
          label: "ZIP Upload",
          kind: "import",
          source: "Upload ledger register (+ optional local_snapshot extract via repositoryId/tree) — /cint/upload + /cint/import",
          validation: "Filename required; bytes deferred; optional demo tree extract without OAuth",
          storage: "Upload ledger · optional Repository snapshot in cintEntityStore",
          ownership: "Repository Authority + cintIngressEgressPipeline",
          permissions: ["admin", "analyst"],
          exportability: "Upload rows included in cint.export.v1",
          auditability: "Upload id + filename + registeredAt",
          hostPages: ["Repositories"],
          status: "authority_sealed",
        }),
        flow({
          id: "import.local_repository",
          label: "Local Repository / Snapshot",
          kind: "import",
          source: "local_snapshot demo trees (payments-api · catalog-service) via /cint/import — proves extract without GitHub OAuth",
          validation: "Known snapshot id or provided tree; stamps liveIndex provider=local_snapshot",
          storage: "Repository tree in cintEntityStore + liveIndex metadata",
          ownership: "Repository Authority + cintIngressEgressPipeline",
          permissions: ["admin", "analyst"],
          exportability: "JSON / CSV / Markdown export of sealed store",
          auditability: "Local import event + commitSha + fileCount",
          hostPages: ["Repositories"],
          status: "authority_sealed",
        }),
      ],
    },
    {
      id: "upload_registry",
      title: "Upload Registry",
      purpose: "User uploads linked into workspace assets — never invent pages.",
      flows: [
        flow({
          id: "upload.zip",
          label: "ZIP",
          kind: "upload",
          source: "File picker / drag-drop",
          validation: "Type/size; nest depth; quarantine until validated",
          storage: "Object store key (deferred) · demo blob id",
          ownership: "Evidence Authority or Repository Authority by intent",
          permissions: ["admin", "analyst", "reviewer"],
          exportability: "Download original + linked metadata",
          auditability: "Upload + link + unlink events",
          hostPages: ["Repositories", "Findings", "Documentation"],
        }),
        flow({
          id: "upload.images",
          label: "Images",
          kind: "upload",
          source: "Image files",
          validation: "Image MIME allowlist",
          storage: "Evidence attachment store",
          ownership: "Evidence Authority",
          permissions: ["admin", "analyst", "reviewer"],
          exportability: "Include in reports / PDF",
          auditability: "Attachment audit",
          hostPages: ["Findings", "Evidence surfaces on Findings", "Documentation"],
        }),
        flow({
          id: "upload.screenshots",
          label: "Screenshots",
          kind: "upload",
          source: "Capture or file upload",
          validation: "Image MIME; optional finding/report link required for preserve",
          storage: "Screenshot Authority store",
          ownership: "Evidence Authority / Report Authority",
          permissions: ["admin", "analyst", "reviewer"],
          exportability: "Attach to reports and print packs",
          auditability: "Capture context + target asset id",
          hostPages: ["Findings", "Architecture", "Remediation"],
        }),
        flow({
          id: "upload.documents",
          label: "Documents",
          kind: "upload",
          source: "PDF/DOC/MD uploads",
          validation: "Doc MIME allowlist; virus scan deferred",
          storage: "Knowledge / Documentation attachments",
          ownership: "Knowledge Authority (Phase 8 placeholder ownership)",
          permissions: ["admin", "analyst"],
          exportability: "Download + cite in reports",
          auditability: "Doc link audit",
          hostPages: ["Documentation", "History"],
        }),
        flow({
          id: "upload.architecture_diagrams",
          label: "Architecture Diagrams",
          kind: "upload",
          source: "Diagram images / SVG",
          validation: "Image/SVG allowlist",
          storage: "Architecture Knowledge attachments",
          ownership: "Architecture Authority",
          permissions: ["admin", "analyst"],
          exportability: "Architecture report embeds",
          auditability: "Diagram revision audit",
          hostPages: ["Architecture", "Documentation"],
        }),
        flow({
          id: "upload.evidence_attachments",
          label: "Evidence Attachments",
          kind: "upload",
          source: "Any evidence-linked file",
          validation: "Must link Finding or Investigation id",
          storage: "Evidence Authority",
          ownership: "Evidence Authority",
          permissions: ["admin", "analyst", "reviewer"],
          exportability: "Evidence export packs",
          auditability: "Evidence chain-of-custody events",
          hostPages: ["Findings", "Security"],
        }),
      ],
    },
    {
      id: "export_registry",
      title: "Export Registry",
      purpose: "Outbound formats for every major workspace surface.",
      flows: [
        flow({
          id: "export.pdf",
          label: "PDF",
          kind: "export",
          source: "Findings · Evidence · Investigations · Reports · Remediations · Architecture",
          validation: "Operator role + scoped asset selection",
          storage: "Generated artifact (ephemeral then download)",
          ownership: "Report Authority",
          permissions: ["admin", "analyst", "reviewer", "viewer"],
          exportability: "PDF download",
          auditability: "Export event with scope hash",
          hostPages: [
            "Findings",
            "Remediation",
            "Architecture",
            "Security",
            "Overview",
            "Documentation",
          ],
        }),
        flow({
          id: "export.csv",
          label: "CSV",
          kind: "export",
          source: "Findings · Dependencies · Remediations tabular",
          validation: "Column schema from sealed entities only",
          storage: "Generated CSV",
          ownership: "Finding / Remediation Authority",
          permissions: ["admin", "analyst", "reviewer", "viewer"],
          exportability: "CSV download",
          auditability: "Export audit",
          hostPages: ["Findings", "Dependencies", "Remediation", "Quality"],
        }),
        flow({
          id: "export.json",
          label: "JSON",
          kind: "export",
          source: "Any sealed entity snapshot",
          validation: "Schema version stamp cint.*",
          storage: "Generated JSON",
          ownership: "Owning authority domain",
          permissions: ["admin", "analyst"],
          exportability: "JSON download",
          auditability: "Export audit",
          hostPages: ["Findings", "Architecture", "Repositories", "History"],
        }),
        flow({
          id: "export.markdown",
          label: "Markdown",
          kind: "export",
          source: "Reports · Investigations · Documentation",
          validation: "No secret leakage filters",
          storage: "Generated MD",
          ownership: "Report / Knowledge Authority",
          permissions: ["admin", "analyst", "reviewer", "viewer"],
          exportability: "MD download",
          auditability: "Export audit",
          hostPages: ["Documentation", "Findings", "Overview"],
        }),
        flow({
          id: "export.print_view",
          label: "Print View",
          kind: "export",
          source: "Print Authority layouts",
          validation: "Print stylesheet + role",
          storage: "Browser print surface (no new PAGE)",
          ownership: "Report Authority",
          permissions: ["admin", "analyst", "reviewer", "viewer"],
          exportability: "Print / Save as PDF via browser",
          auditability: "Print intent event",
          hostPages: ["Findings", "Architecture", "Remediation", "Overview"],
        }),
      ],
    },
    {
      id: "screenshot_registry",
      title: "Screenshot Authority",
      purpose: "Capture → attach to finding/report — first-class evidence path.",
      flows: [
        flow({
          id: "screenshot.finding",
          label: "Finding Screenshot",
          kind: "screenshot",
          source: "Workspace capture on Findings",
          validation: "Finding id required",
          storage: "Evidence attachment",
          ownership: "Evidence Authority",
          permissions: ["admin", "analyst", "reviewer"],
          exportability: "Report/PDF embed",
          auditability: "Capture + finding id",
          hostPages: ["Findings", "Security"],
        }),
        flow({
          id: "screenshot.architecture",
          label: "Architecture Screenshot",
          kind: "screenshot",
          source: "Architecture map capture",
          validation: "Repo/commit context required",
          storage: "Architecture attachment",
          ownership: "Architecture Authority",
          permissions: ["admin", "analyst"],
          exportability: "Architecture report",
          auditability: "Capture audit",
          hostPages: ["Architecture"],
        }),
        flow({
          id: "screenshot.investigation",
          label: "Investigation Screenshot",
          kind: "screenshot",
          source: "Investigation workspace capture",
          validation: "Investigation id required",
          storage: "Evidence / Investigation attachment",
          ownership: "Investigation Authority",
          permissions: ["admin", "analyst", "reviewer"],
          exportability: "Investigation report",
          auditability: "Capture audit",
          hostPages: ["Findings"],
        }),
        flow({
          id: "screenshot.evidence",
          label: "Evidence Screenshot",
          kind: "screenshot",
          source: "Evidence explorer capture",
          validation: "Evidence id required",
          storage: "Evidence Authority",
          ownership: "Evidence Authority",
          permissions: ["admin", "analyst", "reviewer"],
          exportability: "Evidence pack",
          auditability: "Capture audit",
          hostPages: ["Findings", "Security"],
        }),
      ],
    },
    {
      id: "reporting_registry",
      title: "Reporting Registry",
      purpose: "Report kinds and export targets — not a new Reports PAGE invent.",
      flows: [
        flow({
          id: "report.executive",
          label: "Executive Report",
          kind: "reporting",
          source: "Overview KPIs + top findings",
          validation: "Repo/commit scope",
          storage: "Generated report artifact",
          ownership: "Report Authority",
          permissions: ["admin", "analyst", "viewer"],
          exportability: "PDF · Print · Download · Share (deferred)",
          auditability: "Report generation audit",
          hostPages: ["Overview"],
        }),
        flow({
          id: "report.engineering",
          label: "Engineering Report",
          kind: "reporting",
          source: "Findings · Quality · Dependencies",
          validation: "Scope filters",
          storage: "Generated report artifact",
          ownership: "Report Authority",
          permissions: ["admin", "analyst", "reviewer"],
          exportability: "PDF · CSV · MD · Print",
          auditability: "Report audit",
          hostPages: ["Findings", "Quality", "Dependencies"],
        }),
        flow({
          id: "report.security",
          label: "Security Report",
          kind: "reporting",
          source: "Security posture + SEV findings",
          validation: "Severity scope",
          storage: "Generated report artifact",
          ownership: "Report Authority + Finding Authority",
          permissions: ["admin", "analyst", "reviewer"],
          exportability: "PDF · JSON · Print",
          auditability: "Report audit",
          hostPages: ["Security", "Findings"],
        }),
        flow({
          id: "report.architecture",
          label: "Architecture Report",
          kind: "reporting",
          source: "Architecture knowledge graph",
          validation: "Repo/commit",
          storage: "Generated report artifact",
          ownership: "Architecture Authority",
          permissions: ["admin", "analyst"],
          exportability: "PDF · MD · Print",
          auditability: "Report audit",
          hostPages: ["Architecture"],
        }),
        flow({
          id: "report.repository",
          label: "Repository Report",
          kind: "reporting",
          source: "Repository Intelligence profile",
          validation: "Active repository",
          storage: "Generated report artifact",
          ownership: "Repository Authority",
          permissions: ["admin", "analyst", "viewer"],
          exportability: "PDF · JSON · Print",
          auditability: "Report audit",
          hostPages: ["Repositories", "Overview"],
        }),
        flow({
          id: "report.investigation",
          label: "Investigation Report",
          kind: "reporting",
          source: "Investigation + evidence chain",
          validation: "Investigation id",
          storage: "Generated report artifact",
          ownership: "Investigation Authority",
          permissions: ["admin", "analyst", "reviewer"],
          exportability: "PDF · MD · Print · Share (deferred)",
          auditability: "Report audit",
          hostPages: ["Findings"],
        }),
      ],
    },
    {
      id: "print_registry",
      title: "Print Authority",
      purpose: "Enterprise print layouts on existing pages — no brochure invent.",
      flows: [
        flow({
          id: "print.findings",
          label: "Print Findings",
          kind: "print",
          source: "Findings table + detail",
          validation: "Role + filters",
          storage: "Print stylesheet only",
          ownership: "Finding Authority",
          permissions: ["admin", "analyst", "reviewer", "viewer"],
          exportability: "Print / system PDF",
          auditability: "Print intent",
          hostPages: ["Findings"],
        }),
        flow({
          id: "print.investigations",
          label: "Print Investigations",
          kind: "print",
          source: "Investigation detail on Findings",
          validation: "Investigation id",
          storage: "Print stylesheet",
          ownership: "Investigation Authority",
          permissions: ["admin", "analyst", "reviewer"],
          exportability: "Print",
          auditability: "Print intent",
          hostPages: ["Findings"],
        }),
        flow({
          id: "print.evidence",
          label: "Print Evidence",
          kind: "print",
          source: "Evidence pack",
          validation: "Evidence ids",
          storage: "Print stylesheet",
          ownership: "Evidence Authority",
          permissions: ["admin", "analyst", "reviewer"],
          exportability: "Print",
          auditability: "Print intent",
          hostPages: ["Findings", "Security"],
        }),
        flow({
          id: "print.reports",
          label: "Print Reports",
          kind: "print",
          source: "Reporting Registry artifacts",
          validation: "Report id",
          storage: "Print stylesheet",
          ownership: "Report Authority",
          permissions: ["admin", "analyst", "viewer"],
          exportability: "Print",
          auditability: "Print intent",
          hostPages: ["Overview", "Documentation"],
        }),
        flow({
          id: "print.architecture_maps",
          label: "Print Architecture Maps",
          kind: "print",
          source: "Architecture graph + diagrams",
          validation: "Repo/commit",
          storage: "Print stylesheet",
          ownership: "Architecture Authority",
          permissions: ["admin", "analyst"],
          exportability: "Print",
          auditability: "Print intent",
          hostPages: ["Architecture"],
        }),
      ],
    },
    {
      id: "share_registry",
      title: "Share Authority",
      purpose: "Future-ready share links — permissions controlled; deferred connectors.",
      flows: [
        flow({
          id: "share.report",
          label: "Share Report",
          kind: "share",
          source: "Reporting artifact",
          validation: "Expiry + role ACL",
          storage: "Temporary link token (deferred)",
          ownership: "Report Authority",
          permissions: ["admin", "analyst"],
          exportability: "Temporary link",
          auditability: "Share create/revoke audit",
          hostPages: ["Overview", "Documentation"],
          status: "connector_deferred",
        }),
        flow({
          id: "share.investigation",
          label: "Share Investigation",
          kind: "share",
          source: "Investigation record",
          validation: "ACL + expiry",
          storage: "Temporary link token (deferred)",
          ownership: "Investigation Authority",
          permissions: ["admin", "analyst"],
          exportability: "Temporary link",
          auditability: "Share audit",
          hostPages: ["Findings"],
          status: "connector_deferred",
        }),
        flow({
          id: "share.findings",
          label: "Share Findings",
          kind: "share",
          source: "Finding set",
          validation: "ACL + redaction rules",
          storage: "Temporary link token (deferred)",
          ownership: "Finding Authority",
          permissions: ["admin", "analyst"],
          exportability: "Temporary link",
          auditability: "Share audit",
          hostPages: ["Findings", "Security"],
          status: "connector_deferred",
        }),
        flow({
          id: "share.temporary_link",
          label: "Generate Temporary Link",
          kind: "share",
          source: "Any shareable sealed asset",
          validation: "TTL required; max scope",
          storage: "Token store (deferred)",
          ownership: "Platform Authority (Phase 9 placeholder)",
          permissions: ["admin"],
          exportability: "URL",
          auditability: "Token lifecycle audit",
          hostPages: ["Settings", "Overview"],
          status: "connector_deferred",
        }),
      ],
    },
    {
      id: "external_integrations_registry",
      title: "External Integrations Registry",
      purpose: "Future connectors — authority reserved; no live wiring in this seal.",
      flows: [
        flow({
          id: "ext.github",
          label: "GitHub",
          kind: "external",
          source: "GitHub Apps / OAuth (deferred)",
          validation: "Installation scopes",
          storage: "Integration credential vault (deferred)",
          ownership: "Platform Authority",
          permissions: ["admin"],
          exportability: "N/A inbound/outbound webhooks later",
          auditability: "Connector enable/disable audit",
          hostPages: ["Settings", "Repositories"],
          status: "connector_deferred",
        }),
        flow({
          id: "ext.gitlab",
          label: "GitLab",
          kind: "external",
          source: "GitLab OAuth (deferred)",
          validation: "Scopes",
          storage: "Credential vault (deferred)",
          ownership: "Platform Authority",
          permissions: ["admin"],
          exportability: "N/A",
          auditability: "Connector audit",
          hostPages: ["Settings", "Repositories"],
          status: "connector_deferred",
        }),
        flow({
          id: "ext.azure_devops",
          label: "Azure DevOps",
          kind: "external",
          source: "Azure AD app (deferred)",
          validation: "Scopes",
          storage: "Credential vault (deferred)",
          ownership: "Platform Authority",
          permissions: ["admin"],
          exportability: "N/A",
          auditability: "Connector audit",
          hostPages: ["Settings", "Repositories"],
          status: "connector_deferred",
        }),
        flow({
          id: "ext.jira",
          label: "Jira",
          kind: "external",
          source: "Jira Cloud/Server (deferred)",
          validation: "Project mapping to Finding/Remediation",
          storage: "Credential vault (deferred)",
          ownership: "Remediation Authority",
          permissions: ["admin"],
          exportability: "Issue sync outbound (deferred)",
          auditability: "Sync audit",
          hostPages: ["Remediation", "Settings"],
          status: "connector_deferred",
        }),
        flow({
          id: "ext.linear",
          label: "Linear",
          kind: "external",
          source: "Linear API (deferred)",
          validation: "Team/project mapping",
          storage: "Credential vault (deferred)",
          ownership: "Remediation Authority",
          permissions: ["admin"],
          exportability: "Issue sync (deferred)",
          auditability: "Sync audit",
          hostPages: ["Remediation", "Settings"],
          status: "connector_deferred",
        }),
        flow({
          id: "ext.confluence",
          label: "Confluence",
          kind: "external",
          source: "Confluence spaces (deferred)",
          validation: "Space ACL",
          storage: "Credential vault (deferred)",
          ownership: "Knowledge Authority",
          permissions: ["admin"],
          exportability: "Publish report pages (deferred)",
          auditability: "Publish audit",
          hostPages: ["Documentation", "Settings"],
          status: "connector_deferred",
        }),
        flow({
          id: "ext.teams",
          label: "Teams",
          kind: "external",
          source: "Microsoft Teams webhook (deferred)",
          validation: "Channel webhook URL",
          storage: "Credential vault (deferred)",
          ownership: "Platform Authority",
          permissions: ["admin"],
          exportability: "Notify only",
          auditability: "Notify audit",
          hostPages: ["Settings"],
          status: "connector_deferred",
        }),
        flow({
          id: "ext.slack",
          label: "Slack",
          kind: "external",
          source: "Slack app (deferred)",
          validation: "Workspace install scopes",
          storage: "Credential vault (deferred)",
          ownership: "Platform Authority",
          permissions: ["admin"],
          exportability: "Notify only",
          auditability: "Notify audit",
          hostPages: ["Settings"],
          status: "connector_deferred",
        }),
      ],
    },
  ];
}

export function buildCodeIntelligenceIntegrationAuthority(options?: {
  sealed?: boolean;
}): CodeIntelligenceIntegrationAuthority {
  const sealed = options?.sealed === true;
  const registries = buildCodeIntelligenceIntegrationRegistries();
  const requiredIds = [
    "import_registry",
    "upload_registry",
    "export_registry",
    "screenshot_registry",
    "reporting_registry",
    "print_registry",
    "share_registry",
    "external_integrations_registry",
  ] as const;
  const owned = new Set(registries.map((r) => r.id));
  const flowCount = registries.reduce((n, r) => n + r.flows.length, 0);
  const coverageOk =
    requiredIds.every((id) => owned.has(id)) &&
    flowCount >= 30 &&
    registries.every((r) => r.flows.length > 0);

  return {
    version: "cint.integration.v1",
    sealed,
    sealedAt: sealed ? new Date().toISOString() : null,
    fieldRegistryId: "field:code_intelligence",
    requiresWorkflowSealed: true,
    lifecycle: [
      "Import",
      "Analyze",
      "Investigate",
      "Remediate",
      "Report",
      "Share",
      "Preserve",
    ],
    registries,
    forbidden: [
      "No new PAGE invent for Import/Export/Reports/Share hubs",
      "No live GitHub/GitLab/Jira/Slack wiring in this seal",
      "No FOC / CRM / store connector bleed",
      "No silent source mutation on import",
      "Share links require ACL + expiry when implemented",
      "UI generation forbidden in Phase 6 — authority only",
    ],
    coverageOk,
    constitution: [
      "Subordinate to cint.constitution.v1 — Intelligence ≠ Authority; Evidence Before Conclusions.",
      "Integration Authority governs asset movement: Import → Analyze → Investigate → Remediate → Report → Share → Preserve.",
      "Every flow declares Source · Validation · Storage · Ownership · Permissions · Exportability · Auditability.",
      "Connectors may be deferred (status=connector_deferred) without inventing UI or pages.",
      "Host pages must already exist in the sealed pack — Phase 6 never reseeds pageContract.",
      "Phase 7 projects Import/Upload/Export onto hostPages (FEATURE/SECTION) — constitutionally required for claim/test value.",
      "Screenshot and Print are architecture, not cosmetics.",
      "Requires cint.workflow.v1 sealed. Repair freeze remains ON until explicit unlock.",
      "L4/L5 Execute remains approval-gated (Article VII) even after host surfaces land.",
    ],
  };
}

export function persistCodeIntelligenceIntegrationDraft(
  metadata: unknown,
): { metadata: Record<string, unknown>; integration: CodeIntelligenceIntegrationAuthority } {
  const base = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  const integration = buildCodeIntelligenceIntegrationAuthority({ sealed: false });
  base[CINT_INTEGRATION_KEY] = integration;
  return { metadata: base, integration };
}

export function sealCodeIntelligenceIntegration(
  metadata: unknown,
): {
  metadata: Record<string, unknown>;
  integration: CodeIntelligenceIntegrationAuthority;
  ok: boolean;
  reason: string;
} {
  const base = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  if (!isCodeIntelligenceWorkflowSealed(base)) {
    const integration = buildCodeIntelligenceIntegrationAuthority({ sealed: false });
    base[CINT_INTEGRATION_KEY] = integration;
    return {
      metadata: base,
      integration,
      ok: false,
      reason: "seal_refused_workflow_not_sealed",
    };
  }
  const integration = buildCodeIntelligenceIntegrationAuthority({ sealed: true });
  if (!integration.coverageOk) {
    const draft = { ...integration, sealed: false, sealedAt: null };
    base[CINT_INTEGRATION_KEY] = draft;
    return {
      metadata: base,
      integration: draft,
      ok: false,
      reason: "seal_refused_integration_coverage_incomplete",
    };
  }
  base[CINT_INTEGRATION_KEY] = integration;
  return { metadata: base, integration, ok: true, reason: "integration_authority_sealed" };
}

export function readCodeIntelligenceIntegration(
  metadata?: unknown,
): CodeIntelligenceIntegrationAuthority | null {
  const block = asRecord(asRecord(metadata)?.[CINT_INTEGRATION_KEY]);
  if (!block || block.version !== "cint.integration.v1") return null;
  return block as CodeIntelligenceIntegrationAuthority;
}

export function isCodeIntelligenceIntegrationSealed(metadata?: unknown): boolean {
  return readCodeIntelligenceIntegration(metadata)?.sealed === true;
}

export function detectCodeIntelligenceIntegrationSealIntent(
  userPrompt?: string | null,
): boolean {
  const text = String(userPrompt || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return false;
  return (
    /\bseal\b.{0,40}\bintegration\b/.test(text) ||
    /\bintegration\b.{0,40}\bseal\b/.test(text) ||
    /\baccept\b.{0,40}\bintegration\b/.test(text) ||
    /\bphase\s*6\b/.test(text) ||
    /\bintegration\s+authority\b/.test(text) ||
    /\bcint\.integration\.v1\b/.test(text) ||
    /\bseal\b.{0,40}\b(import|export|upload|screenshot|reporting|print|share)\s+registry\b/.test(
      text,
    )
  );
}

export function formatCodeIntelligenceIntegrationSummaryLines(
  integration: CodeIntelligenceIntegrationAuthority,
): string[] {
  const flows = integration.registries.reduce((n, r) => n + r.flows.length, 0);
  const deferred = integration.registries
    .flatMap((r) => r.flows)
    .filter((f) => f.status === "connector_deferred").length;
  return [
    `○ CI Integration — ${integration.registries.length} registries · ${flows} flows · ${deferred} connector(s) deferred`,
    integration.sealed
      ? `✓ cint.integration.v1 SEALED${integration.sealedAt ? ` at ${integration.sealedAt}` : ""}`
      : "○ cint.integration.v1 not sealed",
    integration.coverageOk
      ? "✓ Integration coverage PASS — Import/Upload/Export/Screenshot/Reporting/Print/Share/External present"
      : "✕ Integration coverage gaps",
    integration.sealed
      ? "○ Phase 6 complete — repair freeze still ON until explicit unlock (no UI invent)"
      : "○ Repair freeze remains ON — seal integration after workflow",
  ];
}
