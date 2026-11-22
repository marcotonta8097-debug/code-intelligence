/**
 * Phase 7 — Integration Host Surfaces (cint.integration.hosts.v1).
 *
 * Projects Import / Upload / Export / Print / Share / Report FEATURE sections
 * onto sealed host pages from cint.integration.v1 — never invents PAGE.
 * Subordinate to cint.constitution.v1 (Evidence Before Conclusions; L3 Prepare only).
 */

export const CINT_INTEGRATION_HOSTS_KEY = "cint.integration.hosts.v1" as const;
export const CINT_INTEGRATION_HOSTS_MARK = "data-cint-integration-host" as const;
/** 1.8 — balanced nested-&lt;section&gt; strip so orphans cannot escape data-view into body. */
export const CINT_INTEGRATION_HOSTS_VERSION = "CINT-IHS-1.9" as const;

export type CodeIntelligenceIntegrationHostKind =
  | "import"
  | "upload"
  | "export"
  | "print"
  | "share"
  | "report"
  | "evidence";

const HOST_CSS = `
/* CINT-IHS-1.9 — single-column by default; orphans only under .website-shell (CI app keeps IHS). */
[data-cint-integration-host]{margin:1.25rem 0 1.5rem;padding:1rem 1.1rem 1.25rem;border:1px solid #d3dde8;border-radius:.7rem;background:#fff;box-shadow:0 8px 20px rgba(15,27,45,.05);box-sizing:border-box;position:relative;z-index:1;display:block;width:100%;max-width:100%;min-width:0;overflow:hidden}
[data-cint-integration-host] > h3{margin:.05rem 0 .35rem;font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:#5b6b7c}
[data-cint-integration-host] .cint-ihs-lead{margin:0 0 .75rem;color:#5b6b7c;font-size:.9rem;line-height:1.45;max-width:48rem}
[data-cint-integration-host] .cint-ihs-grid{display:grid;gap:.85rem;grid-template-columns:1fr;width:100%;max-width:100%;min-width:0;box-sizing:border-box}
@media (min-width:48rem){[data-cint-integration-host] .cint-ihs-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}}
[data-cint-integration-host] .cint-ihs-card{border:1px solid #e2e8f0;border-radius:.55rem;padding:.75rem .85rem 1rem;background:#f8fafc;box-sizing:border-box;min-width:0;max-width:100%;overflow:hidden}
[data-cint-integration-host] .cint-ihs-card h4{margin:0 0 .4rem;font-size:.95rem;color:#0f1b2d}
[data-cint-integration-host] .cint-ihs-card p{margin:0 0 .55rem;font-size:.82rem;color:#5b6b7c;line-height:1.4}
[data-cint-integration-host] .cint-ihs-meta{display:flex;flex-wrap:wrap;gap:.35rem;margin:0 0 .55rem;min-width:0}
[data-cint-integration-host] .cint-ihs-chip{font-size:10px;letter-spacing:.04em;text-transform:uppercase;padding:.15rem .45rem;border-radius:999px;border:1px solid #d3dde8;background:#eef4f8;color:#355066}
[data-cint-integration-host] .cint-ihs-chip[data-level="prepare"]{border-color:#f59e0b;background:#fffbeb;color:#92400e}
[data-cint-integration-host] .cint-ihs-chip[data-level="observe"]{border-color:#93c5fd;background:#eff6ff;color:#1e40af}
[data-cint-integration-host] form{display:grid;gap:.4rem;max-width:100%;margin:0;min-width:0}
[data-cint-integration-host] label{display:grid;gap:.2rem;font-size:.8rem;color:#5b6b7c;min-width:0}
[data-cint-integration-host] input,[data-cint-integration-host] select{background:#fff;border:1px solid #d3dde8;border-radius:.4rem;padding:.38rem .55rem;color:#122033;max-width:100%;box-sizing:border-box}
[data-cint-integration-host] .cint-ihs-actions{display:flex;flex-wrap:wrap;gap:.4rem;align-items:center;margin:0 0 .15rem;min-width:0;max-width:100%}
[data-cint-integration-host] .cint-ihs-actions .app-btn{max-width:100%;white-space:normal}
[data-cint-integration-host] [data-cint-ihs-log]{margin:.65rem 0 0;font-size:.8rem;color:#355066;min-height:1.2rem}
[data-cint-integration-host] > section{margin-top:.85rem;padding-bottom:.15rem;min-width:0;max-width:100%;overflow-x:auto}
[data-cint-integration-host] table{width:100%;max-width:100%;table-layout:fixed;border-collapse:separate;border-spacing:0;background:#fff;border:1px solid #d3dde8;border-radius:.55rem;box-sizing:border-box}
[data-cint-integration-host] th,[data-cint-integration-host] td{border-bottom:1px solid #e2e8f0;padding:.45rem .55rem;text-align:left;vertical-align:top;word-break:break-word;overflow-wrap:anywhere;font-size:.8rem}
[data-cint-integration-host] th{color:#5b6b7c;font-weight:650;background:#f0f4f8;font-size:10px;letter-spacing:.04em;text-transform:uppercase}
[data-cint-integration-host] tr:last-child td{border-bottom:0}
[data-cint-evidence-chain]{margin:1rem 0 1.25rem;padding:.85rem 1rem;border:1px dashed #94a3b8;border-radius:.55rem;background:#f8fafc;max-width:100%;min-width:0;box-sizing:border-box;overflow-x:auto}
[data-cint-evidence-chain] h4{margin:0 0 .35rem;font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:#5b6b7c}
[data-cint-evidence-chain] dl{display:grid;grid-template-columns:minmax(7rem,auto) minmax(0,1fr);gap:.25rem .75rem;margin:0;font-size:.85rem;min-width:0}
[data-cint-evidence-chain] dt{color:#64748b;font-weight:600}
[data-cint-evidence-chain] dd{margin:0;color:#0f1b2d;min-width:0;overflow-wrap:anywhere}
/* Gateway / marketing — integration is workspace-only (never over Landing). */
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"]:not([data-cint-authed="1"]) [data-cint-integration-host],
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"]:not([data-cint-authed="1"]) [data-cint-evidence-chain],
.app-shell[data-cint-app-shell="1"] [data-view="landing"] [data-cint-integration-host],
.app-shell[data-cint-app-shell="1"] [data-view="landing"] [data-cint-evidence-chain],
.app-shell[data-cint-app-shell="1"] [data-cint-marketing] [data-cint-integration-host],
.app-shell[data-cint-app-shell="1"] [data-cint-marketing] [data-cint-evidence-chain],
/* Orphans only — never hide IHS nested inside data-cint-app-shell (CI lives under .website-shell). */
body > [data-cint-integration-host],
body > [data-cint-evidence-chain],
.website-shell > [data-cint-integration-host],
.website-shell > [data-cint-evidence-chain],
.website-shell > :not([data-cint-app-shell]) [data-cint-integration-host],
.website-shell > :not([data-cint-app-shell]) [data-cint-evidence-chain],
.app-shell[data-cint-app-shell="1"] > [data-cint-integration-host],
.app-shell[data-cint-app-shell="1"] > [data-cint-evidence-chain]{display:none!important;visibility:hidden!important;height:0!important;max-height:0!important;overflow:hidden!important;margin:0!important;padding:0!important;border:0!important;pointer-events:none!important}
`;

