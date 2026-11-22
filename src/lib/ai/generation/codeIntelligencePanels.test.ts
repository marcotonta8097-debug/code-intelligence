import { describe, expect, it } from "vitest";
import {
  appendCodeIntelligencePaintCss,
  buildCodeIntelligencePanel,
  buildCodeIntelligenceRailHtml,
  buildCodeIntelligenceTopbarHtml,
  CINT_PAINT_CSS_MARK,
  healCodeIntelligencePreviewHtml,
  hoistCodeIntelligenceFindingDrawer,
  isCodeIntelligencePanelContext,
} from "@/lib/ai/generation/codeIntelligencePanels";
import { resolveWorkspaceModuleTemplate } from "@/core/workspace/workspaceModuleTemplates";
import { CODE_INTELLIGENCE_DOMAIN_PACK } from "@/core/domainPack/codeIntelligenceDomainPack";
import {
  buildWorkspaceContract,
  workspaceContractSidebarLabels,
} from "@/core/workspace/buildWorkspaceContract";
import {
  generateCodeIntelligenceRuntimeScript,
  htmlHasCodeIntelligenceSurface,
  mergeCodeIntelligenceRuntime,
  stripCodeIntelligenceRuntime,
} from "@/lib/interaction/codeIntelligenceRuntime";

