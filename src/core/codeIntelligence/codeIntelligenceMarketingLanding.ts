/**
 * Professional marketing Landing HTML for Code Intelligence.
 * Projects cint.landing.brief.v1 — Login/Signup remain separate auth doors.
 * Authorized by operator after Phases 1–5 (explicit).
 */

import { CINT_BRAND_MARK_SVG } from "@/core/codeIntelligence/codeIntelligenceBrandMark";
import {
  CODE_INTELLIGENCE_LANDING_BRIEF,
  mayGenerateCodeIntelligenceMarketingLanding,
} from "@/core/codeIntelligence/codeIntelligenceLandingBrief";

export const CINT_MARKETING_LANDING_MARK = "data-cint-marketing" as const;

/** Operator authorized completing the marketing Landing (this session). */
export const CINT_MARKETING_LANDING_OPERATOR_AUTHORIZED = true as const;

export function assertCodeIntelligenceMarketingLandingAllowed(): {
  ok: boolean;
  reason: string;
} {
  return mayGenerateCodeIntelligenceMarketingLanding({
    truthMapAccepted: true,
    identitySealed: true,
    registryAuthorityOk: true,
    entityAuthorityOk: true,
    workflowAuthorityOk: true,
    // Explicit operator order completes Landing before full workspace parity heal.
    workspaceParityStable: true,
    explicitAuthorizeMarketingLanding: CINT_MARKETING_LANDING_OPERATOR_AUTHORIZED,
  });
}

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Full marketing Landing body (inside data-cint-page=landing). */
export function buildCodeIntelligenceMarketingLandingHtml(): string {
  const gate = assertCodeIntelligenceMarketingLandingAllowed();
  if (!gate.ok) {
    return `<div data-cint-page-body data-cint-marketing-blocked="1"><p>${esc(gate.reason)}</p>
      <p class="cint-row"><a href="#login" class="app-btn" data-view-nav="login">Sign in</a></p></div>`;
  }

  const b = CODE_INTELLIGENCE_LANDING_BRIEF;
  const pal = b.visual.palette;
  const navSectionId: Record<string, string> = {
    Platform: "platform",
    Solutions: "solutions",
    Intelligence: "intelligence",
    Security: "security",
    Documentation: "documentation",
    Pricing: "pricing",
  };
  // Section links only — Sign In lives in a dedicated always-visible actions cluster
  // (Live preview iframes clip wrapped nav links on the right edge).
  const nav = b.navigation
    .filter((item) => item !== "Sign In")
    .map((item) => {
      const sectionId = navSectionId[item] ?? item.toLowerCase().replace(/\s+/g, "-");
      return `<a href="#${sectionId}" class="cint-mkt-nav-link" data-cint-mkt-scroll="${sectionId}">${esc(item)}</a>`;
    })
    .join("");

  const trust = b.trustCards
    .map(
      (card) =>
        `<article class="cint-mkt-card"><h3>${esc(card.title)}</h3><p>${esc(card.line)}</p></article>`,
    )
    .join("");

  const cascade = b.problem.cascade.map((step) => `<li>${esc(step)}</li>`).join("");

  const pillars = b.pillars
    .map(
      (p) =>
        `<article class="cint-mkt-card"><h3>${esc(p.title)}</h3><p>${esc(p.body)}</p></article>`,
    )
    .join("");

  const flow = b.howItWorks.map((step) => `<li>${esc(step)}</li>`).join("");

  const previewNav = b.workspacePreview.nav.map((n) => `<li>${esc(n)}</li>`).join("");
  const previewCenter = b.workspacePreview.center.map((n) => `<li>${esc(n)}</li>`).join("");
  const previewRight = b.workspacePreview.right.map((n) => `<li>${esc(n)}</li>`).join("");

  const preserved = b.knowledgeCrisis.preserved.map((n) => `<li>${esc(n)}</li>`).join("");
  const gov = b.securityGovernance.features.map((n) => `<li>${esc(n)}</li>`).join("");
  const audiences = b.audiences
    .map(
      (a) =>
        `<article class="cint-mkt-card"><h3>${esc(a.role)}</h3><p>${esc(a.line)}</p></article>`,
    )
    .join("");

  return `<div ${CINT_MARKETING_LANDING_MARK}="1" data-cint-page-body class="cint-mkt" style="--cint-mkt-bg:${pal.background};--cint-mkt-panel:${pal.panels};--cint-mkt-accent:${pal.accent};--cint-mkt-ok:${pal.success};--cint-mkt-warn:${pal.warning};--cint-mkt-crit:${pal.critical}">
  <header class="cint-mkt-nav" data-cint-mkt-nav>
    <div class="cint-mkt-brand">
      ${CINT_BRAND_MARK_SVG}
      <div class="cint-mkt-brand-text">
        <strong>${esc(b.brand.logoTitle)}</strong>
        <span>${esc(b.brand.logoKicker)}</span>
      </div>
    </div>
    <nav aria-label="Marketing">${nav}</nav>
    <div class="cint-mkt-nav-actions" data-cint-mkt-nav-actions>
      <a href="#login" class="app-btn cint-mkt-cta" data-view-nav="login" data-cint-mkt-signin="1">Sign In</a>
      <a href="#login" class="app-btn cint-mkt-cta-secondary" data-view-nav="login">${esc(b.primaryCta)}</a>
    </div>
  </header>

  <section class="cint-mkt-hero" id="platform" data-cint-mkt-hero>
    <p class="cint-mkt-motifs">${b.hero.backgroundMotifs.map(esc).join(" · ")}</p>
    <h1>${esc(b.hero.headline)}</h1>
    <p class="cint-mkt-sub">${esc(b.hero.subheadline)}</p>
    <div class="cint-mkt-actions">
      <a href="#intelligence" class="app-btn cint-mkt-cta" data-cint-mkt-scroll="intelligence">${esc(b.hero.ctas[0] ?? "Explore Platform")}</a>
      <a href="#login" class="app-btn cint-mkt-cta-secondary" data-view-nav="login">${esc(b.hero.ctas[1] ?? "Request Demo")}</a>
      <a href="#login" class="cint-mkt-link" data-view-nav="login">${esc(b.hero.secondaryCta)}</a>
    </div>
    <p class="cint-trust" data-cint-demo="1" data-cint-trust="gateway">Illustrative demo. Sign-in unlocks the workspace — no live IdP, GitHub OAuth, or production auth.</p>
  </section>

  <section class="cint-mkt-section" id="trust" data-cint-mkt-trust>
    <div class="cint-mkt-grid-3">${trust}</div>
  </section>

  <section class="cint-mkt-section" id="solutions" data-cint-mkt-problem>
    <h2>${esc(b.problem.headline)}</h2>
    <p>${esc(b.problem.subheadline)}</p>
    <ol class="cint-mkt-cascade">${cascade}</ol>
  </section>

  <section class="cint-mkt-section" id="intelligence" data-cint-mkt-pillars>
    <h2>Platform Intelligence Pillars</h2>
    <div class="cint-mkt-grid-3">${pillars}</div>
  </section>

  <section class="cint-mkt-section" id="how-it-works" data-cint-mkt-flow>
    <h2>How It Works</h2>
    <ol class="cint-mkt-flow">${flow}</ol>
  </section>

  <section class="cint-mkt-section" id="documentation" data-cint-mkt-preview>
    <h2 id="workspace">Workspace Preview</h2>
    <p class="cint-mkt-note">${esc(b.workspacePreview.note)}</p>
    <div class="cint-mkt-preview">
      <aside><h3>Navigation</h3><ul>${previewNav}</ul></aside>
      <div><h3>Command centre</h3><ul>${previewCenter}</ul></div>
      <aside><h3>Signals</h3><ul>${previewRight}</ul></aside>
    </div>
  </section>

  <section class="cint-mkt-section" id="knowledge" data-cint-mkt-knowledge>
    <h2>${esc(b.knowledgeCrisis.headline)}</h2>
    <p>${esc(b.knowledgeCrisis.subheadline)}</p>
    <ul class="cint-mkt-chips">${preserved}</ul>
  </section>

  <section class="cint-mkt-section" id="security" data-cint-mkt-security>
    <h2>${esc(b.securityGovernance.headline)}</h2>
    <ul class="cint-mkt-chips">${gov}</ul>
  </section>

  <section class="cint-mkt-section" id="audiences" data-cint-mkt-audiences>
    <h2>Who Uses Code Intelligence?</h2>
    <div class="cint-mkt-grid-3">${audiences}</div>
  </section>

  <section class="cint-mkt-section" id="vision" data-cint-mkt-vision>
    <h2>${esc(b.vision.headline)}</h2>
    <p>${esc(b.vision.body)}</p>
  </section>

  <section class="cint-mkt-section cint-mkt-final" id="pricing" data-cint-mkt-final>
    <h2>${esc(b.finalCta.headline)}</h2>
    <p>${esc(b.finalCta.subheadline)}</p>
    <div class="cint-mkt-actions">
      <a href="#login" class="app-btn cint-mkt-cta" data-view-nav="login">${esc(b.finalCta.buttons[0] ?? "Request Demo")}</a>
      <a href="#signup" class="app-btn cint-mkt-cta-secondary" data-view-nav="signup">${esc(b.finalCta.buttons[1] ?? "Start Evaluation")}</a>
      <a href="#login" class="cint-mkt-link" data-view-nav="login">${esc(b.finalCta.buttons[2] ?? "Sign In")}</a>
    </div>
  </section>

  <footer class="cint-mkt-footer" data-cint-mkt-footer>
    <strong>${esc(b.brand.logoTitle)}</strong>
    <span>${esc(b.brand.logoKicker)}</span>
    <span>Demo trust: no live repository indexing, CVEs, or source mutation.</span>
  </footer>
</div>`;
}