export function codeIntelligenceIntegrationHostCss(): string {
  return `/* ${CINT_INTEGRATION_HOSTS_VERSION} */\n${HOST_CSS}`;
}

function chip(level: "observe" | "prepare", label: string): string {
  return `<span class="cint-ihs-chip" data-level="${level}">${label}</span>`;
}

function hostShell(
  kind: CodeIntelligenceIntegrationHostKind,
  title: string,
  lead: string,
  body: string,
): string {
  return `<section ${CINT_INTEGRATION_HOSTS_MARK}="1" data-cint-ihs-kind="${kind}" data-cint-ihs-version="${CINT_INTEGRATION_HOSTS_VERSION}">
  <h3>${title}</h3>
  <p class="cint-ihs-lead">${lead}</p>
  ${body}
  <p data-cint-ihs-log aria-live="polite"></p>
</section>`;
}

/** Repositories — Import + Upload ingress. */
export function buildRepositoriesIntegrationHostHtml(): string {
  return hostShell(
    "import",
    "Integration — Import & Upload",
    "Constitutional evidence ingress (Article II / P2). Prove extract before analyzers: local_snapshot is live without OAuth; GitHub needs CINT_GITHUB_CLIENT_ID/SECRET + Connect; ZIP file upload extracts bytes into the repository store. No silent source mutation.",
    `<div class="cint-ihs-grid">
      <div class="cint-ihs-card" data-cint-ihs-github-card>
        <h4>Import / extract repository</h4>
        <div class="cint-ihs-meta">${chip("observe", "Local extract live")} ${chip("observe", "GitHub when OAuth")} ${chip("prepare", "GitLab/Azure/BB")}</div>
        <p>Use <strong>Local snapshot</strong> with <code>payments-api</code> or <code>catalog-service</code> to prove extract→store without GitHub. GitHub needs <code>owner/repo</code> after Connect. Prefer the Upload card for real ZIP bytes.</p>
        <form data-cint-form="cint-import" data-cint-ihs-flow="import.github">
          <label>Source
            <select name="provider">
              <option value="local_snapshot">Local snapshot (no OAuth)</option>
              <option value="github">GitHub</option>
              <option value="zip_upload">ZIP register (use Upload for bytes)</option>
              <option value="local_repository">Local repository</option>
              <option value="gitlab" disabled>GitLab (deferred)</option>
              <option value="azure_devops" disabled>Azure DevOps (deferred)</option>
              <option value="bitbucket" disabled>Bitbucket (deferred)</option>
            </select>
          </label>
          <label>Repository URL, owner/repo, or snapshot id <input name="source" required placeholder="payments-api" /></label>
          <label>Branch <input name="branch" value="main" /></label>
          <div class="cint-ihs-actions"><button class="app-btn" type="submit" data-cint-ihs-import-submit>Import / extract</button></div>
          <p class="state-success" hidden data-cint-ihs-import-success>Import completed — repository tree in store; liveIndex stamped when sync succeeds.</p>
        </form>
      </div>
      <div class="cint-ihs-card">
        <h4>Upload assets</h4>
        <div class="cint-ihs-meta">${chip("observe", "ZIP extract live")} ${chip("observe", "Ledger durable")}</div>
        <p>Upload a <strong>ZIP</strong> to extract source into the repository store. Other kinds register on the durable ledger only.</p>
        <form data-cint-form="cint-upload" data-cint-ihs-flow="upload.zip" enctype="multipart/form-data">
          <label>Asset kind
            <select name="kind">
              <option value="zip">ZIP</option>
              <option value="images">Images</option>
              <option value="screenshots">Screenshots</option>
              <option value="documents">Documents</option>
              <option value="architecture_diagrams">Architecture diagrams</option>
              <option value="evidence_attachments">Evidence attachments</option>
            </select>
          </label>
          <label>ZIP / file <input name="file" type="file" accept=".zip,application/zip,*/*" /></label>
          <label>File name (fallback) <input name="filename" placeholder="evidence-pack.zip" /></label>
          <div class="cint-ihs-actions"><button class="app-btn" type="submit">Upload / extract</button></div>
          <p class="state-success" hidden>Upload processed — ZIP extract stamps repository + liveIndex when bytes are present.</p>
        </form>
      </div>
    </div>
    <section>
      <h4 style="margin:1rem 0 .4rem;font-size:.85rem;color:#5b6b7c">Import &amp; upload ledger</h4>
      <table><thead><tr><th>When</th><th>Kind</th><th>Source</th><th>Status</th><th>Approval</th></tr></thead>
      <tbody data-cint-ihs-ingress-rows></tbody></table>
    </section>`,
  );
}