describe("code intelligence workspace panels", () => {
  it("keeps CREATE-floor routes lean and repair panels distinct", () => {
    const overview = buildCodeIntelligencePanel("Overview")!;
    const security = buildCodeIntelligencePanel("Security")!;
    const findings = buildCodeIntelligencePanel("Findings")!;
    const remediation = buildCodeIntelligencePanel("Remediation")!;
    expect(overview).toContain("data-cint-repo-select");
    expect(overview).toContain("data-cint-chrome");
    expect(overview).not.toMatch(/<nav[^>]*\bdata-cint-nav\b/i);
    expect(overview).toContain("Not a finding register");
    expect(security).toContain("Posture only");
    expect(security).not.toContain("Cross-category register");
    expect(findings).toContain("Cross-category register");
    expect(findings).toContain("data-cint-finding-rows=\"findings\"");
    expect(remediation).toContain("never writes source");
    expect(remediation).toContain("data-cint-diff");
    expect(buildCodeIntelligencePanel("Architecture")).toContain("data-cint-graph");
    expect(buildCodeIntelligencePanel("Dependencies")).toContain("data-cint-dep-rows");
    expect(buildCodeIntelligencePanel("Quality")).toContain("data-cint-quality-rows");
    expect(buildCodeIntelligencePanel("Documentation")).toContain("data-cint-doc-toc");
    expect(buildCodeIntelligencePanel("Assistant")).toContain("CINT_ANTHROPIC_API_KEY");
    expect(buildCodeIntelligencePanel("History")).toContain("failed run is marked failed");
    expect(buildCodeIntelligencePanel("Settings")).toContain("data-cint-audit");
    expect(buildCodeIntelligencePanel("Repositories")).toContain("data-cint-repo-rows");
    expect(overview).toContain("data-cint-workspace-main");
    expect(overview).toContain("data-cint-product-css");
    expect(buildCodeIntelligencePanel("Landing")).toContain("Understand More Than Code.");
    expect(buildCodeIntelligencePanel("Landing")).toContain("data-cint-marketing");
    expect(buildCodeIntelligencePanel("Landing")).toContain('data-view-nav="login"');
    expect(buildCodeIntelligencePanel("Landing")).toContain('data-cint-mkt-signin="1"');
    expect(buildCodeIntelligencePanel("Landing")).toContain("data-cint-mkt-nav-actions");
    expect(buildCodeIntelligencePanel("Landing")).toContain(">Sign In<");
    expect(buildCodeIntelligencePanel("Landing")).toContain('data-cint-mkt-scroll="platform"');
    expect(buildCodeIntelligencePanel("Landing")).toContain('id="documentation"');
    expect(buildCodeIntelligencePanel("Landing")).toContain('data-cint-auth="1"');
    expect(buildCodeIntelligencePanel("Landing")).toContain("CODE INTELLIGENCE");
    expect(buildCodeIntelligencePanel("Login")).toContain("Create account");
    const rail = buildCodeIntelligenceRailHtml();
    expect(rail).toContain('data-cint-rail="1"');
    expect(rail).toContain('data-view-nav="overview"');
    expect(rail).toContain('data-view-nav="repositories"');
    expect(rail).toContain('data-view-nav="findings"');
    expect(rail).toContain('data-view-nav="settings"');
    expect(rail).not.toContain('data-view-nav="admin"');
    expect(rail).not.toContain('data-view-nav="architecture"');
    expect(rail).not.toContain("data-cint-signout");
    expect(rail).not.toContain("data-cint-sidebar-toggle");
    expect(rail).toContain("cint-brand-mark");
    expect(rail).toContain("cint-nav-abbr");
    const topbar = buildCodeIntelligenceTopbarHtml();
    expect(topbar).toContain("data-cint-topbar");
    expect(topbar).toContain("data-cint-sidebar-toggle");
    expect(topbar).toContain("cint-topbar-sep");
    expect(topbar).toContain("cint-topbar-left");
    expect(topbar).toContain("cint-topbar-right");
    expect(topbar).not.toContain("cint-brand-mark");
    const expandedRail = buildCodeIntelligenceRailHtml([
      "Landing",
      "Overview",
      "Architecture",
      "Security",
      "Admin",
      "Settings",
    ]);
    expect(expandedRail).toContain('data-view-nav="architecture"');
    expect(expandedRail).toContain('data-view-nav="security"');
    expect(expandedRail).toContain('data-view-nav="admin"');
    expect(buildCodeIntelligencePanel("Dashboard")).toContain("Command centre");
    expect(buildCodeIntelligencePanel("Login")).toContain('data-cint-auth-action="login"');
    expect(buildCodeIntelligencePanel("Login")).toContain('data-product-surface="code_intelligence"');
    expect(buildCodeIntelligencePanel("Login")).not.toContain("app-auth-form");
    expect(buildCodeIntelligencePanel("Signup")).toContain('data-cint-auth-action="signup"');
    expect(buildCodeIntelligencePanel("Settings")).toContain("data-cint-signout");
    expect(buildCodeIntelligencePanel("Admin")).toContain("data-cint-admin-members");
    expect(buildCodeIntelligencePanel("Admin")).toContain("data-cint-admin-bootstrap");
    expect(buildCodeIntelligencePanel("Admin")).toContain("data-cint-admin-refresh");
    expect(buildCodeIntelligencePanel("Contacts")).toContain("data-cint-contact-rows");
    expect(buildCodeIntelligencePanel("Support")).toContain("data-cint-support-rows");
    expect(buildCodeIntelligencePanel("Admin")).toMatch(/Not Replica host/);
    expect(buildCodeIntelligencePanel("Contacts")).toMatch(/Not FOC/);
  });

  it("merges demo runtime onto shell HTML only", () => {
    const html = buildCodeIntelligencePanel("Findings")!;
    expect(htmlHasCodeIntelligenceSurface(html)).toBe(true);
    const js = mergeCodeIntelligenceRuntime("void 0; /* host junk */", html);
    expect(js).toContain("replica-cint-runtime-start");
    expect(js).toContain("data-cint-open-finding");
    expect(js).toContain("source not modified");
    // CI quarantines host JS — broken leftover scripts must not share the tag with showView.
    expect(js).not.toContain("host junk");
    expect(stripCodeIntelligenceRuntime(js)).toBe("");
    expect(mergeCodeIntelligenceRuntime("void 0;", "<p>no shell</p>")).toBe("void 0;");
    expect(generateCodeIntelligenceRuntimeScript()).toContain("Withheld");
    expect(generateCodeIntelligenceRuntimeScript()).toContain("app-notification-bell");
    expect(generateCodeIntelligenceRuntimeScript()).toContain("data-cint-sidebar-toggle");
    expect(generateCodeIntelligenceRuntimeScript()).toContain("data-cint-topbar");
    expect(generateCodeIntelligenceRuntimeScript()).toContain("function ensureTopbar");
    expect(generateCodeIntelligenceRuntimeScript()).toContain("data-cint-rail");
    expect(generateCodeIntelligenceRuntimeScript()).toContain("function showView");
    expect(generateCodeIntelligenceRuntimeScript()).toContain("window.__replicaCintShowView=showView");
    expect(generateCodeIntelligenceRuntimeScript()).toContain("stopImmediatePropagation");
    expect(generateCodeIntelligenceRuntimeScript()).toContain('showView("overview")');
    expect(generateCodeIntelligenceRuntimeScript()).toContain("cint.session.v1");
    expect(generateCodeIntelligenceRuntimeScript()).not.toContain("replica.previewSession.v1");
    expect(generateCodeIntelligenceRuntimeScript()).toContain('cintPath("auth")');
    expect(generateCodeIntelligenceRuntimeScript()).toContain('action:"login"');
    expect(generateCodeIntelligenceRuntimeScript()).not.toContain('auth/"+kind');
    expect(generateCodeIntelligenceRuntimeScript()).toContain("authMode");
    expect(generateCodeIntelligenceRuntimeScript()).toContain("data-cint-session-chip");
    expect(generateCodeIntelligenceRuntimeScript()).toContain("data-cint-signout");
    expect(generateCodeIntelligenceRuntimeScript()).toContain("function gatewayEntryView");
    expect(generateCodeIntelligenceRuntimeScript()).toContain("showGatewayEntry");
    expect(generateCodeIntelligenceRuntimeScript()).toContain("CINT-EE-1.55");
    expect(generateCodeIntelligenceRuntimeScript()).toContain('cintPath("admin")');
    expect(generateCodeIntelligenceRuntimeScript()).toContain("data-cint-admin-promote");
    expect(generateCodeIntelligenceRuntimeScript()).toContain("syncProjectId");
    expect(generateCodeIntelligenceRuntimeScript()).toContain('action:"forgot"');
    expect(generateCodeIntelligenceRuntimeScript()).not.toContain("Demo reset — continue to sign in");
    expect(generateCodeIntelligenceRuntimeScript()).toContain(
      "Signed in, but Overview did not open",
    );
    expect(generateCodeIntelligenceRuntimeScript()).toContain("recoverStuckAuthShell");
    expect(generateCodeIntelligenceRuntimeScript()).toContain("Footer bleed lock");
    expect(generateCodeIntelligenceRuntimeScript()).toContain("data-cint-remediation-decision");
    expect(generateCodeIntelligenceRuntimeScript()).toContain("runRemediationDecision");
    expect(generateCodeIntelligenceRuntimeScript()).toContain("ASSISTANT_TIMEOUT_MS");
    expect(generateCodeIntelligenceRuntimeScript()).toContain("data-cint-assistant-busy");
    expect(generateCodeIntelligenceRuntimeScript()).toContain("Grounded");
    expect(generateCodeIntelligenceRuntimeScript()).toContain("triggerBlobDownload");
    expect(generateCodeIntelligenceRuntimeScript()).toContain("triggerHostDownload");
    expect(generateCodeIntelligenceRuntimeScript()).toContain("check browser Downloads");
    expect(generateCodeIntelligenceRuntimeScript()).toContain("cint-ee-136-gateway-view-kill");
    expect(generateCodeIntelligenceRuntimeScript()).toContain("ensureFindingDrawer");
    expect(generateCodeIntelligenceRuntimeScript()).toContain('querySelectorAll("body > [data-view], .website-shell > [data-view]")');
    expect(generateCodeIntelligenceRuntimeScript()).not.toContain('querySelectorAll("body > [data-view], .website-shell [data-view]")');
    expect(generateCodeIntelligenceRuntimeScript()).toContain("earlyWorkspaceRail");
    expect(generateCodeIntelligenceRuntimeScript()).toContain("QUALITY_CATS");
    expect(generateCodeIntelligenceRuntimeScript()).toContain('write("history"');
    expect(generateCodeIntelligenceRuntimeScript()).toContain("showModal");
    expect(generateCodeIntelligenceRuntimeScript()).toContain("openFindingDrawer");
    expect(generateCodeIntelligenceRuntimeScript()).toContain("mktWorkspace");
    expect(generateCodeIntelligenceRuntimeScript()).toContain("Topband → rail → main");
    expect(generateCodeIntelligenceRuntimeScript()).toContain("persistError");
    expect(generateCodeIntelligenceRuntimeScript()).toContain("ingestLiveAnalysisResult");
    expect(generateCodeIntelligenceRuntimeScript()).toContain("syncRepoSelectOptions");
    expect(generateCodeIntelligenceRuntimeScript()).toContain("Synced — no analysis yet");
    expect(generateCodeIntelligenceRuntimeScript()).toContain("__cintLiveRunTimer");
    expect(generateCodeIntelligenceRuntimeScript()).toContain("Timed out after");
    expect(generateCodeIntelligenceRuntimeScript()).toContain("applySidebarMode");
    expect(generateCodeIntelligenceRuntimeScript()).toContain("memorySession");
    expect(generateCodeIntelligenceRuntimeScript()).toContain("workspacePanelVisible");
    expect(generateCodeIntelligenceRuntimeScript()).toContain("workspaceOpen");
    expect(generateCodeIntelligenceRuntimeScript()).toContain("function ensureRail");
    expect(generateCodeIntelligenceRuntimeScript()).toContain("data-cint-rail-on");
    expect(generateCodeIntelligenceRuntimeScript()).toContain('setAttribute("hidden"');
    expect(generateCodeIntelligenceRuntimeScript()).toContain("schedulePaint");
    expect(generateCodeIntelligenceRuntimeScript()).toContain("cint.sidebar.v1");
  });

  it("never reserves a 2-col shell track without data-cint-rail-on", () => {
    const html = buildCodeIntelligencePanel("Overview")!;
    const css = appendCodeIntelligencePaintCss(
      "/* REPLICA_PREVIEW_PRODUCT_LAYOUT */\n.app-shell:has(> .app-sidebar){grid-template-columns:13rem 1fr!important}\n",
      html,
    );
    expect(css).toContain("cint-workspace-paint-v33");
    expect(css).toContain("Footer bleed lock");
    expect(css).toContain("cint-rail-lock-v31");
    expect(css).toContain("position:absolute");
    expect(css).toContain("inset:0");
    expect(css).not.toContain("100dvh");
    expect(css).toMatch(/\[data-cint-shell\] table\{[^}]*table-layout:fixed/);
    expect(css).toMatch(/\[data-cint-workspace-main\]\{[^}]*flex-shrink:1/);
    expect(css).toMatch(
      /\[data-cint-rail-on="1"\] \[data-cint-integration-host\]\{[^}]*max-width:100%!important/,
    );
    expect(css).toMatch(/@media \(max-width:42rem\)/);
    expect(generateCodeIntelligenceRuntimeScript()).toContain("earlyWorkspaceRail");
    expect(css).toContain("data-cint-topbar");
    expect(css).toContain("cint-topbar-sep");
    // Full-width header; rail + main start on the row below the separator.
    expect(css).toMatch(
      /\[data-cint-rail-on="1"\] > \[data-cint-topbar\]\{[^}]*grid-column:1 \/ -1!important/,
    );
    expect(css).toMatch(
      /\[data-cint-rail-on="1"\] > \.app-sidebar[^{]*\{[^}]*grid-row:2!important/,
    );
    // Ungated overview display:block must never beat gateway hide (landing footer bleed).
    expect(css).not.toMatch(
      /\.app-shell\[data-cint-app-shell="1"\] \.app-main > \[data-view="overview"\]:not\(\[hidden\]\)\{display:block/,
    );
    expect(css).toMatch(
      /\[data-cint-zone="gateway"\]:not\(\[data-cint-authed="1"\]\) > \.app-main > \[data-view="overview"\]:not\(\[hidden\]\)[^{]*\{[^}]*display:none/,
    );
    // Gateway hides rail when unauthenticated even if rail-on wrongly stamped.
    expect(css).toMatch(
      /\[data-cint-zone="gateway"\]:not\(\[data-cint-authed="1"\]\)\[data-cint-rail-on="1"\] > \.app-sidebar/,
    );
    expect(css).not.toContain("REPLICA_PREVIEW_PRODUCT_LAYOUT");
    expect(css).toContain("overflow-y:scroll");
    expect(css).toContain("position:sticky");
    expect(css).toMatch(/\[data-cint-zone="gateway"\][^\{]*\.app-main\{[^}]*overflow-y:scroll/);
    expect(css).toContain('[data-cint-rail-on="1"]');
    expect(css).toContain(
      '.app-shell[data-cint-app-shell="1"]:not([data-cint-rail-on="1"]){display:grid!important;grid-template-columns:1fr!important',
    );
    // Must not 2-col from mere :has(rail) while rail is display:none.
    expect(css).not.toMatch(
      /\[data-cint-zone="workspace"\]:has\(>\s*\.app-sidebar\[data-cint-rail\]\)\{[^}]*grid-template-columns:var\(--cint-sidebar-width\)/,
    );
    // Nested view :has wars removed — zone/authed drive layout.
    expect(css).not.toMatch(
      /:not\(:has\(\.app-main \[data-view\]:not\(\[hidden\]\):not\(\[data-view="landing"\]\)/,
    );
    // Inner page shell must not keep a dead nav column after data-cint-nav is stripped.
    expect(css).toMatch(/\[data-cint-shell\]\{[^}]*grid-template-columns:1fr!important/);
  });

  it("heals missing rail onto the app shell", () => {
    const bare = `<div class="app-shell" data-cint-app-shell="1" data-product-surface="code_intelligence" data-cint-zone="gateway">
<main class="app-main"><section class="app-view-panel" data-view="overview" id="overview"><div data-cint-shell data-cint-page="overview"><h2>Overview</h2></div></section></main>
</div>`;
    const healed = healCodeIntelligencePreviewHtml(bare, { forceCi: true });
    expect(healed).toContain('data-cint-rail="1"');
    expect(healed.indexOf("data-cint-rail")).toBeLessThan(healed.indexOf("<main"));
  });

  it("seeds gateway login even when paint CSS mentions data-view=login", () => {
    const cssOnly = `<style>${CINT_PAINT_CSS_MARK}[data-view="login"]{display:block}</style>
<div class="app-shell" data-cint-app-shell="1" data-product-surface="code_intelligence">
<main><section class="app-view-panel" data-view="landing"><h2>Landing</h2><a href="#login" data-view-nav="login">Sign in</a></section></main>
</div>`;
    const healed = healCodeIntelligencePreviewHtml(cssOnly);
    expect(healed).toMatch(/<(?:section|div|article)\b[^>]*\bdata-view=["']login["']/i);
    expect(healed).toMatch(/<(?:section|div|article)\b[^>]*\bdata-view=["']signup["']/i);
    expect(healed).toMatch(/<(?:section|div|article)\b[^>]*\bdata-view=["']forgot-password["']/i);
    expect(healed).toContain("data-cint-form=\"login\"");
  });

  it("templates CREATE-floor workspace routes only (expansion via Repair)", () => {
    const template = resolveWorkspaceModuleTemplate(
      "saas",
      "Code Intelligence platform for repositories and findings",
    );
    expect(template).toEqual([...CODE_INTELLIGENCE_DOMAIN_PACK.defaultPages]);
    expect(template).not.toContain("Dashboard");
    expect(template).toContain("Overview");
    expect(template).toContain("Findings");
    expect(template).not.toContain("Architecture");
    expect(template).not.toContain("Admin");
    expect(template).toHaveLength(4);

    const contract = buildWorkspaceContract({
      pages: [...CODE_INTELLIGENCE_DOMAIN_PACK.defaultPages],
      userPrompt: "Code Intelligence platform for repositories and findings",
    });
    expect(contract).not.toBeNull();
    expect(contract?.topBar.notifications).toBe(false);
    expect(contract?.topBar.avatar).toBe(false);
    expect(workspaceContractSidebarLabels(contract!)).toEqual([
      ...CODE_INTELLIGENCE_DOMAIN_PACK.defaultPages,
    ]);
  });

  it("re-appends workspace paint last so light preview CSS cannot win", () => {
    const html = buildCodeIntelligencePanel("Overview")!;
    const first = appendCodeIntelligencePaintCss("body{margin:0}", html);
    expect(first).toContain("cint-workspace-paint-");
    const afterLight = `${first}\n/* REPLICA_PREVIEW_PRODUCT_LAYOUT */\n.app-sidebar{grid-row:2;background:#fff}`;
    const last = appendCodeIntelligencePaintCss(afterLight, html);
    expect(last.lastIndexOf(CINT_PAINT_CSS_MARK)).toBeGreaterThan(last.indexOf("REPLICA_PREVIEW_PRODUCT_LAYOUT"));
    expect(last.match(/cint-workspace-paint-v\d+/g)).toHaveLength(1);
    expect(last).toContain("#e8eef5");
    expect(last).not.toContain("#070d18");
  });

  it("hoists a single finding drawer outside view panels", () => {
    const html = `<div class="app-shell" data-cint-app-shell="1"><main>
<section data-view="overview" hidden><dialog data-cint-finding-drawer class="cint-drawer" hidden><div data-cint-finding-detail></div></dialog></section>
<section data-view="findings"><dialog data-cint-finding-drawer class="cint-drawer" hidden><div data-cint-finding-detail></div></dialog></section>
</main></div>`;
    const healed = hoistCodeIntelligenceFindingDrawer(html);
    expect(healed.match(/data-cint-finding-drawer/g)).toHaveLength(1);
    expect(healed.indexOf("data-cint-finding-drawer")).toBeGreaterThan(healed.indexOf("</main>"));
    expect(healed).not.toMatch(
      /data-view="overview"[^>]*>[\s\S]*?data-cint-finding-drawer[\s\S]*?<\/section>/i,
    );
  });

  it("does not force a hidden landing panel over login in gateway CSS", () => {
    const html = buildCodeIntelligencePanel("Landing")!;
    const css = appendCodeIntelligencePaintCss("", html);
    expect(css).toContain(
      '[data-view="landing"]:not([hidden])',
    );
    expect(css).not.toMatch(
      /:not\(:has\(\[data-view="forgot-password"\]:not\(\[hidden\]\)\)\) \[data-view="landing"\],/,
    );
    // Login markup stays in the DOM on Overview — must not collapse the workspace rail.
    expect(css).not.toMatch(
      /\[data-cint-app-shell="1"\]:has\(\[data-cint-auth="1"\]:not\(\[hidden\]\)\)\{grid-template-columns:1fr/,
    );
    expect(css).toContain('[data-cint-zone="workspace"] > .app-main');
    expect(css).toContain('[data-cint-rail-on="1"] > .app-sidebar');
  });

  it("hides stacked workspace panels, leftover Dashboard header, and duplicate footer on paint", () => {
    const stacked = `<div class="app-shell" data-cint-app-shell="1">
<aside class="app-sidebar" data-cint-rail><a href="#overview"><span class="cint-nav-full">Overview</span><span class="cint-nav-abbr">OV</span></a></aside>
<main>
<section class="app-view-panel" data-view="login"><h2>Sign in</h2></section>
<section class="app-view-panel" data-view="overview"><header class="app-view-header"><h2>Overview</h2></header></section>
<section class="app-view-panel" data-view="dashboard"><h2>Dashboard</h2></section>
</main>
<footer class="app-footer"><p>Footer</p></footer>
</div>`;
    const healed = healCodeIntelligencePreviewHtml(stacked);
    expect(healed).toMatch(/data-cint-zone=["']gateway["']/);
    expect(healed).toMatch(/data-view="landing"/);
    expect(healed).not.toMatch(/data-view="landing"[^>]*\bhidden\b/);
    expect(healed).toMatch(/data-view="login"[^>]*\bhidden\b/);
    expect(healed).toMatch(/data-view="overview"[^>]*\bhidden\b/);
    expect(
      !healed.includes('data-view="dashboard"') ||
        /data-view="dashboard"[^>]*\bhidden\b/.test(healed),
    ).toBe(true);
    expect(healed).not.toContain("app-view-header");
    expect(healed).not.toContain("app-footer");
    expect(healed).toContain("data-cint-rail");
    expect(healed).toContain("data-cint-app-shell");
    expect(healed).not.toMatch(/<nav[^>]*data-cint-nav/);
    expect(healed).toMatch(/cint-nav-abbr"[^>]*\bhidden\b|cint-nav-abbr hidden/);
  });

  it("replaces hollow Our Company brochure Landing with CI marketing door", () => {
    const brochure = `<div class="app-shell" data-cint-app-shell="1" data-product-surface="code_intelligence">
<main>
<section class="app-view-panel" data-view="landing">
  <p>Welcome</p>
  <h1>Our Company</h1>
  <p>A clear overview of what we offer — built for visitors exploring our site.</p>
  <a href="#pricing">View pricing</a>
  <section class="website-landing-features"><h3>Highlights</h3>
    <ul><li>Clear messaging — hero, value proposition, and calls to action</li>
    <li>Structured pages — Pricing, About Us, Services, and Contact in the header nav</li></ul>
  </section>
</section>
<section class="app-view-panel" data-view="login" hidden><h2>Sign in</h2></section>
</main>
</div>`;
    const healed = healCodeIntelligencePreviewHtml(brochure, { forceCi: true });
    expect(healed).not.toMatch(/>\s*Our Company\s*</i);
    expect(healed).not.toMatch(/View pricing/i);
    expect(healed).toContain("data-cint-marketing");
    expect(healed).toMatch(/Understand More Than Code|CODE INTELLIGENCE/i);
    expect(healed).toMatch(/data-view=["']landing["']/);
  });

  it("treats sealed field as CI panel context without prompt text", () => {
    expect(
      isCodeIntelligencePanelContext({
        fieldRegistryId: "field:code_intelligence",
        modules: ["Landing", "Login", "Overview", "Findings", "Repositories"],
      }),
    ).toBe(true);
    expect(isCodeIntelligencePanelContext({ userPrompt: "hello world" })).toBe(false);
  });

  it("wipes bare Our Company invent with no data-view landing panel", () => {
    const bare = `<main class="app-main">
<p>Welcome</p>
<h1>Our Company</h1>
<p>A clear overview of what we offer — built for visitors exploring our site.</p>
<a href="#pricing">View pricing</a>
<h3>Highlights</h3>
<ul><li>Clear messaging — hero, value proposition, and calls to action</li>
<li>Structured pages — Pricing, About Us, Services, and Contact in the header nav</li>
<li>Accessible layout — readable contrast and responsive sections</li></ul>
</main>`;
    const healed = healCodeIntelligencePreviewHtml(bare, {
      forceCi: true,
      contractPages: [
        "Landing",
        "Login",
        "Signup",
        "Forgot Password",
        "Overview",
        "Repositories",
        "Findings",
        "Settings",
        "Architecture",
        "Security",
      ],
    });
    expect(healed).not.toMatch(/>\s*Our Company\s*</i);
    expect(healed).not.toMatch(/View pricing/i);
    expect(healed).not.toMatch(/Clear messaging/i);
    expect(healed).toContain("data-cint-app-shell");
    expect(healed).toContain("data-cint-marketing");
    expect(healed).toMatch(/data-view=["']landing["']/);
    expect(healed).toMatch(/data-view=["']login["']/);
    expect(healed).toMatch(/data-view=["']overview["']/);
    expect(healed).toMatch(/data-view=["']repositories["']/);
    expect(healed).toMatch(/data-view=["']architecture["']/);
    expect(healed).toMatch(/data-view=["']security["']/);
  });

  it("seeds missing workspace data-view panels so sidebar routes paint content", () => {
    const shell = `<div class="app-shell" data-cint-app-shell="1" data-product-surface="code_intelligence">
<aside class="app-sidebar" data-cint-rail="1"><a href="#findings" data-view-nav="findings">Findings</a></aside>
<main>
<section class="app-view-panel" data-view="login" hidden><h2>Sign in</h2></section>
<section class="app-view-panel" data-view="overview"><h2>Overview</h2><div data-cint-activity></div></section>
</main>
</div>`;
    const healed = healCodeIntelligencePreviewHtml(shell);
    expect(healed).toMatch(/data-view=["']findings["']/);
    expect(healed).toMatch(/data-view=["']repositories["']/);
    expect(healed).toMatch(/data-view=["']settings["']/);
    expect(healed).not.toMatch(/data-view=["']security["']/);
    expect(healed).not.toMatch(/data-view=["']remediation["']/);
    expect(healed).toMatch(/data-cint-finding-rows=["']findings["']/);
  });

  it("dedupes duplicate Landing panels that cause ghosted hero text", () => {
    const door = buildCodeIntelligencePanel("Landing")!;
    const shell = `<div class="app-shell" data-cint-app-shell="1" data-product-surface="code_intelligence">
<main>
<section class="app-view-panel" data-view="landing" id="landing">${door}</section>
<section class="app-view-panel" data-view="landing" id="landing-dup">${door}</section>
</main>
</div>`;
    const healed = healCodeIntelligencePreviewHtml(shell, { forceCi: true });
    const landingOpens = [...healed.matchAll(/<section\b[^>]*\bdata-view=["']landing["']/gi)];
    expect(landingOpens.length).toBe(1);
    expect(healed).toMatch(/data-cint-orphan|data-view=["']cint-bleed["']/i);
  });

  it("deepens present-but-hollow Overview and Settings (GP-CI-03)", () => {
    const shell = `<div class="app-shell" data-cint-app-shell="1" data-product-surface="code_intelligence">
<aside class="app-sidebar" data-cint-rail="1"></aside>
<main>
<section class="app-view-panel" data-view="overview" id="overview"><h2>Overview</h2></section>
<section class="app-view-panel" data-view="settings" id="settings" hidden><h2>Settings</h2></section>
<section class="app-view-panel" data-view="repositories" id="repositories" hidden><h2>Repositories</h2></section>
<section class="app-view-panel" data-view="findings" id="findings" hidden><h2>Findings</h2></section>
</main>
</div>`;
    const healed = healCodeIntelligencePreviewHtml(shell, { forceCi: true });
    expect(healed).toContain("data-cint-repo-select");
    expect(healed).toContain("data-cint-workspace-main");
    expect(healed).toContain("data-cint-audit");
    expect(healed).toMatch(/data-view=["']overview["'][\s\S]*data-cint-workspace-main/i);
    expect(healed).toMatch(/data-view=["']settings["'][\s\S]*data-cint-audit/i);
    // Findings stays hollow-title until deepened or IHS/export chrome lands.
    expect(healed).toMatch(/data-view=["']findings["']/i);
  });

  it("lifts workspace pages swallowed inside Sign in so they are not one scroll", () => {
    const swallowed = `<div class="app-shell" data-cint-app-shell="1">
<main>
<section class="app-view-panel" data-view="login">
  <div data-cint-page="login" data-cint-auth="1"><h2>Sign in</h2>
  <div data-cint-page="overview" data-cint-shell>
    <header data-cint-chrome></header>
    <h2>Overview</h2>
    <section><h3>Activity</h3><div data-cint-activity></div></section>
    <section><h3>Recommendations</h3><div data-cint-recs></div></section>
  </div>
</section>
</main>
</div>`;
    const healed = healCodeIntelligencePreviewHtml(swallowed);
    expect(healed).toMatch(/data-view="login"[^>]*\bhidden\b/);
    expect(healed).toMatch(/data-view="overview"[^>]*\bhidden\b|data-cint-page="overview"/);
    expect(healed.indexOf("Sign in")).toBeLessThan(healed.indexOf("data-cint-page=\"overview\""));
    const loginOpen = healed.match(/<section[^>]*data-view="login"[^>]*>[\s\S]*?<\/section>/i)?.[0] ?? "";
    expect(loginOpen).toContain("Sign in");
    expect(loginOpen).not.toContain("data-cint-page=\"overview\"");
    expect(loginOpen).not.toContain("data-cint-activity");
  });

  it("strips brochure contact/legal chrome but keeps sealed CI Support/Contacts pages", () => {
    const html = `<div class="app-shell" data-cint-app-shell="1" data-product-surface="code_intelligence">
<main>
<section class="app-view-panel" data-view="login"><h2>Sign in</h2></section>
<section class="app-view-panel" data-view="support" data-cint-page="support"><h2>Support</h2></section>
<section class="app-view-panel" data-view="contacts" data-cint-page="contacts"><h2>Contacts</h2></section>
</main>
<footer class="website-footer">
  <a href="#contact">Contact</a>
  <a href="#privacy">Privacy</a>
  <a href="#terms">Terms</a>
</footer>
<section data-view="contact"><h2>Contact</h2></section>
</div>`;
    const healed = healCodeIntelligencePreviewHtml(html);
    expect(healed).toMatch(/data-view="login"/);
    expect(healed).toMatch(/data-view="signup"/);
    expect(healed).toMatch(/data-view="forgot-password"/);
    expect(healed).toMatch(/data-view="support"/);
    expect(healed).toMatch(/data-view="contacts"/);
    expect(healed).not.toMatch(/href=["']#(?:contact|privacy|terms)["']/i);
    expect(healed).not.toMatch(/data-view=["'](?:contact|privacy|terms)["']/i);
    expect(healed).not.toContain("website-footer");
  });

  it("keeps Landing visible when it is nested under a non-route wrapper", () => {
    const nested = `<div class="app-shell" data-cint-app-shell="1" data-product-surface="code_intelligence">
<main class="app-main">
<div class="app-view website-main">
<section class="app-view-panel" data-view="landing"><h2>Code Intelligence</h2><a href="#login" data-view-nav="login">Sign in</a></section>
</div>
</main>
</div>`;
    const healed = healCodeIntelligencePreviewHtml(nested);
    expect(healed).toMatch(/<main[^>]*>[\s\S]*data-view="landing"/i);
    expect(healed).not.toMatch(/data-view="landing"[^>]*\bhidden\b/);
    expect(healed).toContain("Sign in");
  });

  it("wraps a nav-only sealed fragment in the vertical workspace rail", () => {
    const fragment = `<div data-cint-shell data-product-surface="code_intelligence">
<nav data-cint-nav aria-label="Code Intelligence"><div class="cint-nav-group"><a href="#overview">Overview</a></div></nav>
<div data-cint-workspace-main><h2>Overview</h2></div>
</div>`;
    const healed = healCodeIntelligencePreviewHtml(fragment);
    expect(healed).toContain('data-cint-app-shell="1"');
    expect(healed).toContain('data-cint-rail="1"');
    expect(healed).toContain('data-view-nav="settings"');
    expect(healed).toContain('data-view-nav="admin"');
    expect(healed).not.toMatch(/<nav[^>]*data-cint-nav/);
    const rail = healed.match(/<aside\b[^>]*data-cint-rail[\s\S]*?<\/aside>/i)?.[0] ?? "";
    expect(rail).not.toContain("data-cint-signout");
  });

  it("hides leftover HTML without promoting cint-bleed as a page", () => {
    const html = `<div class="app-shell" data-cint-app-shell="1">
<main>
<section class="app-view-panel" data-view="landing"><h2>Code Intelligence</h2></section>
<p>orphan leftover copy</p>
</main>
</div>`;
    const healed = healCodeIntelligencePreviewHtml(html);
    expect(healed).not.toMatch(
      /<(?:section|div|article)\b[^>]*\bdata-view=["']cint-bleed["']/i,
    );
    expect(healed).toMatch(/data-cint-orphan="1"/);
  });

  it("reseats workspace panels that landed outside main so sidebar routes resolve", () => {
    const html = `<div class="app-shell" data-cint-app-shell="1" data-product-surface="code_intelligence">
<aside class="app-sidebar" data-cint-rail="1"></aside>
<main class="app-main">
<section class="app-view-panel" data-view="overview"><h2>Overview</h2></section>
</main>
</div>
<section class="app-view-panel app-custom-view" data-view="findings"><h2>Findings</h2><div data-cint-finding-rows="findings"></div></section>
<section class="app-view-panel app-custom-view" data-view="repositories"><h2>Repositories</h2></section>`;
    const healed = healCodeIntelligencePreviewHtml(html);
    const mainInner = healed.slice(
      healed.toLowerCase().indexOf("<main"),
      healed.toLowerCase().lastIndexOf("</main>") + 7,
    );
    expect(mainInner).toMatch(/data-view=["']findings["']/i);
    expect(mainInner).toMatch(/data-view=["']repositories["']/i);
    expect(mainInner).toMatch(/data-view=["']settings["']/i);
    expect(mainInner).not.toMatch(/data-view=["']security["']/i);
    const afterMain = healed.slice(healed.toLowerCase().lastIndexOf("</main>") + 7);
    expect(afterMain).not.toMatch(
      /<(?:section|div|article)\b[^>]*\bdata-view=["']findings["']/i,
    );
  });
});