/** Scoped marketing CSS appended into product paint CSS. */
export const CODE_INTELLIGENCE_MARKETING_LANDING_CSS = `
[data-cint-shell][data-cint-auth="1"][data-cint-gateway-surface="marketing"]{max-width:none!important;width:100%!important;margin:0!important;min-height:100%!important;padding:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;background:transparent!important}
/* Gateway-only — never key off inner marketing when Landing panel is [hidden] (post sign-in bleed). */
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"]:not([data-cint-authed="1"]):has([data-view="landing"]:not([hidden]) [data-cint-marketing="1"]){grid-template-columns:1fr!important;background:#0B1020!important}
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"]:not([data-cint-authed="1"]):has([data-view="landing"]:not([hidden]) [data-cint-marketing="1"]) > .app-main{grid-column:1 / -1!important;width:100%!important;max-width:none!important;background:#0B1020!important}
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"]:not([data-cint-authed="1"]) > .app-main:has([data-view="landing"]:not([hidden]) [data-cint-marketing="1"]){align-items:stretch!important;justify-content:flex-start!important;padding:0!important;overflow-y:scroll!important;scrollbar-gutter:stable!important}
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"]:not([data-cint-authed="1"]) [data-cint-marketing="1"] .cint-mkt-nav .cint-mkt-nav-link[data-view-nav="login"],
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"]:not([data-cint-authed="1"]) [data-view="landing"]:not([hidden]) [data-cint-marketing="1"] a[data-view-nav="login"],
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"]:not([data-cint-authed="1"]) [data-view="landing"]:not([hidden]) [data-cint-marketing="1"] [data-cint-mkt-signin],
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"]:not([data-cint-authed="1"]) [data-view="landing"]:not([hidden]) [data-cint-marketing="1"] .cint-mkt-nav-actions{display:inline-flex!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important}
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"]:not([data-cint-authed="1"]) [data-view="landing"]:has([data-cint-marketing="1"]):not([hidden]){width:100%!important;max-width:none!important;margin:0!important;min-height:0!important;height:auto!important;overflow:visible!important;display:flex!important;flex-direction:column!important;background:#0B1020!important}
.app-shell[data-cint-app-shell="1"] [data-cint-shell][data-cint-gateway-surface="marketing"]{max-width:none!important;width:100%!important;margin:0!important;padding:0!important;border:0!important;box-shadow:none!important;background:transparent!important}
html:has(.app-shell[data-cint-zone="gateway"] [data-view="landing"]:not([hidden]) [data-cint-marketing="1"]),
body:has(.app-shell[data-cint-zone="gateway"] [data-view="landing"]:not([hidden]) [data-cint-marketing="1"]){background:#0B1020!important}
/* Workspace wins — kill Landing dark palette + footer/toggle bleed after sign-in. */
html:has(.app-shell[data-cint-zone="workspace"]),
body:has(.app-shell[data-cint-zone="workspace"]),
html:has(.app-shell[data-cint-authed="1"]),
body:has(.app-shell[data-cint-authed="1"]){background:#e8eef5!important;color:#122033!important}
.app-shell[data-cint-app-shell="1"][data-cint-zone="workspace"],
.app-shell[data-cint-app-shell="1"][data-cint-authed="1"]{background:#e8eef5!important}
.app-shell[data-cint-app-shell="1"][data-cint-zone="workspace"] [data-view="landing"],
.app-shell[data-cint-app-shell="1"][data-cint-authed="1"] [data-view="landing"],
.app-shell[data-cint-app-shell="1"][data-cint-zone="workspace"] [data-cint-marketing],
.app-shell[data-cint-app-shell="1"][data-cint-authed="1"] [data-cint-marketing]{display:none!important;visibility:hidden!important;height:0!important;max-height:0!important;overflow:hidden!important;margin:0!important;padding:0!important;border:0!important;pointer-events:none!important}
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"]:not([data-cint-authed="1"]) .cint-sidebar-toggle,
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"]:not([data-cint-authed="1"]) [data-cint-sidebar-toggle],
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"]:not([data-cint-authed="1"]) > .app-sidebar{display:none!important;visibility:hidden!important;pointer-events:none!important}
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"]:not([data-cint-authed="1"]) [data-cint-marketing="1"].cint-mkt{--cint-mkt-bg:#0B1020;--cint-mkt-panel:#111827;--cint-mkt-accent:#3B82F6;display:flex!important;flex-direction:column!important;min-height:0!important;box-sizing:border-box!important;background:var(--cint-mkt-bg)!important;color:#E5E7EB!important;font-family:"IBM Plex Sans","Segoe UI",sans-serif;padding:0!important;overflow:visible!important}
.app-shell[data-cint-app-shell="1"] [data-cint-marketing="1"] .cint-mkt-nav{display:flex;flex-wrap:wrap;gap:1rem;align-items:center;justify-content:space-between;padding:1rem 1.5rem;border-bottom:1px solid rgba(59,130,246,.25);background:#111827!important;position:sticky;top:0;z-index:30;flex:0 0 auto;backdrop-filter:none}
.app-shell[data-cint-app-shell="1"] [data-cint-marketing="1"] .cint-mkt-brand{display:flex;flex-direction:row;align-items:center;gap:.65rem;flex:0 1 auto;min-width:0}
.app-shell[data-cint-app-shell="1"] [data-cint-marketing="1"] .cint-mkt-brand .cint-brand-mark{flex:0 0 auto;display:block;border-radius:.5rem}
.app-shell[data-cint-app-shell="1"] [data-cint-marketing="1"] .cint-mkt-brand-text{display:flex;flex-direction:column;gap:.15rem;min-width:0}
.app-shell[data-cint-app-shell="1"] [data-cint-marketing="1"] .cint-mkt-brand strong{font-size:1.05rem;letter-spacing:.04em;color:#F9FAFB}
.app-shell[data-cint-app-shell="1"] [data-cint-marketing="1"] .cint-mkt-brand span{font-size:.75rem;color:#9CA3AF}
.app-shell[data-cint-app-shell="1"] [data-cint-marketing="1"] .cint-mkt-nav nav{display:flex;flex-wrap:wrap;gap:.85rem;align-items:center;flex:1 1 12rem;min-width:0}
.app-shell[data-cint-app-shell="1"] [data-cint-marketing="1"] .cint-mkt-nav-actions{display:inline-flex!important;flex-wrap:wrap;gap:.55rem;align-items:center;flex:0 0 auto;margin-left:auto}
.app-shell[data-cint-app-shell="1"] [data-cint-marketing="1"] .cint-mkt-nav-actions .app-btn{white-space:nowrap}
.app-shell[data-cint-app-shell="1"] [data-cint-marketing="1"] .cint-mkt-nav-link{color:#CBD5E1!important;text-decoration:none;font-size:.85rem}
.app-shell[data-cint-app-shell="1"] [data-cint-marketing="1"] .cint-mkt-hero{padding:2.75rem 1.5rem 2.5rem;background:radial-gradient(ellipse at 20% 0%,rgba(59,130,246,.22),transparent 55%),linear-gradient(180deg,#0B1020,#0f172a 70%);border-bottom:1px solid rgba(148,163,184,.15);flex:0 0 auto;position:relative;z-index:1}
.app-shell[data-cint-app-shell="1"] [data-cint-marketing="1"] .cint-mkt-motifs{font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;color:#93C5FD;margin:0 0 1rem}
.app-shell[data-cint-app-shell="1"] [data-cint-marketing="1"] .cint-mkt-hero h1{font-family:"IBM Plex Serif",Georgia,serif;font-size:clamp(2rem,4vw,3.25rem);line-height:1.1;margin:0 0 1rem;color:#F8FAFC;max-width:18ch}
.app-shell[data-cint-app-shell="1"] [data-cint-marketing="1"] .cint-mkt-sub{max-width:42rem;color:#CBD5E1;font-size:1.05rem;line-height:1.55;margin:0 0 1.5rem}
.app-shell[data-cint-app-shell="1"] [data-cint-marketing="1"] .cint-mkt-actions{display:flex;flex-wrap:wrap;gap:.75rem;align-items:center;margin-bottom:1rem}
.app-shell[data-cint-app-shell="1"] [data-cint-marketing="1"] .cint-mkt-cta{background:var(--cint-mkt-accent)!important;color:#fff!important}
.app-shell[data-cint-app-shell="1"] [data-cint-marketing="1"] .cint-mkt-cta-secondary{background:transparent!important;color:#E5E7EB!important;border:1px solid rgba(148,163,184,.45)!important}
.app-shell[data-cint-app-shell="1"] [data-cint-marketing="1"] .cint-mkt-link{color:#93C5FD!important}
.app-shell[data-cint-app-shell="1"] [data-cint-marketing="1"] .cint-mkt-section{padding:2.5rem 1.5rem;border-bottom:1px solid rgba(148,163,184,.12);flex:0 0 auto;flex-shrink:0}
.app-shell[data-cint-app-shell="1"] [data-cint-marketing="1"] .cint-mkt-section h2{font-family:"IBM Plex Serif",Georgia,serif;font-size:1.65rem;margin:0 0 .75rem;color:#F8FAFC}
.app-shell[data-cint-app-shell="1"] [data-cint-marketing="1"] .cint-mkt-section > p{max-width:40rem;color:#CBD5E1;line-height:1.55}
.app-shell[data-cint-app-shell="1"] [data-cint-marketing="1"] .cint-mkt-grid-3{display:grid;grid-template-columns:repeat(auto-fit,minmax(14rem,1fr));gap:1rem;margin-top:1.25rem}
.app-shell[data-cint-app-shell="1"] [data-cint-marketing="1"] .cint-mkt-card{background:var(--cint-mkt-panel);border:1px solid rgba(148,163,184,.18);border-radius:.35rem;padding:1rem 1.1rem}
.app-shell[data-cint-app-shell="1"] [data-cint-marketing="1"] .cint-mkt-card h3{margin:0 0 .4rem;font-size:1rem;color:#F1F5F9}
.app-shell[data-cint-app-shell="1"] [data-cint-marketing="1"] .cint-mkt-card p{margin:0;color:#9CA3AF;font-size:.9rem;line-height:1.45}
.app-shell[data-cint-app-shell="1"] [data-cint-marketing="1"] .cint-mkt-cascade,.cint-mkt-flow{list-style:none;padding:0;margin:1rem 0 0;display:flex;flex-direction:column;gap:.45rem;max-width:28rem}
.app-shell[data-cint-app-shell="1"] [data-cint-marketing="1"] .cint-mkt-cascade li,.cint-mkt-flow li{padding:.55rem .8rem;background:var(--cint-mkt-panel);border-left:3px solid var(--cint-mkt-accent);color:#E5E7EB}
.app-shell[data-cint-app-shell="1"] [data-cint-marketing="1"] .cint-mkt-preview{display:grid;grid-template-columns:repeat(auto-fit,minmax(12rem,1fr));gap:1rem;margin-top:1rem}
.app-shell[data-cint-app-shell="1"] [data-cint-marketing="1"] .cint-mkt-preview > *{background:var(--cint-mkt-panel);border:1px solid rgba(148,163,184,.18);border-radius:.35rem;padding:1rem}
.app-shell[data-cint-app-shell="1"] [data-cint-marketing="1"] .cint-mkt-preview h3{margin:0 0 .5rem;font-size:.85rem;color:#93C5FD;text-transform:uppercase;letter-spacing:.06em}
.app-shell[data-cint-app-shell="1"] [data-cint-marketing="1"] .cint-mkt-preview ul{margin:0;padding-left:1.1rem;color:#CBD5E1;font-size:.9rem}
.app-shell[data-cint-app-shell="1"] [data-cint-marketing="1"] .cint-mkt-note{font-size:.85rem;color:#9CA3AF}
.app-shell[data-cint-app-shell="1"] [data-cint-marketing="1"] .cint-mkt-chips{list-style:none;display:flex;flex-wrap:wrap;gap:.5rem;padding:0;margin:1rem 0 0}
.app-shell[data-cint-app-shell="1"] [data-cint-marketing="1"] .cint-mkt-chips li{padding:.4rem .7rem;border:1px solid rgba(59,130,246,.35);border-radius:.25rem;color:#E5E7EB;font-size:.85rem;background:rgba(17,24,39,.8)}
.app-shell[data-cint-app-shell="1"] [data-cint-marketing="1"] .cint-mkt-final{background:linear-gradient(180deg,rgba(59,130,246,.12),transparent);flex:0 0 auto}
.app-shell[data-cint-app-shell="1"] [data-cint-marketing="1"] .cint-mkt-footer{display:flex;flex-wrap:wrap;gap:.75rem 1.25rem;padding:1.5rem 1.5rem 2rem;color:#9CA3AF;font-size:.8rem;border-top:1px solid rgba(148,163,184,.15);margin-top:2rem;flex:0 0 auto;flex-shrink:0;background:#0B1020;position:relative;z-index:2}
.app-shell[data-cint-app-shell="1"] [data-cint-marketing="1"] .cint-trust{color:#94A3B8!important}
/* Gateway: never let workspace panels peek under / after marketing scroll. */
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"]:not([data-cint-authed="1"]) > .app-main{flex-direction:column!important}
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"]:not([data-cint-authed="1"]) > .app-main > [data-view]:not([data-view="landing"]):not([data-view="login"]):not([data-view="signup"]):not([data-view="forgot-password"]),
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"]:not([data-cint-authed="1"]) > .app-main > [data-view="overview"],
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"]:not([data-cint-authed="1"]) > .app-main > [data-view="overview"] [data-cint-activity],
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"]:not([data-cint-authed="1"]) > .app-main > [data-view="overview"] [data-cint-recs]{display:none!important;visibility:hidden!important;height:0!important;max-height:0!important;overflow:hidden!important;margin:0!important;padding:0!important;pointer-events:none!important}
`;
