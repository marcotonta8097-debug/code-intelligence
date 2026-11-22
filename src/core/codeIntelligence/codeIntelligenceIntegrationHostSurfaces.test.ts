import { describe, expect, it } from "vitest";
import {
  CINT_INTEGRATION_HOSTS_VERSION,
  buildExportIntegrationHostHtml,
  buildRepositoriesIntegrationHostHtml,
  codeIntelligenceIntegrationHostCss,
  ensureCodeIntelligenceIntegrationHostSurfaces,
  htmlHasOrphanCodeIntelligenceIntegrationHosts,
  integrationHostHtmlForPage,
  sealCodeIntelligenceIntegrationHosts,
  stripCodeIntelligenceIntegrationHostSections,
} from "@/core/codeIntelligence/codeIntelligenceIntegrationHostSurfaces";

describe("Phase 7 Integration Host Surfaces", () => {
  it("builds repositories import/upload proof surfaces", () => {
    const html = buildRepositoriesIntegrationHostHtml();
    expect(html).toMatch(/data-cint-integration-host/);
    expect(html).toMatch(/data-cint-form="cint-import"/);
    expect(html).toMatch(/data-cint-form="cint-upload"/);
    expect(html).toMatch(/local_snapshot/);
    expect(html).toMatch(/ZIP extract live|type="file"/);
    expect(html).toMatch(/disabled/); // deferred SCM options
    expect(html).not.toMatch(/Prepare-only demo/);
    expect(html).toContain(CINT_INTEGRATION_HOSTS_VERSION);
  });

  it("reheals stale IHS version copy on repositories", () => {
    const stale = `<div class="app-shell" data-cint-app-shell="1" data-product-surface="code_intelligence">
<main>
<section data-view="repositories"><div data-cint-page-body>Repos
<section data-cint-integration-host="1" data-cint-ihs-version="CINT-IHS-1.0">
<p>Prepare-only demo — no live GitHub token</p>
</section>
</div></section>
</main></div>`;
    const result = ensureCodeIntelligenceIntegrationHostSurfaces(stale);
    expect(result.applied.some((a) => a.includes("repositories"))).toBe(true);
    expect(result.html).toContain(CINT_INTEGRATION_HOSTS_VERSION);
    expect(result.html).toMatch(/local_snapshot/);
    expect(result.html).not.toMatch(/Prepare-only demo/);
  });

  it("maps host pages without inventing new page ids", () => {
    expect(integrationHostHtmlForPage("findings")).toMatch(/data-cint-evidence-chain/);
    expect(integrationHostHtmlForPage("findings")).toMatch(/data-cint-integration-export/);
    expect(integrationHostHtmlForPage("documentation")).toMatch(/upload\.documents|documents/);
    expect(integrationHostHtmlForPage("login")).toBe("");
  });

  it("contains IHS columns/tables and hides hosts on landing", () => {
    const css = codeIntelligenceIntegrationHostCss();
    expect(css).toContain("CINT-IHS-1.9");
    expect(css).toContain(".website-shell > [data-cint-integration-host]");
    expect(css).not.toMatch(/\.website-shell\s+\[data-cint-integration-host\]\{/);
    expect(css).toContain("table-layout:fixed");
    expect(css).toMatch(/\.cint-ihs-grid\{[^}]*grid-template-columns:1fr/);
    expect(css).toMatch(/\[data-view="landing"\] \[data-cint-integration-host\]/);
    expect(css).toMatch(/body > \[data-cint-integration-host\]/);
    expect(css).toMatch(/\.website-shell \[data-cint-integration-host\]/);
  });

  it("purges body orphans caused by nested-section strip truncation", () => {
    const nested = buildExportIntegrationHostHtml("overview");
    const withBodyOrphan = `<div class="app-shell" data-cint-app-shell="1" data-product-surface="code_intelligence">
<main>
<section data-view="overview"><div data-cint-page-body>Overview</div></section>
</main></div>
${nested}
<div class="website-shell">${nested}</div>`;
    expect(htmlHasOrphanCodeIntelligenceIntegrationHosts(withBodyOrphan)).toBe(true);
    // Naive non-greedy strip closes at nested ledger </section> and leaves a stray
    // </section> that prematurely closes data-view — balanced strip must not.
    const naiveLeft = nested.replace(
      /<section\b[^>]*\bdata-cint-integration-host\b[\s\S]*?<\/section>/i,
      "",
    );
    expect(naiveLeft).toMatch(/<\/section>/);
    expect(naiveLeft).toMatch(/data-cint-ihs-log/);
    expect(stripCodeIntelligenceIntegrationHostSections(nested).trim()).toBe("");
    const result = ensureCodeIntelligenceIntegrationHostSurfaces(withBodyOrphan);
    expect(result.applied).toContain("orphan-ihs-purge");
    expect(result.html).not.toMatch(/website-shell[\s\S]*data-cint-integration-host/);
    expect(htmlHasOrphanCodeIntelligenceIntegrationHosts(result.html)).toBe(false);
    expect(result.html).toContain(CINT_INTEGRATION_HOSTS_VERSION);
    expect((result.html.match(/\bdata-cint-integration-host\b/g) || []).length).toBe(1);
  });

  it("heals missing host surfaces onto sealed panels", () => {
    const html = `<div class="app-shell" data-cint-app-shell="1" data-product-surface="code_intelligence">
<main>
<section data-view="repositories"><div data-cint-page-body>Repos</div></section>
<section data-view="findings"><div data-cint-page-body>Findings</div></section>
</main></div>`;
    const result = ensureCodeIntelligenceIntegrationHostSurfaces(html);
    expect(result.applied.length).toBeGreaterThan(0);
    expect(result.html).toMatch(/data-cint-integration-host/);
    expect(result.html).toMatch(/data-cint-evidence-chain/);
    expect(result.html).toMatch(/data-view="repositories"/);
  });

  it("seals hosts authority metadata", () => {
    const sealed = sealCodeIntelligenceIntegrationHosts({});
    expect(sealed.hosts.version).toBe("cint.integration.hosts.v1");
    expect(sealed.hosts.inventPages).toBe(false);
    expect(sealed.hosts.sealed).toBe(true);
  });
});