/** Findings / Security / Quality / Dependencies / Remediation / Architecture / Overview — Export & Print. */
export function buildExportIntegrationHostHtml(page: string): string {
  return hostShell(
    "export",
    "Integration — Export · Print · Share",
    "Outbound artifacts for this surface. JSON / CSV / Markdown download from the live entity store. PDF uses Markdown + browser Print. Share ACL deferred. Source mutation stays approval-gated (Article VII).",
    `<div class="cint-ihs-grid">
      <div class="cint-ihs-card">
        <h4>Export</h4>
        <div class="cint-ihs-meta">${chip("observe", "JSON/CSV/MD live")} ${chip("prepare", "PDF via print")}</div>
        <p>PDF · CSV · JSON · Markdown from sealed store entities on <strong>${page}</strong>. Tokens are stripped from export payloads.</p>
        <div class="cint-ihs-actions">
          <button type="button" class="app-btn" data-cint-integration-export="pdf" data-cint-ihs-page="${page}">Export PDF</button>
          <button type="button" class="app-btn" data-cint-integration-export="csv" data-cint-ihs-page="${page}">Export CSV</button>
          <button type="button" class="app-btn" data-cint-integration-export="json" data-cint-ihs-page="${page}">Export JSON</button>
          <button type="button" class="app-btn" data-cint-integration-export="markdown" data-cint-ihs-page="${page}">Export Markdown</button>
        </div>
      </div>
      <div class="cint-ihs-card">
        <h4>Print &amp; Share</h4>
        <div class="cint-ihs-meta">${chip("prepare", "L3 Prepare")} ${chip("observe", "Share deferred")}</div>
        <p>Print view uses browser print. Share prepares a scoped link request — connector deferred.</p>
        <div class="cint-ihs-actions">
          <button type="button" class="app-btn" data-cint-integration-print data-cint-ihs-page="${page}">Print view</button>
          <button type="button" class="app-btn" data-cint-integration-share data-cint-ihs-page="${page}">Prepare share (demo)</button>
        </div>
      </div>
    </div>
    <section>
      <h4 style="margin:1rem 0 .4rem;font-size:.85rem;color:#5b6b7c">Export &amp; share ledger</h4>
      <table><thead><tr><th>When</th><th>Action</th><th>Format</th><th>Page</th><th>Status</th></tr></thead>
      <tbody data-cint-ihs-egress-rows></tbody></table>
    </section>`,
  );
}

/** Documentation — Upload docs + report/print. */
export function buildDocumentationIntegrationHostHtml(): string {
  return (
    hostShell(
      "upload",
      "Integration — Documentation assets",
      "Attach operator/developer documents into Knowledge — upload ledger is live; knowledge index remains deferred.",
      `<div class="cint-ihs-card">
        <h4>Upload document</h4>
        <div class="cint-ihs-meta">${chip("observe", "Ledger live")}</div>
        <form data-cint-form="cint-upload" data-cint-ihs-flow="upload.documents">
          <input type="hidden" name="kind" value="documents" />
          <label>Document title <input name="filename" required placeholder="ops-runbook.md" /></label>
          <div class="cint-ihs-actions"><button class="app-btn" type="submit">Register document</button></div>
          <p class="state-success" hidden>Document registered on upload ledger — knowledge index deferred.</p>
        </form>
      </div>`,
    ) + buildExportIntegrationHostHtml("documentation")
  );
}

/** Phase 8 — Evidence chain constitutional fields on Findings. */
export function buildEvidenceChainHostHtml(): string {
  return `<section data-cint-evidence-chain="1" data-cint-ihs-version="${CINT_INTEGRATION_HOSTS_VERSION}">
  <h4>Evidence chain (Constitution Article II / P2)</h4>
  <p class="cint-ihs-lead" style="margin:0 0 .65rem">No verified conclusion without evidence. Selecting a finding fills the chain; empty slots stay explicit.</p>
  <dl data-cint-evidence-chain-fields>
    <dt>Evidence reference</dt><dd data-cint-ec-ref>—</dd>
    <dt>Assessment criteria</dt><dd data-cint-ec-criteria>—</dd>
    <dt>Confidence</dt><dd data-cint-ec-confidence>—</dd>
    <dt>Verification status</dt><dd data-cint-ec-verification>—</dd>
    <dt>Responsible specialist</dt><dd data-cint-ec-specialist>—</dd>
    <dt>Timestamp</dt><dd data-cint-ec-timestamp>—</dd>
  </dl>
</section>`;
}

export function integrationHostHtmlForPage(pageKey: string): string {
  const key = pageKey.toLowerCase().replace(/[\s_]+/g, "-");
  switch (key) {
    case "repositories":
      return buildRepositoriesIntegrationHostHtml();
    case "documentation":
      return buildDocumentationIntegrationHostHtml();
    case "findings":
      return (
        buildEvidenceChainHostHtml() +
        buildExportIntegrationHostHtml("findings")
      );
    case "overview":
    case "security":
    case "dependencies":
    case "quality":
    case "architecture":
    case "remediation":
    case "history":
      return buildExportIntegrationHostHtml(key);
    default:
      return "";
  }
}

/**
 * Remove every Integration Host / Evidence Chain section with balanced nesting.
 * Non-greedy `*?<\/section>` is forbidden — ledger `<section>` inside IHS would
 * truncate early and dump leftover hosts into body / .website-shell (landing bleed).
 */
export function stripCodeIntelligenceIntegrationHostSections(html: string): string {
  let next = html;
  const markers = [
    /\bdata-cint-integration-host\b/i,
    /\bdata-cint-evidence-chain\b/i,
  ] as const;
  for (const marker of markers) {
    let guard = 0;
    while (guard++ < 64) {
      const openRe = /<section\b[^>]*>/gi;
      let open: RegExpExecArray | null;
      let hitStart = -1;
      let hitLen = 0;
      while ((open = openRe.exec(next)) !== null) {
        if (!marker.test(open[0])) continue;
        hitStart = open.index;
        hitLen = open[0].length;
        break;
      }
      if (hitStart < 0) break;
      let depth = 1;
      let end = -1;
      const scan = /<\/?section\b[^>]*>/gi;
      scan.lastIndex = hitStart + hitLen;
      let m: RegExpExecArray | null;
      while ((m = scan.exec(next)) !== null) {
        if (/^<\/section/i.test(m[0])) {
          depth -= 1;
          if (depth === 0) {
            end = m.index + m[0].length;
            break;
          }
        } else if (!/\/>$/.test(m[0])) {
          depth += 1;
        }
      }
      if (end < 0) {
        // Unclosed — drop the opening tag only to avoid infinite loop.
        next = `${next.slice(0, hitStart)}${next.slice(hitStart + hitLen)}`;
        continue;
      }
      next = `${next.slice(0, hitStart)}${next.slice(end)}`;
    }
  }
  return next;
}

/** True when IHS/evidence hosts sit outside any data-view / data-cint-page panel. */
export function htmlHasOrphanCodeIntelligenceIntegrationHosts(html: string): boolean {
  if (!/\bdata-cint-integration-host\b|\bdata-cint-evidence-chain\b/i.test(html)) return false;
  const openRe = /<section\b[^>]*>/gi;
  let open: RegExpExecArray | null;
  while ((open = openRe.exec(html)) !== null) {
    if (
      !/\bdata-cint-integration-host\b/i.test(open[0]) &&
      !/\bdata-cint-evidence-chain\b/i.test(open[0])
    ) {
      continue;
    }
    const before = html.slice(0, open.index);
    // Last opened view/page panel before this host must still be unclosed.
    const viewOpens = [
      ...before.matchAll(
        /<(section|div|article)\b[^>]*\bdata-(?:view|cint-page)=["'][^"']+["'][^>]*>/gi,
      ),
    ];
    if (viewOpens.length === 0) return true;
    const last = viewOpens[viewOpens.length - 1];
    const tag = last[1];
    const from = last.index ?? 0;
    const slice = before.slice(from);
    const openTags = slice.match(new RegExp(`<${tag}\\b[^>]*>`, "gi"))?.length ?? 0;
    const closeTags = slice.match(new RegExp(`</${tag}\\s*>`, "gi"))?.length ?? 0;
    if (closeTags >= openTags) return true;
  }
  return false;
}

/** HVM — stamp host surfaces into existing page bodies when missing. */
export function ensureCodeIntelligenceIntegrationHostSurfaces(html: string): {
  html: string;
  applied: readonly string[];
} {
  if (!/\bdata-cint-(?:app-)?shell\b|\bdata-product-surface=["']code_intelligence["']/i.test(html)) {
    return { html, applied: [] };
  }
  const pages = [
    "repositories",
    "findings",
    "documentation",
    "overview",
    "security",
    "dependencies",
    "quality",
    "architecture",
    "remediation",
    "history",
  ] as const;
  const applied: string[] = [];
  // Always purge globally first — kills body/.website-shell orphans from prior bad strips.
  let next = stripCodeIntelligenceIntegrationHostSections(html);
  if (next !== html) applied.push("orphan-ihs-purge");

  for (const page of pages) {
    const openRe = new RegExp(
      `<(section|div|article)\\b([^>]*\\bdata-(?:view|cint-page)=["']${page}["'][^>]*)>`,
      "i",
    );
    const open = openRe.exec(next);
    if (!open || open.index == null) continue;
    const tag = open[1];
    const start = open.index;
    let depth = 1;
    let end = -1;
    let m: RegExpExecArray | null;
    const scan = new RegExp(`</?${tag}\\b[^>]*>`, "gi");
    scan.lastIndex = start + open[0].length;
    while ((m = scan.exec(next)) !== null) {
      if (m[0].startsWith(`</`)) {
        depth -= 1;
        if (depth === 0) {
          end = m.index;
          break;
        }
      } else if (!/\/>$/.test(m[0])) {
        depth += 1;
      }
    }
    if (end < 0) continue;
    const inner = next.slice(start + open[0].length, end);
    const versionOk = new RegExp(
      `data-cint-ihs-version=["']${CINT_INTEGRATION_HOSTS_VERSION}["']`,
      "i",
    ).test(inner);

    if (page === "findings") {
      const needsEvidence = !/\bdata-cint-evidence-chain\b/i.test(inner);
      const needsExport =
        !/\bdata-cint-ihs-kind=["']export["']/i.test(inner) || !versionOk;
      if (!needsEvidence && !needsExport) continue;
      let injected = stripCodeIntelligenceIntegrationHostSections(inner);
      injected += buildEvidenceChainHostHtml() + buildExportIntegrationHostHtml("findings");
      next = `${next.slice(0, start + open[0].length)}${injected}${next.slice(end)}`;
      applied.push(
        needsEvidence && needsExport
          ? `${page}:evidence+export`
          : needsEvidence
            ? `${page}:evidence-chain`
            : `${page}:export-reheal`,
      );
      continue;
    }
    if (/\bdata-cint-integration-host\b/i.test(inner) && versionOk) continue;
    const block = integrationHostHtmlForPage(page);
    if (!block) continue;
    const cleaned = /\bdata-cint-integration-host\b/i.test(inner)
      ? stripCodeIntelligenceIntegrationHostSections(inner)
      : inner;
    next = `${next.slice(0, start + open[0].length)}${cleaned}${block}${next.slice(end)}`;
    applied.push(versionOk ? page : `${page}:reheal`);
  }

  return { html: next, applied };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export type CodeIntelligenceIntegrationHostsAuthority = Readonly<{
  version: "cint.integration.hosts.v1";
  sealed: boolean;
  sealedAt: string | null;
  hostVersion: typeof CINT_INTEGRATION_HOSTS_VERSION;
  inventPages: false;
  hostPages: readonly string[];
  constitutionalBasis: readonly string[];
}>;

export function buildCodeIntelligenceIntegrationHostsAuthority(options?: {
  sealed?: boolean;
}): CodeIntelligenceIntegrationHostsAuthority {
  const sealed = options?.sealed === true;
  return {
    version: "cint.integration.hosts.v1",
    sealed,
    sealedAt: sealed ? new Date().toISOString() : null,
    hostVersion: CINT_INTEGRATION_HOSTS_VERSION,
    inventPages: false,
    hostPages: [
      "Repositories",
      "Findings",
      "Documentation",
      "Overview",
      "Security",
      "Dependencies",
      "Quality",
      "Architecture",
      "Remediation",
      "History",
    ],
    constitutionalBasis: [
      "cint.constitution.v1 — Evidence Before Conclusions",
      "cint.integration.v1 — hostPages projection",
      "Article VII — L3 Prepare only in demo surfaces",
    ],
  };
}

export function sealCodeIntelligenceIntegrationHosts(
  metadata: unknown,
): {
  metadata: Record<string, unknown>;
  hosts: CodeIntelligenceIntegrationHostsAuthority;
} {
  const base = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  const hosts = buildCodeIntelligenceIntegrationHostsAuthority({ sealed: true });
  base[CINT_INTEGRATION_HOSTS_KEY] = hosts;
  return { metadata: base, hosts };
}

export function isCodeIntelligenceIntegrationHostsSealed(metadata?: unknown): boolean {
  const block = asRecord(asRecord(metadata)?.[CINT_INTEGRATION_HOSTS_KEY]);
  return Boolean(block?.sealed && block.sealedAt);
}

export function detectCodeIntelligenceIntegrationHostsSealIntent(text: string): boolean {
  const t = text.toLowerCase();
  return (
    /\bphase\s*7\b/.test(t) ||
    /\bintegration host\b/.test(t) ||
    /\bcint\.integration\.hosts\.v1\b/.test(t) ||
    /\bseal\b.*\bhost surfaces\b/.test(t) ||
    /\bimport.*upload.*export\b/.test(t)
  );
}
