/**
 * Code Intelligence workspace panels — shared shell + distinct page jobs.
 * Security = posture. Findings = register. Remediation = proposed fixes.
 * HVM on sealed pack pages. Demo-labeled. Not Replica chrome.
 *
 * Single HTML/CSS construction owner for CI product chrome:
 * `healCodeIntelligencePreviewHtml` (+ paint CSS append). Persist and Repair must
 * call this (via `healCodeIntelligencePreviewBundle`) — do not invent a second
 * shell builder. Runtime `ensureRail` is fallback only when rail HTML is missing.
 */

import {
  CODE_INTELLIGENCE_ALL_ALLOWED_PAGE_LABELS,
  isCodeIntelligencePromptText,
} from "@/core/domainPack/codeIntelligenceDomainPack";
import { isCodeIntelligenceProductAsk } from "@/core/field/fieldRegistryId";
import { CINT_BRAND_MARK_SVG } from "@/core/codeIntelligence/codeIntelligenceBrandMark";
import {
  buildCodeIntelligenceMarketingLandingHtml,
  CODE_INTELLIGENCE_MARKETING_LANDING_CSS,
} from "@/core/codeIntelligence/codeIntelligenceMarketingLanding";
import {
  codeIntelligenceIntegrationHostCss,
  ensureCodeIntelligenceIntegrationHostSurfaces,
  integrationHostHtmlForPage,
} from "@/core/codeIntelligence/codeIntelligenceIntegrationHostSurfaces";
import { normalizePageKey } from "@/lib/audit/blueprintPageTruth";
import { estimatePanelDepth } from "@/core/measurement/structureProjectionService";

export { CINT_BRAND_MARK_SVG };

export const CODE_INTELLIGENCE_WORKSPACE_CSS = `
body:has([data-cint-shell]),body:has([data-cint-app-shell]){background:#e8eef5;color:#122033}
body:has([data-cint-shell]):not(:has([data-cint-app-shell])) .website-sidebar,
body:has([data-cint-shell]):not(:has([data-cint-app-shell])) .app-sidebar,
body:has([data-cint-shell]) nav[aria-label="Primary"]:not([data-cint-nav]),
body:has([data-cint-shell]) .app-notification-bell,
body:has([data-cint-shell]) .website-user-menu-trigger,
body:has([data-cint-shell]) .website-user-avatar,
body:has([data-cint-shell]) .app-header-search,
body:has([data-cint-shell]) .app-header-utilities,
body:has([data-cint-shell]) .saas-workspace-utilities,
body:has([data-cint-shell]) .app-user-menu{display:none !important}
body:has([data-cint-shell]) .website-main > h1,
body:has([data-cint-shell]) .app-view > h1,
body:has([data-cint-shell]) [data-page-title]{display:none !important}
body:has([data-cint-shell]) .website-main,
body:has([data-cint-shell]) .app-main,
body:has([data-cint-shell]) .app-view{padding:0;background:#f4f7fb;color:#122033}
/* Page shells never own a nav column — outer data-cint-rail does. (2-col here = empty grey gutter.) */
[data-cint-shell]{--cint-bg:#f4f7fb;--cint-ink:#122033;--cint-muted:#5b6b7c;--cint-line:#d3dde8;--cint-teal:#0f766e;--cint-navy:#0f1b2d;--cint-panel:#ffffff;--cint-warn:#b45309;--cint-sidebar-width:15.5rem;--cint-sidebar-width-icon:3.25rem;display:block!important;grid-template-columns:1fr!important;min-height:100%;max-width:100%;min-width:0;overflow-x:hidden;box-sizing:border-box;color:var(--cint-ink);background:var(--cint-bg);font:13.5px/1.5 "Segoe UI",ui-sans-serif,system-ui,sans-serif;letter-spacing:.01em}
[data-cint-shell][data-cint-sidebar="collapsed"]{grid-template-columns:1fr!important}
[data-cint-shell][data-cint-auth="1"]{grid-template-columns:1fr;max-width:26rem;margin:12vh auto;min-height:auto;padding:1.5rem;border:1px solid var(--cint-line);border-radius:1rem;background:#fff;box-shadow:0 18px 48px rgba(15,27,45,.12)}
[data-cint-nav]{display:none!important}
[data-cint-nav] .cint-nav-abbr{display:none}
/* Shell defaults to ONE column. Two columns ONLY when runtime stamps data-cint-rail-on
   (rail actually painted). Never 2-col from :has(rail) while display:none — that is the grey void. */
.app-shell[data-cint-app-shell="1"]{--cint-sidebar-width:15.5rem;--cint-sidebar-width-icon:3.25rem;display:grid!important;grid-template-columns:1fr!important;grid-template-rows:minmax(0,1fr)!important;min-height:100%!important;height:100%!important;background:#e8eef5!important;color:#122033!important;font-family:"Segoe UI",ui-sans-serif,system-ui,sans-serif}
.app-shell[data-cint-app-shell="1"][data-cint-rail-on="1"]{grid-template-columns:var(--cint-sidebar-width) minmax(0,1fr)!important}
.app-shell[data-cint-app-shell="1"][data-cint-rail-on="1"][data-cint-sidebar="collapsed"]{grid-template-columns:var(--cint-sidebar-width-icon) minmax(0,1fr)!important}
.app-shell[data-cint-app-shell="1"] > .app-sidebar,
.app-shell[data-cint-app-shell="1"] > .app-sidebar[data-cint-rail]{display:none!important}
.app-shell[data-cint-app-shell="1"][data-cint-rail-on="1"] > .app-sidebar,
.app-shell[data-cint-app-shell="1"][data-cint-rail-on="1"] > .app-sidebar[data-cint-rail]{display:flex!important;flex-direction:column!important;flex-wrap:nowrap!important;visibility:visible!important;opacity:1!important;background:#0f1b2d!important;color:#e8eef8!important;border-right:1px solid #1c2a3f!important;padding:1rem .85rem!important;grid-column:1!important;grid-row:1 / -1!important;align-self:stretch!important;box-sizing:border-box!important;width:var(--cint-sidebar-width)!important;min-width:var(--cint-sidebar-width)!important;max-width:var(--cint-sidebar-width)!important;height:100%!important;min-height:100%!important;max-height:100%!important;overflow:hidden!important;z-index:5!important}
.app-shell[data-cint-app-shell="1"] > .app-sidebar .cint-sidebar-toggle,
.app-shell[data-cint-app-shell="1"] > .app-sidebar [data-cint-sidebar-toggle]{display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:0 0 auto!important;flex-shrink:0!important;visibility:visible!important;opacity:1!important;color:#e8eef8!important;background:#16263a!important;border:1px solid #2a415c!important;min-width:2.25rem!important;min-height:2.25rem!important;width:2.25rem!important;height:2.25rem!important;margin:0 0 .75rem!important;padding:0!important;border-radius:.45rem!important;cursor:pointer!important;z-index:6!important}
.app-shell[data-cint-app-shell="1"] > .app-sidebar .cint-sidebar-toggle svg,
.app-shell[data-cint-app-shell="1"] > .app-sidebar [data-cint-sidebar-toggle] svg{display:block!important;width:16px!important;height:16px!important;stroke:currentColor!important}
.app-shell[data-cint-app-shell="1"] > .app-sidebar .app-sidebar-brand{flex:0 0 auto!important;flex-shrink:0!important}
.app-shell[data-cint-app-shell="1"][data-cint-rail-on="1"] > .app-sidebar .app-sidebar-nav{flex:1 1 auto!important;min-height:0!important;overflow-x:hidden!important;overflow-y:scroll!important;scrollbar-gutter:stable;scrollbar-width:thin;scrollbar-color:#4a6280 #0f1b2d;-webkit-overflow-scrolling:touch}
.app-shell[data-cint-app-shell="1"][data-cint-rail-on="1"] > .app-sidebar .app-sidebar-nav::-webkit-scrollbar{width:8px}
.app-shell[data-cint-app-shell="1"][data-cint-rail-on="1"] > .app-sidebar .app-sidebar-nav::-webkit-scrollbar-thumb{background:#4a6280;border-radius:4px}
.app-shell[data-cint-app-shell="1"][data-cint-rail-on="1"][data-cint-sidebar="collapsed"] > .app-sidebar{padding:.55rem .3rem!important;width:var(--cint-sidebar-width-icon)!important;min-width:var(--cint-sidebar-width-icon)!important;max-width:var(--cint-sidebar-width-icon)!important}
.app-shell[data-cint-app-shell="1"] > .app-footer{display:none!important}
.app-shell[data-cint-app-shell="1"] > .app-sidebar .cint-nav-abbr{display:none}
.app-shell[data-cint-app-shell="1"][data-cint-sidebar="collapsed"] > .app-sidebar .cint-nav-full,
.app-shell[data-cint-app-shell="1"][data-cint-sidebar="collapsed"] > .app-sidebar .cint-nav-label,
.app-shell[data-cint-app-shell="1"][data-cint-sidebar="collapsed"] > .app-sidebar .app-sidebar-brand-title,
.app-shell[data-cint-app-shell="1"][data-cint-sidebar="collapsed"] > .app-sidebar .app-sidebar-brand-kicker{display:none!important}
.app-shell[data-cint-app-shell="1"][data-cint-sidebar="collapsed"] > .app-sidebar .cint-nav-abbr{display:inline!important;font-weight:700}
.app-shell[data-cint-app-shell="1"] > .app-main{grid-column:1 / -1!important;min-width:0!important;min-height:0!important;height:100%!important;max-height:100%!important;background:#f4f7fb!important;color:#122033!important;padding:0!important;overflow-x:hidden!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch}
.app-shell[data-cint-app-shell="1"][data-cint-rail-on="1"] > .app-main{grid-column:2!important}
.app-shell[data-cint-app-shell="1"] .app-view-header,
.app-shell[data-cint-app-shell="1"] .app-view-panel > header.app-view-header{display:none!important}
.app-shell[data-cint-app-shell="1"] .app-view-panel{background:transparent!important;border:0!important;padding:0!important;box-shadow:none!important;min-height:0!important;height:auto!important;overflow:visible!important}
.app-shell[data-cint-app-shell="1"] > .app-sidebar .app-sidebar-brand{margin:0 0 .85rem;padding:.15rem .35rem .75rem;border-bottom:1px solid #24364d}
.app-shell[data-cint-app-shell="1"] > .app-sidebar .app-sidebar-brand-title{margin:0;font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;color:#7dd3c7;font-weight:700}
.app-shell[data-cint-app-shell="1"] > .app-sidebar .app-sidebar-brand-kicker{margin:.2rem 0 0;font-size:.72rem;color:#8aa0b8}
.app-shell[data-cint-app-shell="1"] > .app-sidebar .cint-nav-label{font-size:.62rem;letter-spacing:.08em;text-transform:uppercase;color:#6d8299;padding:.45rem .5rem .15rem}
.app-shell[data-cint-app-shell="1"] > .app-sidebar .app-sidebar-nav a{display:flex;align-items:center;justify-content:space-between;color:#c5d4e4;text-decoration:none;padding:.42rem .55rem;border-radius:.45rem;margin:.08rem 0}
.app-shell[data-cint-app-shell="1"] > .app-sidebar .app-sidebar-nav a:hover{background:#132033;color:#fff}
.app-shell[data-cint-app-shell="1"] > .app-sidebar .app-sidebar-nav a[aria-current="page"]{background:#123f3a;color:#ecfeff;box-shadow:inset 2px 0 0 #2dd4bf}
.app-shell[data-cint-app-shell="1"] > .app-sidebar .app-sidebar-footer{margin-top:auto;padding-top:.85rem;border-top:1px solid #1c2a3f}
.app-shell[data-cint-app-shell="1"] [data-cint-nav],
.app-shell[data-cint-app-shell="1"] [data-cint-shell] [data-cint-nav]{display:none!important}
.app-shell[data-cint-app-shell="1"]{overflow:hidden!important}
.app-shell[data-cint-app-shell="1"] [data-cint-shell]{display:block!important;grid-template-columns:1fr!important;min-height:0;background:transparent}
/* Zone-driven layout — runtime sets data-cint-zone / data-cint-authed (no nested :has view wars). */
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"]{grid-template-columns:1fr!important}
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"] > .app-sidebar{display:none!important}
[data-cint-sidebar-toggle],.cint-sidebar-toggle{background:#16263a;border:1px solid #2a415c;color:#e8eef8;border-radius:.4rem;padding:.28rem .5rem;cursor:pointer;margin:0 0 .7rem;width:fit-content}
[data-cint-sidebar-toggle]:hover,.cint-sidebar-toggle:hover{border-color:#2dd4bf;color:#ecfeff}
[data-cint-nav] .cint-brand{font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;color:#7dd3c7;padding:.15rem .45rem .75rem;font-weight:700}
[data-cint-nav] .cint-nav-group{display:flex;flex-direction:column;gap:.08rem;margin:0 0 .55rem;padding:0 0 .45rem;border-bottom:1px solid var(--cint-line)}
[data-cint-nav] .cint-nav-group:last-child{border-bottom:0;margin-bottom:0}
[data-cint-nav] .cint-nav-label{font-size:.62rem;letter-spacing:.08em;text-transform:uppercase;color:#6d8299;padding:.1rem .45rem}
[data-cint-nav] a{display:block;color:#c5d4e4;text-decoration:none;padding:.4rem .5rem;border-radius:.45rem}
[data-cint-nav] a:hover{background:#132033;color:#fff}
[data-cint-nav] a[aria-current="page"]{background:#123f3a;color:#ecfeff;font-weight:600;box-shadow:inset 2px 0 0 #2dd4bf}
[data-cint-workspace-main]{min-width:0;max-width:100%;width:100%;display:flex;flex-direction:column;flex:1 1 auto;flex-shrink:1;box-sizing:border-box;overflow-x:hidden}
[data-cint-chrome]{display:grid!important;gap:.55rem;padding:.85rem 1.15rem .75rem;border-bottom:1px solid var(--cint-line);background:#fff!important;position:sticky;top:0;z-index:20;flex-shrink:0;max-width:100%;min-width:0;box-sizing:border-box}
[data-cint-chrome] .cint-row{display:flex;flex-wrap:wrap;gap:.5rem .85rem;align-items:center;min-width:0;max-width:100%}
[data-cint-chrome] .cint-row > *{min-width:0;max-width:100%}
[data-cint-chrome] label{color:var(--cint-muted);font-size:11px;display:inline-flex;gap:.35rem;align-items:center;min-width:0}
[data-cint-chrome] select,[data-cint-chrome] input,[data-cint-shell] input,[data-cint-shell] select,[data-cint-shell] textarea{background:#fff;color:var(--cint-ink);border:1px solid var(--cint-line);padding:.38rem .55rem;border-radius:.4rem;max-width:100%;box-sizing:border-box}
[data-cint-chrome] input[data-cint-global-search]{min-width:0;flex:1 1 12rem;width:auto;max-width:100%}
[data-cint-page-body]{padding:1.15rem 1.25rem 2.75rem;box-sizing:border-box;min-width:0;max-width:100%;overflow-x:hidden;background:#fff;border-bottom:1px solid var(--cint-line)}
/* Footer bleed lock — Activity/Recommendations are Overview-only (never under Export/Remediation). */
.app-shell[data-cint-app-shell="1"] > .app-main > :not([data-view]):has([data-cint-activity]),
.app-shell[data-cint-app-shell="1"] > .app-main > :not([data-view]):has([data-cint-recs]),
.app-shell[data-cint-app-shell="1"] > .app-main > [data-view]:not([data-view="overview"]) section:has(> [data-cint-activity]),
.app-shell[data-cint-app-shell="1"] > .app-main > [data-view]:not([data-view="overview"]) section:has(> [data-cint-recs]),
.app-shell[data-cint-app-shell="1"] > .app-main > [data-view]:not([data-view="overview"]) [data-cint-activity],
.app-shell[data-cint-app-shell="1"] > .app-main > [data-view]:not([data-view="overview"]) [data-cint-recs],
.app-shell[data-cint-app-shell="1"] > .app-main > [data-view="overview"][hidden] section:has(> [data-cint-activity]),
.app-shell[data-cint-app-shell="1"] > .app-main > [data-view="overview"][hidden] section:has(> [data-cint-recs]),
.app-shell[data-cint-app-shell="1"] > .app-main > [data-view="overview"][hidden] [data-cint-activity],
.app-shell[data-cint-app-shell="1"] > .app-main > [data-view="overview"][hidden] [data-cint-recs],
.app-shell[data-cint-app-shell="1"] > [data-cint-activity],
.app-shell[data-cint-app-shell="1"] > section:has(> [data-cint-activity]),
body > [data-cint-activity],
body > section:has(> [data-cint-activity]),
.website-shell > [data-cint-activity],
.website-shell > section:has(> [data-cint-activity]){display:none!important;visibility:hidden!important;height:0!important;max-height:0!important;overflow:hidden!important;margin:0!important;padding:0!important;border:0!important;pointer-events:none!important}
.app-shell[data-cint-app-shell="1"] > .app-main > [data-view="overview"]:not([hidden]) section:has(> [data-cint-activity]),
.app-shell[data-cint-app-shell="1"] > .app-main > [data-view="overview"]:not([hidden]) section:has(> [data-cint-recs]),
.app-shell[data-cint-app-shell="1"] > .app-main > [data-view="overview"]:not([hidden]) [data-cint-activity],
.app-shell[data-cint-app-shell="1"] > .app-main > [data-view="overview"]:not([hidden]) [data-cint-recs]{display:block!important;visibility:visible!important;height:auto!important;max-height:none!important;overflow:visible!important;pointer-events:auto!important}
.app-shell[data-cint-app-shell="1"] > .app-main > .app-view-panel,
.app-shell[data-cint-app-shell="1"] > .app-main > [data-view]{max-width:100%!important;min-width:0!important;box-sizing:border-box!important;overflow-x:hidden!important}
[data-cint-page-body] > [data-cint-integration-host]:last-child{margin-bottom:0.5rem}
[data-cint-shell] .cint-trust{margin:0;padding:.35rem 0 0;border:0;color:var(--cint-muted);font-size:11px;max-width:72rem}
[data-cint-shell] .cint-chip{display:inline-flex;align-items:center;gap:.3rem;padding:.18rem .5rem;border:1px solid #d3dde8;border-radius:999px;font-size:11px;background:#eef4f8;color:#355066}
[data-cint-shell] .cint-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(10.5rem,1fr));gap:.7rem;margin:0 0 1.1rem}
[data-cint-shell] .cint-kpi{padding:.75rem .85rem;border:1px solid var(--cint-line);border-radius:.7rem;background:#fff;box-shadow:0 8px 20px rgba(15,27,45,.06)}
[data-cint-shell] .cint-kpi b{display:block;margin-top:.2rem;font-size:1.15rem;color:var(--cint-teal);font-weight:700}
[data-cint-shell] .cint-kpi span{color:var(--cint-muted);font-size:11px;letter-spacing:.04em;text-transform:uppercase}
[data-cint-shell] .cint-purpose{margin:0 0 1rem;color:var(--cint-muted);max-width:58rem;line-height:1.55}
.app-shell[data-cint-app-shell="1"] [data-cint-auth-status]{margin:.35rem 0 .65rem!important;min-height:1.25em;font-weight:600}
.app-shell[data-cint-app-shell="1"] [data-cint-auth-status]:not(:empty){display:block!important;visibility:visible!important;color:#0f766e!important}
.app-shell[data-cint-app-shell="1"] [data-cint-auth-status][data-cint-auth-tone="error"]{color:#b45309!important}
.app-shell[data-cint-app-shell="1"] [data-cint-auth-submit]:disabled,.app-shell[data-cint-app-shell="1"] form[data-cint-form] button[type="submit"]:disabled{opacity:.55!important;cursor:wait!important}
[data-cint-shell] h2{margin:.05rem 0 .4rem;font-size:1.35rem;font-weight:680;letter-spacing:-.02em;color:#0f1b2d}
[data-cint-shell] h3{margin:1.1rem 0 .5rem;font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:#5b6b7c}
[data-cint-shell] .app-toolbar{display:flex;flex-wrap:wrap;gap:.45rem;align-items:center;margin:0 0 .75rem}
[data-cint-shell] table{width:100%;max-width:100%;table-layout:fixed;border-collapse:separate;border-spacing:0;background:var(--cint-panel);border:1px solid var(--cint-line);border-radius:.7rem;overflow:hidden;box-sizing:border-box}
[data-cint-shell] th,[data-cint-shell] td{border-bottom:1px solid var(--cint-line);padding:.55rem .7rem;text-align:left;vertical-align:top;word-break:break-word;overflow-wrap:anywhere}
[data-cint-shell] tr:last-child td{border-bottom:0}
[data-cint-shell] th{color:#5b6b7c;font-weight:650;background:#f0f4f8;font-size:11px;letter-spacing:.04em;text-transform:uppercase}
[data-cint-shell] .app-btn{background:#0f766e;color:#ecfeff;border:0;padding:.42rem .8rem;border-radius:.45rem;cursor:pointer;font-weight:600}
[data-cint-shell] .app-btn:hover{background:#0d9488}
[data-cint-shell] .cint-split{display:grid;gap:.9rem;grid-template-columns:minmax(0,1.2fr) minmax(0,.8fr);max-width:100%;min-width:0}
[data-cint-shell] .cint-split > section,[data-cint-shell] pre,[data-cint-shell] [data-cint-graph],[data-cint-shell] [data-cint-thread],[data-cint-shell] [data-cint-audit],[data-cint-shell] [data-cint-activity],[data-cint-shell] [data-cint-recs]{background:var(--cint-panel);border:1px solid var(--cint-line);border-radius:.7rem;padding:.75rem}
[data-cint-shell] pre{overflow:auto;font-size:12px;color:#24364d}
[data-cint-shell] .cint-drawer,[data-cint-finding-drawer].cint-drawer,dialog[data-cint-finding-drawer]{position:fixed!important;right:0!important;top:0!important;left:auto!important;bottom:0!important;height:100vh!important;max-height:100vh!important;width:min(26rem,100vw)!important;max-width:100vw!important;min-width:16rem;background:#fff;color:#122033;border:0;border-left:1px solid var(--cint-line);padding:1.1rem;overflow:auto;z-index:9999!important;box-shadow:-16px 0 40px rgba(15,27,45,.18);box-sizing:border-box;margin:0}
[data-cint-finding-drawer].cint-drawer::backdrop,dialog[data-cint-finding-drawer]::backdrop{background:rgba(15,27,45,.35)}
/* Drawer must sit on shell/body — never under a [hidden] panel (0×0 dialog). */
.app-shell[data-cint-app-shell="1"] > [data-cint-finding-drawer],body > [data-cint-finding-drawer]{position:fixed!important;z-index:9999!important}
[data-cint-finding-rows] .app-btn[data-cint-open-finding]{display:inline-block;max-width:14rem;white-space:normal;overflow-wrap:anywhere;word-break:break-word;text-align:left;line-height:1.25;vertical-align:top}
[data-cint-shell] [hidden]{display:none !important}
[data-cint-shell] .cint-state{padding:.75rem;border:1px dashed #c5d2e0;border-radius:.55rem;color:var(--cint-muted);margin:.5rem 0;background:#f8fafc}
[data-cint-shell] form{display:grid;gap:.55rem;max-width:32rem}
[data-cint-shell] form label{display:grid;gap:.25rem;color:var(--cint-muted)}
[data-cint-notes],[data-cint-assistant-dock]{margin:.65rem 1.15rem 0;border:1px solid var(--cint-line);border-radius:.7rem;padding:.75rem;background:#fff}
@media (max-width: 900px){
[data-cint-shell] .cint-split{grid-template-columns:1fr}
[data-cint-chrome] input[data-cint-global-search]{min-width:0;width:100%}
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"]{grid-template-columns:1fr!important}
[data-cint-nav],.app-shell[data-cint-app-shell="1"] > .app-sidebar{flex-direction:column!important;flex-wrap:nowrap!important}
[data-cint-nav] .cint-nav-group,.app-shell[data-cint-app-shell="1"] .cint-nav-group{flex-direction:column!important;flex-wrap:nowrap!important;border-bottom:1px solid var(--cint-line)}
}
.app-shell[data-cint-app-shell="1"] .app-view-panel[hidden],
.app-shell[data-cint-app-shell="1"] [data-view][hidden],
.app-view-panel[hidden],[data-view][hidden],[hidden]{display:none!important}
.cint-nav-abbr{display:none!important}
[data-cint-sidebar="collapsed"] .cint-nav-abbr,
[data-cint-sidebar="collapsed"] .cint-nav-abbr[hidden],
.app-shell[data-cint-app-shell="1"][data-cint-sidebar="collapsed"] .cint-nav-abbr,
.app-shell[data-cint-app-shell="1"][data-cint-sidebar="collapsed"] .cint-nav-abbr[hidden]{display:inline!important}
body:has([data-cint-shell]),body:has([data-cint-app-shell]),html:has([data-cint-shell]),html:has([data-cint-app-shell]){background:#e8eef5!important;color:#122033!important}
.app-shell[data-cint-app-shell] .app-view-header,.app-view-panel:has([data-cint-shell]) > .app-view-header{display:none!important}
.app-shell[data-cint-app-shell] > .app-footer,body:has([data-cint-shell]) .app-footer-nav{display:none!important}
.app-shell[data-cint-app-shell="1"]:not([data-cint-authed="1"])[data-cint-zone="gateway"] .app-view-panel:not([data-view="landing"]):not([data-view="login"]):not([data-view="signup"]):not([data-view="forgot-password"]){display:none!important}
.app-shell[data-cint-app-shell="1"]:not([data-cint-authed="1"])[data-cint-zone="gateway"] [data-cint-workspace-main],
.app-shell[data-cint-app-shell="1"]:not([data-cint-authed="1"])[data-cint-zone="gateway"] [data-cint-chrome]{display:none!important}
.app-shell[data-cint-app-shell="1"] .app-view-panel[data-view="dashboard"],
.app-shell[data-cint-app-shell="1"] .app-view-panel[data-view="home"],
.app-shell[data-cint-app-shell="1"] .app-view-panel[data-view="command-centre"]{display:none!important}
.app-shell[data-cint-app-shell="1"] > .app-sidebar,.app-shell[data-cint-app-shell="1"] .app-sidebar-nav,[data-cint-nav]{flex-direction:column!important;flex-wrap:nowrap!important}
.cint-sidebar-toggle{display:inline-flex!important;align-items:center;justify-content:center;width:2.25rem;height:2.25rem;padding:0;margin:0 0 .75rem;border-radius:.45rem}
.app-shell[data-cint-app-shell="1"][data-cint-sidebar="collapsed"] .cint-sidebar-toggle{margin:0 auto .55rem}
/* cint-one-route-scroll-lock — absolute shell fills iframe; ONLY .app-main scrolls (avoid dvh — breaks srcDoc). */
html:has([data-cint-app-shell]),body:has([data-cint-app-shell]){height:100%!important;max-height:100%!important;overflow:hidden!important;margin:0!important;position:relative!important}
.app-shell[data-cint-app-shell="1"]{position:absolute!important;inset:0!important;height:auto!important;max-height:none!important;width:auto!important;overflow:hidden!important;box-sizing:border-box!important}
.app-shell[data-cint-app-shell="1"] > .app-main{min-height:0!important;height:100%!important;max-height:100%!important;overflow-x:hidden!important;overflow-y:scroll!important;scrollbar-gutter:stable;scrollbar-width:thin;scrollbar-color:#94a3b8 #e8eef5;-webkit-overflow-scrolling:touch}
.app-shell[data-cint-app-shell="1"] > .app-main::-webkit-scrollbar{width:10px}
.app-shell[data-cint-app-shell="1"] > .app-main::-webkit-scrollbar-thumb{background:#94a3b8;border-radius:5px}
.app-shell[data-cint-app-shell="1"][data-cint-zone="workspace"] [data-cint-chrome],
.app-shell[data-cint-app-shell="1"][data-cint-authed="1"] [data-cint-chrome]{display:grid!important;visibility:visible!important;opacity:1!important;position:sticky!important;top:0!important;z-index:25!important;background:#fff!important;box-shadow:0 1px 0 #d3dde8}
.app-shell[data-cint-app-shell="1"] > .app-main > [data-view][hidden],
.app-shell[data-cint-app-shell="1"] > .app-main > [data-route][hidden],
.app-shell[data-cint-app-shell="1"] > .app-main > .app-view-panel[hidden]{display:none!important;visibility:hidden!important;height:0!important;overflow:hidden!important;margin:0!important;padding:0!important;border:0!important}
.app-shell[data-cint-app-shell="1"][data-cint-zone="workspace"] > .app-main > [data-view="landing"],
.app-shell[data-cint-app-shell="1"][data-cint-zone="workspace"] > .app-main > [data-view="home"],
.app-shell[data-cint-app-shell="1"][data-cint-zone="workspace"] > .app-main > [data-view="login"],
.app-shell[data-cint-app-shell="1"][data-cint-zone="workspace"] > .app-main > [data-view="signup"],
.app-shell[data-cint-app-shell="1"][data-cint-zone="workspace"] > .app-main > [data-view="forgot-password"]{display:none!important;visibility:hidden!important;height:0!important;overflow:hidden!important;margin:0!important;padding:0!important;border:0!important}
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"] [data-view="login"] [data-cint-page]:not([data-cint-page="login"]),
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"] [data-view="landing"] [data-cint-page]:not([data-cint-page="landing"]),
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"] [data-view="signup"] [data-cint-page]:not([data-cint-page="signup"]),
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"] [data-view="forgot-password"] [data-cint-page]:not([data-cint-page="forgot-password"]),
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"] [data-cint-activity],
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"] [data-cint-recs],
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"] [data-cint-finding-rows],
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"] .cint-kpis,
.app-shell[data-cint-app-shell="1"] [data-view="cint-bleed"],
.app-shell[data-cint-app-shell="1"] [data-cint-orphan]{display:none!important;visibility:hidden!important;height:0!important;overflow:hidden!important;margin:0!important;padding:0!important;border:0!important}
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"] > .app-main{display:flex!important;flex-direction:column!important;align-items:flex-start;justify-content:flex-start;grid-column:1 / -1!important;width:100%!important;min-height:0!important;height:100%!important;max-height:100%!important;overflow-x:hidden!important;overflow-y:scroll!important;scrollbar-gutter:stable;padding:2rem 1rem!important;-webkit-overflow-scrolling:touch}
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"] > .app-main:has([data-view="landing"]:not([hidden]) [data-cint-marketing="1"]){align-items:stretch!important;justify-content:flex-start!important;padding:0!important;overflow-y:scroll!important;scrollbar-gutter:stable}
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"] [data-view="login"]:not([hidden]),
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"] [data-view="signup"]:not([hidden]),
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"] [data-view="forgot-password"]:not([hidden]){display:block!important;visibility:visible!important;height:auto!important;max-height:none!important;overflow:visible!important;width:min(32rem,100%);margin:0 auto;flex:0 0 auto}
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"] [data-view="landing"]:not([hidden]):not(:has([data-cint-marketing="1"])){display:block!important;visibility:visible!important;height:auto!important;max-height:none!important;overflow:visible!important;width:min(32rem,100%);margin:0 auto;flex:0 0 auto}
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"] [data-view="landing"]:not([hidden]):has([data-cint-marketing="1"]){display:block!important;visibility:visible!important;height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;width:100%!important;max-width:none!important;margin:0!important;flex:1 1 auto;align-self:stretch}
/* v32 — never force a [hidden] landing visible at 32rem (legacy :not(:has(login)) rule). */
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"] > .app-main > [data-view="landing"][hidden],
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"] [data-view="landing"][hidden]{display:none!important;visibility:hidden!important;height:0!important;max-height:0!important;overflow:hidden!important;margin:0!important;padding:0!important;border:0!important;pointer-events:none!important;width:0!important;max-width:0!important}
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"] > .app-main > [data-view="login"][hidden],
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"] > .app-main > [data-view="signup"][hidden],
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"] > .app-main > [data-view="forgot-password"][hidden]{display:none!important;visibility:hidden!important;height:0!important;max-height:0!important;overflow:hidden!important;pointer-events:none!important}
.app-shell[data-cint-app-shell="1"] [data-cint-auth="1"]:not([data-cint-gateway-surface="marketing"]){max-width:32rem;margin:0 auto;padding:1.75rem;border:1px solid #d3dde8;border-radius:1rem;background:#fff;color:#122033;box-shadow:0 16px 40px rgba(15,27,45,.1)}
.app-shell[data-cint-app-shell="1"][data-cint-zone="workspace"] > .app-main > [data-view="overview"]:not([hidden]),
.app-shell[data-cint-app-shell="1"][data-cint-authed="1"] > .app-main > [data-view="overview"]:not([hidden]){display:block!important;visibility:visible!important;height:auto!important;min-height:100%!important;overflow:visible!important;width:100%!important;max-width:none!important;margin:0!important}
.app-shell[data-cint-app-shell="1"] .app-btn,[data-cint-shell] .app-btn{background:#0f766e;color:#fff;border:0;padding:.5rem .95rem;border-radius:.5rem;cursor:pointer;font-weight:600;text-decoration:none;display:inline-block}
.app-shell[data-cint-app-shell="1"] a:not(.app-btn){color:#0f766e}
.app-shell[data-cint-app-shell="1"] .website-header,.app-shell[data-cint-app-shell="1"] .website-nav,.app-shell[data-cint-app-shell="1"] .website-topbar{display:none!important}
` + CODE_INTELLIGENCE_MARKETING_LANDING_CSS + "\n" + codeIntelligenceIntegrationHostCss() + `
/* cint-rail-lock-v31 — rail-on must not widen main (Integration FOUC after ensureRail). */
.app-shell[data-cint-app-shell="1"]{grid-template-rows:minmax(0,1fr)!important}
.app-shell[data-cint-app-shell="1"] > [data-cint-topbar]{display:none!important}
.app-shell[data-cint-app-shell="1"][data-cint-rail-on="1"]{display:grid!important;grid-template-columns:var(--cint-sidebar-width) minmax(0,1fr)!important;grid-template-rows:auto minmax(0,1fr)!important;position:absolute!important;inset:0!important;width:100%!important;max-width:100%!important;height:auto!important;max-height:none!important;box-sizing:border-box!important;overflow:hidden!important;background:#e8eef5!important}
.app-shell[data-cint-app-shell="1"][data-cint-rail-on="1"][data-cint-sidebar="collapsed"]{grid-template-columns:var(--cint-sidebar-width-icon) minmax(0,1fr)!important}
/* Topband spans the entire product width; rail + main columns begin on the next row. */
.app-shell[data-cint-app-shell="1"][data-cint-rail-on="1"] > [data-cint-topbar]{display:flex!important;flex-direction:row!important;align-items:center!important;gap:.75rem!important;grid-column:1 / -1!important;grid-row:1!important;min-height:2.75rem!important;padding:.4rem .9rem!important;box-sizing:border-box!important;background:#0b1220!important;border-bottom:1px solid #2a415c!important;color:#e8eef8!important;z-index:50!important;position:sticky!important;top:0!important;min-width:0!important;width:100%!important}
.app-shell[data-cint-app-shell="1"][data-cint-rail-on="1"] > .app-sidebar,
.app-shell[data-cint-app-shell="1"][data-cint-rail-on="1"] > .app-sidebar[data-cint-rail]{display:flex!important;flex-direction:column!important;flex-wrap:nowrap!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;position:relative!important;background:#0f1b2d!important;color:#e8eef8!important;grid-column:1!important;grid-row:2!important;align-self:stretch!important;justify-self:stretch!important;height:auto!important;min-height:0!important;max-height:100%!important;width:var(--cint-sidebar-width)!important;min-width:var(--cint-sidebar-width)!important;max-width:var(--cint-sidebar-width)!important;box-sizing:border-box!important;overflow:hidden!important;z-index:40!important;isolation:isolate!important;border-right:1px solid #1c2a3f!important}
.app-shell[data-cint-app-shell="1"][data-cint-rail-on="1"][data-cint-sidebar="collapsed"] > .app-sidebar{width:var(--cint-sidebar-width-icon)!important;min-width:var(--cint-sidebar-width-icon)!important;max-width:var(--cint-sidebar-width-icon)!important}
.app-shell[data-cint-app-shell="1"][data-cint-rail-on="1"] > .app-sidebar .cint-sidebar-toggle,
.app-shell[data-cint-app-shell="1"][data-cint-rail-on="1"] > .app-sidebar [data-cint-sidebar-toggle]{display:none!important}
.app-shell[data-cint-app-shell="1"][data-cint-rail-on="1"] > .app-sidebar .app-sidebar-brand{display:flex!important;flex-direction:row!important;align-items:center!important;gap:.55rem!important;flex:0 0 auto!important;margin:0 0 .85rem!important;padding:.15rem .35rem .75rem!important;border-bottom:1px solid #24364d!important}
.app-shell[data-cint-app-shell="1"][data-cint-rail-on="1"][data-cint-sidebar="collapsed"] > .app-sidebar .app-sidebar-brand-text{display:none!important}
.app-shell[data-cint-app-shell="1"][data-cint-rail-on="1"] > .app-sidebar .app-sidebar-nav{flex:1 1 auto!important;min-height:0!important;overflow-x:hidden!important;overflow-y:scroll!important;scrollbar-gutter:stable;scrollbar-width:thin;scrollbar-color:#4a6280 #0f1b2d}
.app-shell[data-cint-app-shell="1"][data-cint-rail-on="1"] > [data-cint-topbar] .cint-topbar-left{display:flex!important;flex-direction:row!important;align-items:center!important;gap:.65rem!important;flex:0 1 auto!important;min-width:0!important}
.app-shell[data-cint-app-shell="1"][data-cint-rail-on="1"] > [data-cint-topbar] .cint-sidebar-toggle,
.app-shell[data-cint-app-shell="1"][data-cint-rail-on="1"] > [data-cint-topbar] [data-cint-sidebar-toggle]{display:inline-flex!important;flex:0 0 auto!important;visibility:visible!important;opacity:1!important;color:#e8eef8!important;background:transparent!important;border:1px solid transparent!important;min-width:2.25rem!important;min-height:2.25rem!important;width:2.25rem!important;height:2.25rem!important;margin:0!important;padding:0!important;border-radius:.45rem!important;align-items:center!important;justify-content:center!important;cursor:pointer!important}
.app-shell[data-cint-app-shell="1"][data-cint-rail-on="1"] > [data-cint-topbar] .cint-sidebar-toggle:hover{border-color:#2a415c!important;background:#16263a!important}
.app-shell[data-cint-app-shell="1"] [data-cint-topbar] .cint-topbar-brand{display:flex!important;flex-direction:row!important;flex-wrap:wrap!important;align-items:baseline!important;gap:.45rem!important;min-width:0!important;line-height:1.2!important}
.app-shell[data-cint-app-shell="1"] [data-cint-topbar] .cint-topbar-title{font-size:.875rem!important;font-weight:600!important;color:#F8FAFC!important;letter-spacing:.01em!important;white-space:nowrap!important}
.app-shell[data-cint-app-shell="1"] [data-cint-topbar] .cint-topbar-kicker{font-size:.65rem!important;letter-spacing:.12em!important;text-transform:uppercase!important;color:#94A3B8!important;white-space:nowrap!important}
.app-shell[data-cint-app-shell="1"] [data-cint-topbar] .cint-topbar-sep{flex:0 0 auto!important;align-self:stretch!important;width:1px!important;min-height:1.5rem!important;margin:.15rem 0!important;background:#2a415c!important}
.app-shell[data-cint-app-shell="1"] [data-cint-topbar] .cint-topbar-right{display:flex!important;flex-direction:row!important;flex-wrap:wrap!important;align-items:center!important;justify-content:flex-end!important;gap:.45rem .65rem!important;flex:1 1 auto!important;min-width:0!important;margin-left:auto!important}
.app-shell[data-cint-app-shell="1"] [data-cint-topbar] .cint-topbar-chip{display:inline-flex!important;align-items:center!important;padding:.15rem .5rem!important;border:1px solid #2a415c!important;border-radius:999px!important;font-size:.65rem!important;color:#94A3B8!important;background:#16263a!important}
.app-shell[data-cint-app-shell="1"] [data-cint-topbar] .cint-topbar-workspace{font-size:.8rem!important;font-weight:600!important;color:#E2E8F0!important}
.app-shell[data-cint-app-shell="1"] [data-cint-topbar] .cint-topbar-btn{background:#0f766e!important;color:#ecfeff!important;border:0!important;padding:.35rem .7rem!important;border-radius:.4rem!important;font-size:.75rem!important;font-weight:600!important;cursor:pointer!important}
.app-shell[data-cint-app-shell="1"][data-cint-rail-on="1"] > .app-main,
.app-shell[data-cint-app-shell="1"][data-cint-rail-on="1"] > main{display:block!important;grid-column:2!important;grid-row:2!important;justify-self:stretch!important;align-self:stretch!important;width:auto!important;max-width:100%!important;min-width:0!important;min-height:0!important;height:100%!important;max-height:100%!important;padding:0!important;margin:0!important;justify-content:stretch!important;align-items:stretch!important;overflow-x:hidden!important;overflow-y:scroll!important;overscroll-behavior:contain;scrollbar-gutter:stable;scrollbar-width:thin;scrollbar-color:#94a3b8 #e8eef5;background:#f4f7fb!important;z-index:1!important;position:relative!important;box-sizing:border-box!important;-webkit-overflow-scrolling:touch}
.app-shell[data-cint-app-shell="1"][data-cint-rail-on="1"] [data-cint-workspace-main],
.app-shell[data-cint-app-shell="1"][data-cint-rail-on="1"] [data-cint-shell],
.app-shell[data-cint-app-shell="1"][data-cint-rail-on="1"] [data-cint-page-body],
.app-shell[data-cint-app-shell="1"][data-cint-rail-on="1"] [data-cint-integration-host]{max-width:100%!important;min-width:0!important;width:100%!important;box-sizing:border-box!important;overflow-x:hidden!important}
/* Narrow Live/Publish iframes — icon rail so Integration is not crushed beside 15.5rem navy. */
@media (max-width:42rem){
.app-shell[data-cint-app-shell="1"][data-cint-rail-on="1"]{grid-template-columns:var(--cint-sidebar-width-icon) minmax(0,1fr)!important}
.app-shell[data-cint-app-shell="1"][data-cint-rail-on="1"] > .app-sidebar,
.app-shell[data-cint-app-shell="1"][data-cint-rail-on="1"] > .app-sidebar[data-cint-rail]{width:var(--cint-sidebar-width-icon)!important;min-width:var(--cint-sidebar-width-icon)!important;max-width:var(--cint-sidebar-width-icon)!important}
.app-shell[data-cint-app-shell="1"][data-cint-rail-on="1"] .app-sidebar-brand-text,
.app-shell[data-cint-app-shell="1"][data-cint-rail-on="1"] .cint-nav-full,
.app-shell[data-cint-app-shell="1"][data-cint-rail-on="1"] .cint-nav-label{display:none!important}
.app-shell[data-cint-app-shell="1"][data-cint-rail-on="1"] .cint-nav-abbr,
.app-shell[data-cint-app-shell="1"][data-cint-rail-on="1"] .cint-nav-abbr[hidden]{display:inline!important}
}
.app-shell[data-cint-app-shell="1"][data-cint-rail-on="1"] > .app-main::-webkit-scrollbar,
.app-shell[data-cint-app-shell="1"][data-cint-rail-on="1"] > main::-webkit-scrollbar{width:10px}
.app-shell[data-cint-app-shell="1"][data-cint-rail-on="1"] > .app-main::-webkit-scrollbar-thumb,
.app-shell[data-cint-app-shell="1"][data-cint-rail-on="1"] > main::-webkit-scrollbar-thumb{background:#94a3b8;border-radius:5px}
.app-shell[data-cint-app-shell="1"][data-cint-zone="workspace"] > .app-main > .app-view-panel:not([hidden]),
.app-shell[data-cint-app-shell="1"][data-cint-authed="1"] > .app-main > .app-view-panel:not([hidden]){display:block!important;visibility:visible!important;height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;pointer-events:auto!important}
.app-shell[data-cint-app-shell="1"]:not([data-cint-rail-on="1"]){display:grid!important;grid-template-columns:1fr!important;grid-template-rows:minmax(0,1fr)!important}
.app-shell[data-cint-app-shell="1"]:not([data-cint-rail-on="1"]) > .app-main,
.app-shell[data-cint-app-shell="1"]:not([data-cint-rail-on="1"]) > main{grid-column:1 / -1!important;grid-row:1 / -1!important;width:100%!important;max-width:100%!important}
.app-shell[data-cint-app-shell="1"]:not([data-cint-rail-on="1"]) > .app-sidebar,
.app-shell[data-cint-app-shell="1"]:not([data-cint-rail-on="1"]) > .app-sidebar[data-cint-rail],
.app-shell[data-cint-app-shell="1"]:not([data-cint-rail-on="1"]) > [data-cint-topbar]{display:none!important;visibility:hidden!important;pointer-events:none!important;width:0!important;min-width:0!important;max-width:0!important;height:0!important;max-height:0!important;padding:0!important;margin:0!important;border:0!important;overflow:hidden!important}
.app-shell[data-cint-app-shell="1"][data-cint-zone="workspace"] [data-cint-chrome],
.app-shell[data-cint-app-shell="1"][data-cint-authed="1"] [data-cint-chrome]{display:grid!important;position:sticky!important;top:0!important;z-index:25!important;background:#fff!important}
[data-cint-shell]{display:block!important;grid-template-columns:1fr!important;max-width:100%!important;min-width:0!important;overflow-x:hidden!important;box-sizing:border-box!important}
/* Gateway marketing — hide rail/topband only while truly unauthenticated (authed/workspace must win). */
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"]:not([data-cint-authed="1"]){background:#0B1020!important;grid-template-columns:1fr!important;grid-template-rows:minmax(0,1fr)!important}
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"]:not([data-cint-authed="1"]) > .app-main,
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"]:not([data-cint-authed="1"]) > main{grid-column:1 / -1!important;grid-row:1 / -1!important;background:#0B1020!important;color:#E5E7EB!important;scrollbar-color:#475569 #0B1020!important;padding:0!important}
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"]:not([data-cint-authed="1"]) > .app-main::-webkit-scrollbar-thumb{background:#475569!important}
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"]:not([data-cint-authed="1"]) > .app-sidebar,
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"]:not([data-cint-authed="1"]) > .app-sidebar[data-cint-rail],
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"]:not([data-cint-authed="1"])[data-cint-rail-on="1"] > .app-sidebar,
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"]:not([data-cint-authed="1"])[data-cint-rail-on="1"] > .app-sidebar[data-cint-rail],
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"]:not([data-cint-authed="1"]) > [data-cint-topbar],
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"]:not([data-cint-authed="1"])[data-cint-rail-on="1"] > [data-cint-topbar]{display:none!important;visibility:hidden!important;pointer-events:none!important;width:0!important;min-width:0!important;max-width:0!important;height:0!important;max-height:0!important;overflow:hidden!important;margin:0!important;padding:0!important;border:0!important}
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"]:not([data-cint-authed="1"]) > .app-main > [data-view]:not([data-view="landing"]):not([data-view="login"]):not([data-view="signup"]):not([data-view="forgot-password"]),
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"]:not([data-cint-authed="1"]) > .app-main > [data-view="overview"],
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"]:not([data-cint-authed="1"]) > .app-main > [data-view="overview"]:not([hidden]),
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"]:not([data-cint-authed="1"]) [data-cint-activity],
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"]:not([data-cint-authed="1"]) [data-cint-recs],
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"]:not([data-cint-authed="1"]) [data-cint-integration-host]{display:none!important;visibility:hidden!important;height:0!important;max-height:0!important;overflow:hidden!important;margin:0!important;padding:0!important;border:0!important;pointer-events:none!important}
/* Orphans only — CI app sits under .website-shell; do not hide in-shell IHS (IHS-1.9). */
body > [data-cint-integration-host],.website-shell > [data-cint-integration-host],.website-shell > :not([data-cint-app-shell]) [data-cint-integration-host],.app-shell[data-cint-app-shell="1"] > [data-cint-integration-host]{display:none!important;visibility:hidden!important;height:0!important;max-height:0!important;overflow:hidden!important;margin:0!important;padding:0!important;border:0!important;pointer-events:none!important}
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"]:not([data-cint-authed="1"]) > .app-main > [data-view="landing"]:not([hidden]):has([data-cint-marketing="1"]){display:flex!important;flex-direction:column!important;min-height:0!important;height:auto!important;width:100%!important;max-width:none!important;margin:0!important;padding:0!important;background:#0B1020!important;flex:1 1 auto;align-self:stretch}
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"]:not([data-cint-authed="1"]) [data-cint-marketing="1"].cint-mkt{display:flex!important;flex-direction:column!important;flex:1 1 auto!important;min-height:0!important;width:100%!important;box-sizing:border-box!important;background:#0B1020!important;padding:0!important;margin:0!important}
.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"]:not([data-cint-authed="1"]) [data-cint-marketing="1"] .cint-mkt-footer{margin-top:2rem!important;flex:0 0 auto!important;flex-shrink:0!important;background:#0B1020!important;position:relative!important;z-index:2!important}
html:has(.app-shell[data-cint-zone="gateway"]),
body:has(.app-shell[data-cint-zone="gateway"]){background:#0B1020!important}
html:has(.app-shell[data-cint-zone="workspace"]),
body:has(.app-shell[data-cint-zone="workspace"]),
html:has(.app-shell[data-cint-authed="1"]),
body:has(.app-shell[data-cint-authed="1"]){background:#e8eef5!important}
`;

export const CINT_PAINT_CSS_MARK = "/* cint-workspace-paint-v33 */";

export function isCodeIntelligencePaintTarget(html: string | null | undefined): boolean {
  return /\bdata-cint-shell\b|\bdata-cint-app-shell\b|\bdata-cint-page\b|\bdata-product-surface=["']code_intelligence["']|\bengineering intelligence demo\b/i.test(
    html ?? "",
  );
}

/** Generic website invent ("Our Company" / View pricing) — not CI marketing Landing. */
export function isHollowBrochureLandingHtml(html: string | null | undefined): boolean {
  const text = html ?? "";
  if (!text.trim()) return false;
  if (/\bdata-cint-marketing=["']1["']/i.test(text)) return false;
  return /Our Company|A clear overview of what we offer|View pricing|Clear messaging — hero|Structured pages — Pricing|website-landing-features/i.test(
    text,
  );
}

export function appendCodeIntelligencePaintCss(css: string, html?: string | null): string {
  if (!isCodeIntelligencePaintTarget(html)) return css;
  // Host product-layout :has(> .app-sidebar) 2-col must never ride along — that is the grey void
  // when the CI rail is display:none / not rail-on (DOM node still matches :has).
  let next = css
    .replace(/\/\*\s*REPLICA_PREVIEW_PRODUCT_LAYOUT\s*\*\/[\s\S]*?(?=(\/\*\s*[A-Z0-9_-]+\s*\*\/)|$)/gi, "")
    .replace(/\/\*\s*cint-workspace-paint-v\d+\s*\*\/[\s\S]*$/i, "")
    // Legacy gateway rule forced [data-view=landing] to 32rem even while [hidden].
    .replace(
      /\.app-shell\[data-cint-app-shell="1"\]\[data-cint-zone="gateway"\]:not\(:has\(\[data-view="login"\]:not\(\[hidden\]\)\)\)[\s\S]*?\[data-view="landing"\]:not\(\[hidden\]\)\s*\{[^}]*\}/gi,
      "",
    )
    .trim();
  return `${next}\n${CINT_PAINT_CSS_MARK}\n${CODE_INTELLIGENCE_WORKSPACE_CSS}`.trim();
}

/**
 * Replace hollow brochure Landing with CI marketing door (HVM — same page key).
 * Also used when CREATE painted website presets onto a sealed CI contract.
 */
function marketingLandingNeedsSignInReseal(html: string): boolean {
  if (!/\bdata-cint-marketing=["']1["']/i.test(html)) return false;
  // Request Demo alone is not enough — Live preview must show an explicit Sign In control.
  if (/\bdata-cint-mkt-signin=["']1["']/i.test(html)) return false;
  if (/\bdata-cint-mkt-nav-actions\b/i.test(html) && />\s*Sign In\s*</i.test(html)) return false;
  return true;
}

function replaceHollowCodeIntelligenceLanding(html: string): string {
  const hollow = isHollowBrochureLandingHtml(html);
  // Incomplete marketing (no Sign In cluster) must reseal from the brief owner.
  if (!hollow && /\bdata-cint-marketing=["']1["']/i.test(html) && !marketingLandingNeedsSignInReseal(html)) {
    return html;
  }
  if (!hollow && !htmlHasCodeIntelligenceViewPanel(html, "landing") && !marketingLandingNeedsSignInReseal(html)) {
    return html;
  }
  const door = seedCodeIntelligenceViewDoor("landing", "Landing");
  let replaced = false;
  let searchFrom = 0;
  let next = html;
  while (searchFrom < next.length) {
    const match = matchBalancedCintPanel(next, searchFrom);
    if (!match) break;
    if (match.key === "landing") {
      next = `${next.slice(0, match.start)}${door}${next.slice(match.end)}`;
      replaced = true;
      break;
    }
    searchFrom = match.end;
  }
  if (replaced) return next;
  // Bare "Our Company" invent often has no data-view=landing and no website-hero class —
  // injecting a door beside leftover brochure text leaves Welcome/Our Company still visible.
  if (hollow && /<main\b/i.test(next)) {
    return next.replace(/<main\b[^>]*>[\s\S]*?<\/main>/i, (block) => {
      const open = block.match(/^<main\b[^>]*>/i)?.[0] ?? "<main>";
      return `${open}${door}</main>`;
    });
  }
  // No balanced landing panel — strip brochure hero block and inject CI door into main.
  next = next
    .replace(
      /<(?:section|div|article)\b[^>]*(?:website-landing-hero|website-hero|app-landing)[^>]*>[\s\S]*?<\/(?:section|div|article)>/gi,
      "",
    )
    .replace(/<(?:section|div)\b[^>]*website-landing-features[^>]*>[\s\S]*?<\/(?:section|div)>/gi, "");
  if (/<main\b/i.test(next)) {
    return next.replace(/<main\b[^>]*>/i, (open) => `${open}${door}`);
  }
  return `${door}${next}`;
}

/** Stamp CI shell with Replica project id so srcdoc auth/API resolve (mirror FOC). */
export function stampCodeIntelligenceProjectId(
  html: string,
  replicaProjectId?: string | null,
): string {
  const id = typeof replicaProjectId === "string" ? replicaProjectId.trim() : "";
  if (!id || id === "local" || id === "oauth") return html;
  if (!/\bdata-cint-app-shell\b|\bdata-product-surface=["']code_intelligence["']/i.test(html)) {
    return html;
  }
  const safe = id.replace(/"/g, "");
  let next = html;
  // Prefer attributes on the app shell.
  if (/\bdata-cint-app-shell\b/i.test(next)) {
    next = next.replace(/(<div\b[^>]*\bdata-cint-app-shell\b[^>]*)>/i, (open) => {
      let tag = open;
      if (!/\bdata-cint-project-id=/i.test(tag)) {
        tag = tag.replace(/>$/, ` data-cint-project-id="${safe}">`);
      } else {
        tag = tag.replace(/\bdata-cint-project-id=["'][^"']*["']/i, `data-cint-project-id="${safe}"`);
      }
      if (!/\bdata-replica-project-id=/i.test(tag)) {
        tag = tag.replace(/>$/, ` data-replica-project-id="${safe}">`);
      } else {
        tag = tag.replace(
          /\bdata-replica-project-id=["'][^"']*["']/i,
          `data-replica-project-id="${safe}"`,
        );
      }
      return tag.endsWith(">") ? tag : `${tag}>`;
    });
  }
  // Also stamp <html> when present (deploy document).
  if (/<html\b/i.test(next)) {
    next = next.replace(/<html\b([^>]*)>/i, (full, attrs: string) => {
      let a = attrs || "";
      if (!/\bdata-cint-project-id=/i.test(a)) a += ` data-cint-project-id="${safe}"`;
      else a = a.replace(/\bdata-cint-project-id=["'][^"']*["']/i, `data-cint-project-id="${safe}"`);
      if (!/\bdata-replica-project-id=/i.test(a)) a += ` data-replica-project-id="${safe}"`;
      else
        a = a.replace(
          /\bdata-replica-project-id=["'][^"']*["']/i,
          `data-replica-project-id="${safe}"`,
        );
      return `<html${a}>`;
    });
  }
  return next;
}

/** HVM paint heal: stacked Login/Overview, wrapping inner nav, leftover Dashboard/Footer. */
export function healCodeIntelligencePreviewHtml(
  html: string,
  options?: { forceCi?: boolean; contractPages?: readonly string[]; replicaProjectId?: string | null },
): string {
  const forceCi = Boolean(options?.forceCi) || isHollowBrochureLandingHtml(html);
  if (!isCodeIntelligencePaintTarget(html) && !forceCi) return html;
  // Strip brochure/store/app footers only — keep sealed Landing `cint-mkt-footer`.
  let next = html.replace(
    /<footer\b(?![^>]*(?:data-cint-mkt-footer|cint-mkt-footer))[^>]*>[\s\S]*?<\/footer>/gi,
    "",
  );
  next = next.replace(/<header\b[^>]*class="[^"]*\bapp-view-header\b[^"]*"[^>]*>[\s\S]*?<\/header>/gi, "");
  next = next.replace(/<header\b[^>]*\bwebsite-header\b[^>]*>[\s\S]*?<\/header>/gi, "");
  next = next.replace(/<(?:div|header|nav)\b[^>]*\bwebsite-(?:topbar|nav)\b[^>]*>[\s\S]*?<\/(?:div|header|nav)>/gi, "");
  next = next.replace(
    /<a\b[^>]*(?:\bhref\s*=\s*["']#(?:contact|privacy|terms|about|faq)["']|\bdata-view-nav\s*=\s*["'](?:contact|privacy|terms|about|faq)["'])[^>]*>[\s\S]*?<\/a>/gi,
    "",
  );
  next = next.replace(
    /<(section|div|article)\b([^>]*\bdata-(?:view|route)\s*=\s*["'](?:contact|privacy|terms|about|faq)["'][^>]*)>[\s\S]*?<\/\1>/gi,
    "",
  );
  next = next.replace(/<nav\b[^>]*\bdata-cint-nav\b[^>]*>[\s\S]*?<\/nav>/gi, "");
  // Overview owns Dashboard / Command Centre; Landing owns Home — drop alias panels so Continu is not blank.
  next = next.replace(
    /<(section|div|article)\b([^>]*\bdata-(?:view|route)\s*=\s*["'](?:dashboard|command-centre|home)["'][^>]*)>[\s\S]*?<\/\1>/gi,
    "",
  );
  next = next.replace(
    /<a\b[^>]*(?:\bhref\s*=\s*["']#(?:dashboard|command-centre)["']|\bdata-view-nav\s*=\s*["'](?:dashboard|command-centre)["'])[^>]*>[\s\S]*?<\/a>/gi,
    "",
  );
  next = ensureCodeIntelligenceIntegrationHostSurfaces(next).html;
  next = next.replace(
    /(<a\b[^>]*\b(?:href\s*=\s*["']#home["']|data-view-nav\s*=\s*["']home["'])[^>]*)>/gi,
    (full) =>
      full
        .replace(/#home\b/i, "#landing")
        .replace(/data-view-nav=["']home["']/i, 'data-view-nav="landing"'),
  );
  // Always refresh gateway login/signup bodies so publish snapshots drop stale "demo" copy.
  next = forceRefreshCodeIntelligenceGatewayAuthPanels(next);
  // Phase 5 — stamp trust on gateway auth surfaces that predate gatewayTrust().
  if (
    /\bdata-cint-auth=["']1["']/i.test(next) &&
    !/\bdata-cint-trust=["']gateway["']/i.test(next)
  ) {
    next = next.replace(
      /(<div\b[^>]*\bdata-cint-auth=["']1["'][^>]*>[\s\S]*?<p class="cint-purpose">[\s\S]*?<\/p>)/i,
      `$1${gatewayTrust()}`,
    );
  }

  const topbarHtml = buildCodeIntelligenceTopbarHtml();
  const railHtml = buildCodeIntelligenceRailHtml(options?.contractPages);
  next = next.replace(/<header\b[^>]*\bdata-cint-topbar\b[^>]*>[\s\S]*?<\/header>/gi, "");
  next = next.replace(
    /<aside\b[^>]*\bdata-cint-rail\b[^>]*>[\s\S]*?<\/aside>/i,
    railHtml,
  );
  next = next.replace(
    /<div class="app-sidebar-footer">[\s\S]*?<\/div>/i,
    "",
  );
  // Strip legacy rail-embedded toggles — toggle owns the top band only.
  next = next.replace(
    /<aside\b[^>]*\bdata-cint-rail\b[^>]*>[\s\S]*?<\/aside>/i,
    (block) => block.replace(/<button\b[^>]*\bdata-cint-sidebar-toggle\b[^>]*>[\s\S]*?<\/button>/gi, ""),
  );
  const shellLead = `${topbarHtml}${railHtml}`;
  if (!/\bdata-cint-app-shell\b/i.test(next)) {
    next = `<div class="app-shell" data-cint-app-shell="1" data-product-surface="code_intelligence" data-cint-sidebar="expanded" data-cint-zone="gateway">${shellLead}<main class="app-main app-main-operational">${next}</main></div>`;
  } else if (!/\bdata-cint-rail\b/i.test(next)) {
    next = next.replace(/(<div\b[^>]*\bdata-cint-app-shell\b[^>]*>)/i, `$1${shellLead}`);
  } else {
    // Topband then rail as first shell children — gateway CSS hides both until workspace.
    const railMatch = next.match(/<aside\b[^>]*\bdata-cint-rail\b[^>]*>[\s\S]*?<\/aside>/i);
    let without = next.replace(/<header\b[^>]*\bdata-cint-topbar\b[^>]*>[\s\S]*?<\/header>/gi, "");
    if (railMatch?.[0]) without = without.replace(railMatch[0], "");
    next = without.replace(/(<div\b[^>]*\bdata-cint-app-shell\b[^>]*>)/i, `$1${shellLead}`);
  }
  if (!/\bci-favicon\.svg\b/i.test(next)) {
    const fav = `<link rel="icon" type="image/svg+xml" href="/ci-favicon.svg" data-cint-favicon="1" />`;
    if (/<\/head>/i.test(next)) next = next.replace(/<\/head>/i, `${fav}</head>`);
    else if (/<head\b[^>]*>/i.test(next)) next = next.replace(/<head\b[^>]*>/i, (m) => `${m}${fav}`);
  }
  next = next.replace(
    /<div(\s[^>]*\bdata-cint-app-shell\b[^>]*)>/i,
    (_full, attrs: string) => {
      let nextAttrs = attrs;
      nextAttrs = /\bdata-cint-zone=/.test(nextAttrs)
        ? nextAttrs.replace(/\bdata-cint-zone=["'][^"']*["']/, 'data-cint-zone="gateway"')
        : `${nextAttrs} data-cint-zone="gateway"`;
      // Sellable default: expanded full labels. Runtime may collapse after syncing abbrs.
      nextAttrs = /\bdata-cint-sidebar=/.test(nextAttrs)
        ? nextAttrs.replace(/\bdata-cint-sidebar=["'][^"']*["']/, 'data-cint-sidebar="expanded"')
        : `${nextAttrs} data-cint-sidebar="expanded"`;
      return `<div${nextAttrs}>`;
    },
  );
  next = next.replace(/<span(\s[^>]*\bcint-nav-abbr\b[^>]*)>/gi, (full, attrs: string) =>
    /\bhidden\b/i.test(attrs) ? full : `<span${attrs} hidden>`,
  );
  next = flattenCodeIntelligenceStackedRoutes(next);
  next = replaceHollowCodeIntelligenceLanding(next);
  next = dedupeCodeIntelligenceLandingPanels(next);
  next = ensureCodeIntelligenceGatewayPanels(next);
  // Repair must never leave marketing Landing without an explicit Sign In control.
  if (marketingLandingNeedsSignInReseal(next)) {
    next = replaceHollowCodeIntelligenceLanding(next);
  }
  if (
    /\bdata-cint-marketing=["']1["']/i.test(next) &&
    !/\bdata-cint-mkt-signin=["']1["']/i.test(next) &&
    !/>\s*Sign In\s*</i.test(next)
  ) {
    next = next.replace(
      /(<header\b[^>]*\bcint-mkt-nav\b[^>]*>)([\s\S]*?)(<\/header>)/i,
      `$1$2<div class="cint-mkt-nav-actions" data-cint-mkt-nav-actions><a href="#login" class="app-btn cint-mkt-cta" data-view-nav="login" data-cint-mkt-signin="1">Sign In</a></div>$3`,
    );
  }
  next = ensureCodeIntelligenceWorkspacePanels(next);
  // Materialize any already-sealed FPT CI pages (CREATE floor + expansion already in contract).
  next = ensureCodeIntelligenceContractPanels(next, options?.contractPages);
  // Present-but-hollow CREATE/gateway panels (stub Overview/Settings) — deepen bodies.
  next = deepenHollowCodeIntelligenceWorkspacePanels(next, options?.contractPages);
  // Last resort — incremental wipe can still leave brochure text; rebuild the sealed shell.
  if (isHollowBrochureLandingHtml(next)) {
    return stampCodeIntelligenceProjectId(
      hoistCodeIntelligenceFindingDrawer(
        rebuildCodeIntelligencePreviewShell(options?.contractPages),
      ),
      options?.replicaProjectId,
    );
  }
  // Flatten / prior paint can leave workspace routes as <body> siblings — showView
  // only queries inside the shell, so those links silently fall back to Overview.
  next = reseatCodeIntelligenceStrayPanels(next);
  next = hoistCodeIntelligenceGatewayPanels(next);
  // One shell-level drawer — per-page chrome drawers under [hidden] panels open at 0×0.
  next = hoistCodeIntelligenceFindingDrawer(next);
  // Quarantine Activity/Recs that escaped Overview into main/body (footer bleed on every route).
  next = quarantineOrphanCodeIntelligenceActivitySections(next);
  const panelTagPattern = "<(section|div|article)\\b([^>]*\\bdata-view=[\"']([^\"']+)[\"'][^>]*)>";
  const views = [...next.matchAll(new RegExp(panelTagPattern, "gi"))].map((match) =>
    (match[3] ?? "").toLowerCase(),
  );
  const visible =
    views.includes("landing")
      ? "landing"
      : views.includes("login")
        ? "login"
        : views.includes("overview")
          ? "overview"
          : views[0] ?? "";
  if (visible) {
    next = next.replace(
      new RegExp(panelTagPattern, "gi"),
      (full, tag: string, attrs: string, view: string) => {
        const isActive = (view ?? "").toLowerCase() === visible;
        if (isActive) {
          return `<${tag}${attrs.replace(/\s+hidden(?:=(?:"[^"]*"|'[^']*'|[^\s>]*))?/gi, "")}>`;
        }
        if (/\bhidden\b/i.test(attrs)) return full;
        return `<${tag}${attrs} hidden>`;
      },
    );
  }
  // After gateway/workspace seed — empty action + preview <base> would navigate the iframe to host.
  // Also force onsubmit=return false — action="#" alone still reboots srcdoc to Landing on submit.
  next = next.replace(/<form\b([^>]*\bdata-cint-form\b[^>]*)>/gi, (full, attrs: string) => {
    let nextAttrs = attrs;
    if (!/\baction\s*=/i.test(nextAttrs)) nextAttrs += ' action="#"';
    if (!/\bmethod\s*=/i.test(nextAttrs)) nextAttrs += ' method="post"';
    if (!/\bonsubmit\s*=/i.test(nextAttrs)) nextAttrs += ' onsubmit="return false;"';
    return `<form${nextAttrs}>`;
  });
  // Stale Overview Analyze form (pre-1.54) — reseal body so Run analysis cannot navigate away.
  if (
    /\bdata-cint-form=["']analysis-run["']/i.test(next) &&
    !/\bdata-cint-analysis-run=/i.test(next)
  ) {
    const overviewBuilt = stripCodeIntelligenceProductCss(PANELS.overview?.() ?? "");
    if (overviewBuilt) {
      const overviewRe =
        /<(section|div|article)\b([^>]*\bdata-view=["']overview["'][^>]*)>([\s\S]*?)<\/\1>/i;
      if (overviewRe.test(next)) {
        next = next.replace(overviewRe, `<$1$2>${overviewBuilt}</$1>`);
      }
    }
  }
  // Stale Repositories GitHub form — reseal so Connect/List/Sync/self-publish cannot reboot the iframe.
  if (
    /\bdata-cint-form=["']github-connect["']/i.test(next) &&
    (!/\bdata-cint-github-action=/i.test(next) ||
      !/\bdata-cint-github-action=["']publish-product["']/i.test(next) ||
      !/\bdata-cint-github-action=["']load-self["']/i.test(next))
  ) {
    const reposBuilt = stripCodeIntelligenceProductCss(PANELS.repositories?.() ?? "");
    if (reposBuilt) {
      const reposRe =
        /<(section|div|article)\b([^>]*\bdata-view=["']repositories["'][^>]*)>([\s\S]*?)<\/\1>/i;
      if (reposRe.test(next)) {
        next = next.replace(reposRe, `<$1$2>${reposBuilt}</$1>`);
      }
    }
  }
  // Incremental heal must never leave Our Company visible when forceCi was requested.
  if (forceCi && isHollowBrochureLandingHtml(next)) {
    return stampCodeIntelligenceProjectId(
      rebuildCodeIntelligencePreviewShell(options?.contractPages),
      options?.replicaProjectId,
    );
  }
  // Canonical sibling separators so hoist/flatten blank-line drift does not reseal forever.
  return stampCodeIntelligenceProjectId(
    stabilizeCodeIntelligenceMainSeparators(next),
    options?.replicaProjectId,
  );
}

export function codeIntelligenceProductStyleTag(): string {
  return `<style data-cint-product-css>${CODE_INTELLIGENCE_WORKSPACE_CSS}</style>`;
}

/** CREATE/FREEZE rail + panel seed only. Optional pages join via Repair expansion. */
export const CODE_INTELLIGENCE_NAV_GROUPS: readonly {
  group: string;
  items: readonly { id: string; label: string }[];
}[] = [
  {
    group: "Workspace",
    items: [
      { id: "overview", label: "Overview" },
      { id: "repositories", label: "Repositories" },
      { id: "findings", label: "Findings" },
      { id: "settings", label: "Settings" },
    ],
  },
];

/** Repair-expansion nav catalog — materialize only after Unlock/Advanced promote. */
export const CODE_INTELLIGENCE_REPAIR_NAV_GROUPS: readonly {
  group: string;
  items: readonly { id: string; label: string }[];
}[] = [
  {
    group: "Analysis",
    items: [
      { id: "security", label: "Security" },
      { id: "dependencies", label: "Dependencies" },
      { id: "quality", label: "Quality" },
    ],
  },
  {
    group: "Knowledge",
    items: [
      { id: "architecture", label: "Architecture" },
      { id: "documentation", label: "Documentation" },
      { id: "assistant", label: "Assistant" },
    ],
  },
  {
    group: "Action",
    items: [
      { id: "remediation", label: "Remediation" },
      { id: "history", label: "History" },
    ],
  },
  {
    group: "Organisation",
    items: [
      { id: "admin", label: "Admin" },
      { id: "contacts", label: "Contacts" },
      { id: "support", label: "Support" },
    ],
  },
];

function navAbbr(id: string): string {
  return id.replace(/[^a-z]/gi, "").slice(0, 2).toUpperCase() || "CI";
}

const CINT_SIDEBAR_TOGGLE_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/></svg>`;

/**
 * Workspace top band — mirrors Replica host header geometry:
 * main-column only (not over the rail), left = toggle + title,
 * vertical separator, right = header tools.
 */
export function buildCodeIntelligenceTopbarHtml(): string {
  return `<header class="cint-topbar" data-cint-topbar="1">
  <div class="cint-topbar-left" data-cint-topbar-left>
    <button type="button" class="cint-sidebar-toggle" data-cint-sidebar-toggle aria-expanded="true" aria-label="Toggle sidebar" title="Toggle sidebar">${CINT_SIDEBAR_TOGGLE_ICON}</button>
    <div class="cint-topbar-brand">
      <strong class="cint-topbar-title">Code Intelligence</strong>
      <span class="cint-topbar-kicker">WORKSPACE</span>
    </div>
  </div>
  <span class="cint-topbar-sep" data-cint-topbar-sep aria-hidden="true"></span>
  <div class="cint-topbar-right" data-cint-topbar-right>
    <span class="cint-topbar-chip" data-cint-trust="mode">Demo workspace</span>
    <strong class="cint-topbar-workspace" data-cint-workspace>eng-platform</strong>
    <button type="button" class="app-btn cint-topbar-btn" data-cint-open-notes>Notifications</button>
    <button type="button" class="app-btn cint-topbar-btn" data-cint-open-assistant>Ask Assistant</button>
  </div>
</header>`;
}

/**
 * Navy workspace rail. CREATE floor groups always; optional Repair groups only when
 * already present on the sealed FPT contract (19-page Overview builds).
 * Toggle lives on data-cint-topbar — not in the rail.
 */
export function buildCodeIntelligenceRailHtml(
  contractPages?: readonly string[],
): string {
  const contractKeys = new Set(
    (contractPages ?? [])
      .map((label) => normalizePageKey(label))
      .filter((key): key is string => Boolean(key)),
  );
  const groups = [
    ...CODE_INTELLIGENCE_NAV_GROUPS,
    ...CODE_INTELLIGENCE_REPAIR_NAV_GROUPS.map((group) => ({
      group: group.group,
      items: group.items.filter((item) => contractKeys.has(item.id)),
    })).filter((group) => group.items.length > 0),
  ];
  const links = groups
    .map(
      (group) =>
        `<div class="cint-nav-group"><div class="cint-nav-label">${group.group}</div>${group.items
          .map((item) => {
            const abbr = navAbbr(item.id);
            return `<a href="#${item.id}" class="app-sidebar-link" data-view-nav="${item.id}" data-cint-route="${item.id}"><span class="cint-nav-full">${item.label}</span><span class="cint-nav-abbr" hidden>${abbr}</span></a>`;
          })
          .join("")}</div>`,
    )
    .join("");
  return `<aside class="app-sidebar" data-cint-rail="1" data-layout-role="sidebar" aria-label="Code Intelligence">
  <div class="app-sidebar-brand">
    ${CINT_BRAND_MARK_SVG}
    <div class="app-sidebar-brand-text">
      <p class="app-sidebar-brand-title">Code Intelligence</p>
      <p class="app-sidebar-brand-kicker">Workspace</p>
    </div>
  </div>
  <nav class="app-sidebar-nav" aria-label="Workspace">${links}</nav>
</aside>`;
}

const CINT_GATEWAY_VIEWS = new Set(["landing", "home", "login", "signup", "forgot-password", "forgot_password"]);

function matchBalancedCintPanel(
  html: string,
  fromIndex: number,
): { start: number; end: number; tag: string; attrs: string; key: string; body: string } | null {
  const openRe = /<(section|div|article)\b([^>]*\b(?:data-view|data-cint-page)\s*=\s*["']([^"']+)["'][^>]*)>/gi;
  openRe.lastIndex = fromIndex;
  const open = openRe.exec(html);
  if (!open || open.index == null) return null;
  const tag = open[1];
  const attrs = open[2];
  const key = String(open[3] || "").trim().toLowerCase();
  const start = open.index;
  const bodyStart = open.index + open[0].length;
  const openTagRe = new RegExp(`<${tag}\\b`, "gi");
  const closeTagRe = new RegExp(`</${tag}\\s*>`, "gi");
  let depth = 1;
  let cursor = bodyStart;
  while (depth > 0 && cursor < html.length) {
    openTagRe.lastIndex = cursor;
    closeTagRe.lastIndex = cursor;
    const nextOpen = openTagRe.exec(html);
    const nextClose = closeTagRe.exec(html);
    if (!nextClose) return null;
    if (nextOpen && nextOpen.index < nextClose.index) {
      depth += 1;
      cursor = nextOpen.index + nextOpen[0].length;
      continue;
    }
    depth -= 1;
    if (depth === 0) {
      return {
        start,
        end: nextClose.index + nextClose[0].length,
        tag,
        attrs,
        key,
        body: html.slice(bodyStart, nextClose.index),
      };
    }
    cursor = nextClose.index + nextClose[0].length;
  }
  return null;
}

function findSwallowedRouteIndex(body: string, parentKey: string): number {
  const re = /<(section|div|article)\b[^>]*\b(?:data-view|data-cint-page)\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(body))) {
    const key = String(match[2] || "").trim().toLowerCase();
    if (key && key !== parentKey && key !== "cint-bleed") return match.index;
  }
  if (CINT_GATEWAY_VIEWS.has(parentKey)) {
    const chromeIdx = body.search(/<(?:div|header|section)\b[^>]*\bdata-cint-(?:chrome|workspace-main)\b/i);
    if (chromeIdx > 0) return chromeIdx;
    const leftover = body.search(/<(?:h1|h2|h3)\b[^>]*>\s*(?:Activity|Overview|Dashboard|Recommendations|Recent findings)/i);
    if (leftover > 80) return leftover;
  }
  return -1;
}

function hideBleedChunk(chunk: string): string {
  const trimmed = chunk.trim();
  if (!trimmed) return "";
  // Already quarantined — do not nest orphans (keeps paint heal idempotent).
  if (/^<div\b[^>]*\bdata-cint-orphan\b/i.test(trimmed)) return trimmed;
  return `<div data-cint-orphan="1" hidden aria-hidden="true">${trimmed}</div>`;
}

/** Collapse whitespace between main block tags so repeated heals converge. */
function stabilizeCodeIntelligenceMainSeparators(html: string): string {
  const openMatch = html.match(/<main\b[^>]*>/i);
  if (!openMatch || openMatch.index == null) return html;
  const innerStart = openMatch.index + openMatch[0].length;
  const closeAt = html.lastIndexOf("</main>");
  if (closeAt <= innerStart) return html;
  // Include zero-width gaps (`><`) so ensure* inject and flatten join converge.
  const inner = html.slice(innerStart, closeAt).replace(/>\s*</g, ">\n<");
  return `${html.slice(0, innerStart)}${inner}${html.slice(closeAt)}`;
}

function extractCintRoutePanels(source: string): string[] {
  const panels: string[] = [];
  let cursor = 0;
  while (cursor < source.length) {
    const match = matchBalancedCintPanel(source, cursor);
    if (!match) {
      const tail = hideBleedChunk(source.slice(cursor));
      if (tail) panels.push(tail);
      break;
    }
    const gap = hideBleedChunk(source.slice(cursor, match.start));
    if (gap) panels.push(gap);
    // Gateway and workspace parents (Overview swallowing Findings, etc.).
    const nestedAt = findSwallowedRouteIndex(match.body, match.key);
    if (nestedAt >= 0) {
      const own = match.body.slice(0, nestedAt);
      const swallowed = match.body.slice(nestedAt);
      panels.push(`<${match.tag}${match.attrs}>${own}</${match.tag}>`);
      panels.push(...extractCintRoutePanels(swallowed));
    } else {
      const slice = source.slice(match.start, match.end);
      const needsView = !/\bdata-view\s*=/i.test(match.attrs) && match.key !== "cint-bleed";
      panels.push(
        needsView
          ? `<section class="app-view-panel" data-view="${match.key}" hidden>${slice}</section>`
          : slice,
      );
    }
    cursor = match.end;
  }
  return panels;
}

const CINT_GATEWAY_FLOORS: readonly { id: string; label: string }[] = [
  { id: "landing", label: "Landing" },
  { id: "login", label: "Login" },
  { id: "signup", label: "Signup" },
  { id: "forgot-password", label: "Forgot Password" },
];

/** True when a real panel element exists — CSS rules also contain data-view="login" text. */
function htmlHasCodeIntelligenceViewPanel(html: string, viewId: string): boolean {
  const id = viewId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `<(?:section|div|article)\\b[^>]*\\bdata-view=["']${id}["']`,
    "i",
  ).test(html);
}

/** Scope panel detection to <main> — stray body-level panels must not skip reseeding. */
function mainInnerHtml(html: string): string | null {
  const open = html.match(/<main\b[^>]*>/i);
  if (!open || open.index == null) return null;
  const start = open.index + open[0].length;
  const closeAt = html.lastIndexOf("</main>");
  if (closeAt <= start) return null;
  return html.slice(start, closeAt);
}

function htmlHasCodeIntelligenceViewPanelInMain(html: string, viewId: string): boolean {
  const inner = mainInnerHtml(html);
  if (inner == null) return htmlHasCodeIntelligenceViewPanel(html, viewId);
  return htmlHasCodeIntelligenceViewPanel(inner, viewId);
}

/** Seeded doors must not re-embed product CSS (selectors look like panels to string tests). */
function stripCodeIntelligenceProductCss(html: string): string {
  return html.replace(/<style\b[^>]*\bdata-cint-product-css\b[^>]*>[\s\S]*?<\/style>/gi, "");
}

function seedCodeIntelligenceViewDoor(viewId: string, label: string): string {
  const body = stripCodeIntelligenceProductCss(buildCodeIntelligencePanel(label) ?? "");
  return `<section class="app-view-panel" data-view="${viewId}" id="${viewId}" hidden>${body}</section>`;
}

const CINT_RESEAT_VIEW_IDS = new Set<string>([
  ...CINT_GATEWAY_FLOORS.map((floor) => floor.id),
  ...CODE_INTELLIGENCE_NAV_GROUPS.flatMap((group) => group.items.map((item) => item.id)),
  "home",
  "dashboard",
]);

/**
 * Move route panels that sit outside &lt;main&gt; (often direct &lt;body&gt; children) back
 * into main so shell querySelector + one-route CSS apply.
 */
function reseatCodeIntelligenceStrayPanels(html: string): string {
  const openMatch = html.match(/<main\b[^>]*>/i);
  if (!openMatch || openMatch.index == null) return html;
  const mainStart = openMatch.index;
  const innerStart = mainStart + openMatch[0].length;
  const mainClose = html.lastIndexOf("</main>");
  if (mainClose <= innerStart) return html;

  const removeRanges: { start: number; end: number }[] = [];
  const toSeat: string[] = [];
  let searchFrom = 0;
  while (searchFrom < html.length) {
    const match = matchBalancedCintPanel(html, searchFrom);
    if (!match) break;
    const outside = match.start < mainStart || match.start >= mainClose;
    if (outside && CINT_RESEAT_VIEW_IDS.has(match.key)) {
      const alreadyInMain = htmlHasCodeIntelligenceViewPanel(
        html.slice(innerStart, mainClose),
        match.key,
      );
      if (!alreadyInMain) {
        toSeat.push(html.slice(match.start, match.end));
      }
      removeRanges.push({ start: match.start, end: match.end });
    }
    searchFrom = match.end;
  }
  if (removeRanges.length === 0) return html;

  let next = html;
  for (let i = removeRanges.length - 1; i >= 0; i -= 1) {
    const range = removeRanges[i]!;
    next = `${next.slice(0, range.start)}${next.slice(range.end)}`;
  }
  if (toSeat.length === 0) return next;
  const closeAt = next.lastIndexOf("</main>");
  if (closeAt < 0) return next;
  return `${next.slice(0, closeAt)}\n${toSeat.join("\n")}\n${next.slice(closeAt)}`;
}

function ensureCodeIntelligenceGatewayPanels(html: string): string {
  let next = html;
  for (const floor of CINT_GATEWAY_FLOORS) {
    // Do not treat CSS selectors (e.g. [data-view="login"]) as an existing panel.
    // Only count panels already seated inside <main> (body-strays are re-homed separately).
    if (htmlHasCodeIntelligenceViewPanelInMain(next, floor.id)) continue;
    const door = seedCodeIntelligenceViewDoor(floor.id, floor.label);
    next = /<main\b/i.test(next)
      ? next.replace(/<main\b[^>]*>/i, (open) => `${open}${door}`)
      : `${door}${next}`;
  }
  return next;
}

/**
 * Seed CREATE-floor workspace panels only. Repair-expansion routes are added by
 * Advanced Repair materialize — heal must not invent them back into HTML.
 */
function ensureCodeIntelligenceWorkspacePanels(html: string): string {
  let next = html;
  const floors = CODE_INTELLIGENCE_NAV_GROUPS.flatMap((group) => group.items);
  const doors: string[] = [];
  for (const floor of floors) {
    if (htmlHasCodeIntelligenceViewPanelInMain(next, floor.id)) continue;
    const body = stripCodeIntelligenceProductCss(buildCodeIntelligencePanel(floor.label) ?? "");
    if (!body) continue;
    doors.push(
      `<section class="app-view-panel" data-view="${floor.id}" id="${floor.id}" hidden>${body}</section>`,
    );
  }
  if (doors.length === 0) return next;
  const inject = doors.join("\n");
  return /<main\b/i.test(next)
    ? next.replace(/<\/main>/i, `${inject}</main>`)
    : `${next}${inject}`;
}

const CI_CONTRACT_SEED_KEYS = new Set(
  [
    ...CODE_INTELLIGENCE_ALL_ALLOWED_PAGE_LABELS.map((label) => normalizePageKey(label)),
    ...CINT_GATEWAY_FLOORS.map((floor) => floor.id),
    ...CODE_INTELLIGENCE_NAV_GROUPS.flatMap((group) => group.items.map((item) => item.id)),
  ].filter(Boolean),
);

/**
 * Seed panels for pages already sealed in FPT (HVM materialize — not CREATE invent).
 * Skips Dashboard alias (Overview owns that route) and unknown foreign keys.
 */
function ensureCodeIntelligenceContractPanels(
  html: string,
  contractPages?: readonly string[],
): string {
  if (!contractPages?.length) return html;
  let next = html;
  const doors: string[] = [];
  const seen = new Set<string>();
  for (const page of contractPages) {
    const key = normalizePageKey(page);
    if (!key || seen.has(key) || !CI_CONTRACT_SEED_KEYS.has(key)) continue;
    // Dashboard/home are aliases — Overview/Landing panels own the route.
    if (key === "dashboard" || key === "command-centre" || key === "home") continue;
    seen.add(key);
    if (htmlHasCodeIntelligenceViewPanelInMain(next, key)) continue;
    const label =
      CINT_GATEWAY_FLOORS.find((floor) => floor.id === key)?.label ??
      CODE_INTELLIGENCE_NAV_GROUPS.flatMap((group) => group.items).find((item) => item.id === key)
        ?.label ??
      page;
    const body = stripCodeIntelligenceProductCss(buildCodeIntelligencePanel(label) ?? "");
    if (!body) continue;
    doors.push(
      `<section class="app-view-panel" data-view="${key}" id="${key}" hidden>${body}</section>`,
    );
  }
  if (doors.length === 0) return next;
  const inject = doors.join("\n");
  return /<main\b/i.test(next)
    ? next.replace(/<\/main>/i, `${inject}</main>`)
    : `${next}${inject}`;
}

/**
 * Collapse duplicate Landing panels (ghosted hero / overlapping nav). Keep the first
 * marketing door; quarantine later copies as cint-bleed (not a PAGE).
 */
function dedupeCodeIntelligenceLandingPanels(html: string): string {
  let next = html;
  let found = 0;
  let searchFrom = 0;
  const removals: Array<{ start: number; end: number }> = [];
  while (searchFrom < next.length) {
    const match = matchBalancedCintPanel(next, searchFrom);
    if (!match) break;
    searchFrom = match.end;
    if (match.key !== "landing") continue;
    found += 1;
    if (found > 1) removals.push({ start: match.start, end: match.end });
  }
  if (removals.length === 0) return next;
  for (let i = removals.length - 1; i >= 0; i -= 1) {
    const row = removals[i]!;
    const chunk = next.slice(row.start, row.end);
    // Strip landing identity so ghost hero / nav checks no longer see a second door.
    const neutralized = chunk
      .replace(/\bdata-view\s*=\s*["']landing["']/gi, 'data-view="cint-bleed"')
      .replace(/\bid\s*=\s*["']landing(?:-dup)?["']/gi, 'id="cint-bleed-landing"');
    next = `${next.slice(0, row.start)}${hideBleedChunk(neutralized)}${next.slice(row.end)}`;
  }
  return next;
}

/** Required product markers — IHS chrome alone must not count as a full floor body. */
const CI_FLOOR_PRODUCT_MARKERS: Readonly<Record<string, RegExp>> = {
  overview: /\bdata-cint-(?:workspace-main|repo-select)\b/i,
  repositories: /\bdata-cint-repo-rows\b/i,
  findings: /\bdata-cint-finding-rows\b/i,
  settings: /\bdata-cint-audit\b|\bdata-cint-form=["']prefs["']/i,
  login: /\bdata-cint-form=["']login["']|\bdata-cint-auth-action=["']login["']/i,
  signup: /\bdata-cint-form=["']signup["']|\bdata-cint-auth-action=["']signup["']/i,
  "forgot-password": /\bdata-cint-form=["']forgot/i,
};

/** True when a CI route panel body is structurally stub/hollow (Structure coverage `stub`). */
export function isHollowCodeIntelligencePanelBody(
  body: string,
  routeKey?: string,
): boolean {
  if (!body.trim()) return true;
  const key = (routeKey ?? "").toLowerCase();
  const marker = key ? CI_FLOOR_PRODUCT_MARKERS[key] : undefined;
  if (marker && !marker.test(body)) return true;
  // Local hollow check — do not import pageContractParityPolicy (cycles via pageContentPresets).
  const text = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (text.length < 40) return true;
  return estimatePanelDepth(body).componentCount < 2;
}

/**
 * Replace present-but-hollow CREATE/gateway/contract panels with full CI bodies.
 * HVM heal only — does not invent pages outside the known CI seed keys.
 */
function deepenHollowCodeIntelligenceWorkspacePanels(
  html: string,
  contractPages?: readonly string[],
): string {
  const labelByKey = new Map<string, string>();
  for (const floor of CINT_GATEWAY_FLOORS) {
    labelByKey.set(floor.id, floor.label);
  }
  for (const item of CODE_INTELLIGENCE_NAV_GROUPS.flatMap((group) => group.items)) {
    labelByKey.set(item.id, item.label);
  }
  if (contractPages?.length) {
    for (const page of contractPages) {
      const key = normalizePageKey(page);
      if (!key || !CI_CONTRACT_SEED_KEYS.has(key)) continue;
      if (key === "dashboard" || key === "command-centre" || key === "home") continue;
      if (labelByKey.has(key)) continue;
      labelByKey.set(
        key,
        CINT_GATEWAY_FLOORS.find((floor) => floor.id === key)?.label ??
          CODE_INTELLIGENCE_NAV_GROUPS.flatMap((group) => group.items).find((item) => item.id === key)
            ?.label ??
          page,
      );
    }
  }

  let next = html;
  let searchFrom = 0;
  const replacements: Array<{ start: number; end: number; nextHtml: string }> = [];
  while (searchFrom < next.length) {
    const match = matchBalancedCintPanel(next, searchFrom);
    if (!match) break;
    searchFrom = match.end;
    const label = labelByKey.get(match.key);
    if (!label) continue;
    if (!isHollowCodeIntelligencePanelBody(match.body, match.key)) continue;
    // Marketing landing that already has door chrome — leave for replaceHollow path.
    if (match.key === "landing" && /\bdata-cint-marketing=["']1["']/i.test(match.body)) {
      continue;
    }
    const body = stripCodeIntelligenceProductCss(buildCodeIntelligencePanel(label) ?? "");
    if (!body) continue;
    const rebuiltOpen = `<${match.tag}${match.attrs.startsWith(" ") ? match.attrs : ` ${match.attrs}`}>`;
    replacements.push({
      start: match.start,
      end: match.end,
      nextHtml: `${rebuiltOpen}${body}</${match.tag}>`,
    });
  }
  if (replacements.length === 0) return next;
  // Apply from end so indices stay valid.
  for (let i = replacements.length - 1; i >= 0; i -= 1) {
    const row = replacements[i]!;
    next = `${next.slice(0, row.start)}${row.nextHtml}${next.slice(row.end)}`;
  }
  return next;
}

const CINT_FINDING_DRAWER_HTML =
  `<dialog data-cint-finding-drawer class="cint-drawer" hidden><button type="button" class="app-btn" data-cint-close-drawer>Close</button><div data-cint-finding-detail></div></dialog>`;

/** Seat a single finding drawer on the app shell — never inside a [hidden] view panel. */
export function hoistCodeIntelligenceFindingDrawer(html: string): string {
  if (!/\bdata-cint-finding-drawer\b/i.test(html) && !/\bdata-cint-app-shell\b/i.test(html)) {
    return html;
  }
  let next = html.replace(
    /<dialog\b[^>]*\bdata-cint-finding-drawer\b[^>]*>[\s\S]*?<\/dialog>/gi,
    "",
  );
  // Also strip non-dialog drawer shells if a prior heal used <aside>/<div>.
  next = next.replace(
    /<(aside|div)\b[^>]*\bdata-cint-finding-drawer\b[^>]*>[\s\S]*?<\/\1>/gi,
    "",
  );
  if (/<\/main>/i.test(next)) {
    return next.replace(/<\/main>/i, `</main>\n${CINT_FINDING_DRAWER_HTML}`);
  }
  if (/\bdata-cint-app-shell\b/i.test(next)) {
    return next.replace(
      /(<div\b[^>]*\bdata-cint-app-shell\b[^>]*>)/i,
      `$1${CINT_FINDING_DRAWER_HTML}`,
    );
  }
  return `${next}${CINT_FINDING_DRAWER_HTML}`;
}

/**
 * Activity / Recommendations belong on Overview only. Loose chunks between
 * data-view panels (or non-overview pages) paint as a footer bleed on every route.
 */
export function quarantineOrphanCodeIntelligenceActivitySections(html: string): string {
  if (!/\bdata-cint-activity\b|\bdata-cint-recs\b/i.test(html)) return html;
  const openMatch = html.match(/<main\b[^>]*>/i);
  if (!openMatch || openMatch.index == null) return html;
  const innerStart = openMatch.index + openMatch[0].length;
  const closeAt = html.lastIndexOf("</main>");
  if (closeAt <= innerStart) return html;
  const inner = html.slice(innerStart, closeAt);
  const pieces: string[] = [];
  let cursor = 0;
  const hideLooseActivity = (chunk: string): string => {
    if (!/\bdata-cint-activity\b|\bdata-cint-recs\b/i.test(chunk)) return chunk;
    return chunk.replace(
      /<(section|div)\b([^>]*)>([\s\S]*?\bdata-cint-(?:activity|recs)\b[\s\S]*?)<\/\1>/gi,
      (full) => hideBleedChunk(full),
    );
  };
  while (cursor < inner.length) {
    const match = matchBalancedCintPanel(inner, cursor);
    if (!match) {
      pieces.push(hideLooseActivity(inner.slice(cursor)));
      break;
    }
    if (match.start > cursor) {
      pieces.push(hideLooseActivity(inner.slice(cursor, match.start)));
    }
    const isOverview =
      match.key === "overview" ||
      match.key === "dashboard" ||
      match.key === "command-centre";
    if (isOverview || CINT_GATEWAY_VIEWS.has(match.key) || match.key === "cint-bleed") {
      pieces.push(inner.slice(match.start, match.end));
    } else {
      // Non-overview workspace routes must not carry Overview Activity/Recs.
      const cleanedBody = hideLooseActivity(match.body);
      pieces.push(`<${match.tag}${match.attrs}>${cleanedBody}</${match.tag}>`);
    }
    cursor = match.end;
  }
  return `${html.slice(0, innerStart)}${pieces.join("")}${html.slice(closeAt)}`;
}

function hoistCodeIntelligenceGatewayPanels(html: string): string {
  const openMatch = html.match(/<main\b[^>]*>/i);
  if (!openMatch || openMatch.index == null) return html;
  const innerStart = openMatch.index + openMatch[0].length;
  const closeAt = html.lastIndexOf("</main>");
  if (closeAt <= innerStart) return html;
  let inner = html.slice(innerStart, closeAt);
  const hoisted: string[] = [];
  for (const floor of CINT_GATEWAY_FLOORS) {
    let found: ReturnType<typeof matchBalancedCintPanel> = null;
    let searchFrom = 0;
    while (searchFrom < inner.length) {
      const next = matchBalancedCintPanel(inner, searchFrom);
      if (!next) break;
      if (next.key === floor.id) {
        found = next;
        break;
      }
      searchFrom = next.end;
    }
    if (!found) continue;
    hoisted.push(inner.slice(found.start, found.end));
    inner = `${inner.slice(0, found.start)}${inner.slice(found.end)}`;
  }
  if (hoisted.length === 0) return html;
  // Trim leftover separators so repeated hoist does not grow blank lines (heal idempotency).
  const rebuilt = `${hoisted.join("\n")}\n${inner.replace(/^\s+/, "")}`;
  return `${html.slice(0, openMatch.index)}${openMatch[0]}${rebuilt}</main>${html.slice(closeAt + 7)}`;
}

/** IEPC same-class heal: unclosed Login must not own Overview/Activity as one scroll. */
function flattenCodeIntelligenceStackedRoutes(html: string): string {
  const openMatch = html.match(/<main\b[^>]*>/i);
  if (!openMatch || openMatch.index == null) return html;
  const innerStart = openMatch.index + openMatch[0].length;
  const closeAt = html.lastIndexOf("</main>");
  if (closeAt <= innerStart) return html;
  let inner = html.slice(innerStart, closeAt);
  for (let i = 0; i < 4; i += 1) {
    const wrap = inner.match(/^\s*<(div|section)\b([^>]*)>([\s\S]*)<\/\1>\s*$/i);
    if (!wrap) break;
    if (/\bdata-(?:view|route|cint-page)\s*=/i.test(wrap[2] ?? "")) break;
    if (!/\bdata-(?:view|route|cint-page)\s*=/i.test(wrap[3] ?? "")) break;
    inner = wrap[3] ?? inner;
  }
  const rebuilt = extractCintRoutePanels(inner).join("\n");
  if (rebuilt === inner) {
    return `${html.slice(0, openMatch.index)}${openMatch[0]}${inner}</main>${html.slice(closeAt + 7)}`;
  }
  return `${html.slice(0, openMatch.index)}${openMatch[0]}${rebuilt}</main>${html.slice(closeAt + 7)}`;
}

function chrome(): string {
  return `<div data-cint-workspace-main>
  <header data-cint-chrome>
    <div class="cint-row">
      <span class="cint-chip" data-cint-trust="mode">Demo workspace</span>
      <strong data-cint-workspace>eng-platform</strong>
      <label>Repository
        <select data-cint-repo-select>
          <option value="payments-api">payments-api</option>
          <option value="catalog-service">catalog-service</option>
        </select>
      </label>
      <span class="cint-chip">Branch <strong data-cint-branch>main</strong></span>
      <span class="cint-chip">Commit <code data-cint-commit>c0ffee1</code></span>
    </div>
    <div class="cint-row">
      <span data-cint-analysis-status>Latest run: A-1 COMPLETED · current · demo clock</span>
      <span class="cint-chip" data-cint-freshness>Freshness: seeded demo</span>
      <span class="cint-chip" data-cint-source>Evidence: illustrative snapshot</span>
      <input data-cint-global-search placeholder="Search findings, files, deps" />
      <button type="button" class="app-btn" data-cint-open-notes>Notifications</button>
      <span data-cint-profile>Alex Chen · Architect</span>
      <button type="button" class="app-btn" data-cint-open-assistant>Ask Assistant</button>
    </div>
    <p class="cint-trust" data-cint-demo="1">Illustrative demo data. Changing repository updates lists and links in this workspace. No live GitHub, CVE feed, pull request, or model investigation.</p>
  </header>
  <aside data-cint-notes class="cint-state" hidden><h3>Notifications</h3><div data-cint-notes-list></div></aside>
  <aside data-cint-assistant-dock class="cint-state" hidden>
    <h3>Contextual assistant</h3>
    <p data-cint-assistant-context>Bound to the active repository and commit. Live Claude when CINT_ANTHROPIC_API_KEY is set.</p>
    <form data-cint-form="assistant"><input name="q" placeholder="Ask about this repo" required />
    <button class="app-btn" type="submit">Ask</button></form>
    <div data-cint-thread></div>
  </aside>
</div>`;
}

function states(page: string): string {
  return `<div class="cint-state" data-cint-state="loading" hidden>Loading ${page}…</div>
    <div class="cint-state" data-cint-state="empty" hidden>No records for this repository and commit.</div>
    <div class="cint-state" data-cint-state="error" hidden>This view failed to load. Incomplete analysis is not shown as a clean result.</div>
    <div class="cint-state" data-cint-state="denied" hidden>You do not have permission for this surface.</div>
    <div class="cint-state" data-cint-state="stale" hidden>Analysis is stale relative to the selected commit.</div>
    <div class="cint-state" data-cint-state="partial" hidden>Partial results — latest run did not finish every analyzer.</div>
    <div class="cint-state" data-cint-state="failed-run" hidden>Latest analysis failed. Counts below are withheld.</div>`;
}

function gatewayTrust(): string {
  return `<p class="cint-trust" data-cint-trust="gateway">Code Intelligence product sign-in (IdP). Demo session only if CINT Auth env is unset.</p>`;
}

/** Replace stored login/signup/forgot panels with current templates (kills stale "demo" copy). */
function forceRefreshCodeIntelligenceGatewayAuthPanels(html: string): string {
  if (!/\bdata-cint-form=["'](?:login|signup|forgot)["']/i.test(html) && !/\bdata-view=["'](?:login|signup|forgot-password)["']/i.test(html)) {
    return html;
  }
  let next = html;
  for (const key of ["login", "signup", "forgot-password"] as const) {
    const built = stripCodeIntelligenceProductCss(PANELS[key]?.() ?? "");
    if (!built) continue;
    const view = key;
    const re = new RegExp(
      `<(section|div)\\b([^>]*\\bdata-view=["']${view}["'][^>]*)>([\\s\\S]*?)<\\/\\1>`,
      "i",
    );
    if (re.test(next)) {
      next = next.replace(re, `<$1$2>${built}</$1>`);
      continue;
    }
    // Fallback: replace only the form block inside any auth shell.
    const formName = key === "forgot-password" ? "forgot" : key;
    const formRe = new RegExp(
      `<form\\b[^>]*\\bdata-cint-form=["']${formName}["'][^>]*>[\\s\\S]*?<\\/form>`,
      "i",
    );
    const formMatch = built.match(formRe);
    if (formMatch) {
      next = next.replace(formRe, formMatch[0]);
    }
    next = next.replace(
      /Workspace access for the engineering intelligence demo\./gi,
      "Workspace access for the engineering intelligence product.",
    );
    next = next.replace(/Demo account only\./gi, "Creates a Code Intelligence IdP account (Viewer).");
    next = next.replace(
      /Illustrative demo gateway\.[\s\S]*?production auth\./gi,
      "Code Intelligence product sign-in (IdP). Demo session only if CINT Auth env is unset.",
    );
    next = next.replace(/Demo reset — mail send is not wired yet\./gi, "Sends a Code Intelligence IdP reset email when Auth is configured.");
    next = next.replace(/Send reset \(demo\)/gi, "Send reset link");
    next = next.replace(/Reset link simulated\. Continue to sign in\./gi, "Check your email for the reset link, then sign in.");
  }
  return next;
}

function wrap(page: string, title: string, purpose: string, body: string, auth = false): string {
  const inner = `<div data-cint-page-body><h2>${title}</h2><p class="cint-purpose">${purpose}</p>${auth ? gatewayTrust() : ""}${auth ? "" : states(page)}${body}</div>`;
  const paint = codeIntelligenceProductStyleTag();
  if (auth) {
    return `${paint}<div data-cint-shell data-product-surface="code_intelligence" data-cint-page="${page}" data-cint-auth="1">${inner}</div>`;
  }
  return `${paint}<div data-cint-shell data-product-surface="code_intelligence" data-cint-page="${page}">${chrome()}${inner}</div>`;
}

function kpis(items: readonly [string, string, string][]): string {
  return `<div class="cint-kpis">${items
    .map(
      ([label, value, key]) =>
        `<div class="cint-kpi" data-cint-kpi="${key}"><span>${label}</span><b>${value}</b></div>`,
    )
    .join("")}</div>`;
}

const PANELS: Record<string, () => string> = {
  overview: () =>
    wrap(
      "overview",
      "Overview",
      "Command centre: health of the selected repository at the analyzed commit. Not a finding register and not a fix queue.",
      `<form data-cint-form="analysis-run" class="cint-analysis-run" action="#" method="post" onsubmit="return false;">
        <p><strong>Live inspect</strong> — after Sync, run analysis here. Findings appear on FI for the selected repo.</p>
        <p class="cint-purpose">Expect analyze ~2–20s and agents ~5–40s on the synced sample (≤400 paths, 24 content files). Status shows elapsed seconds; hard stop at 90s / 120s if the request hangs.</p>
        <button class="app-btn" type="submit" name="mode" value="analyze" data-cint-analysis-run="analyze">Run live analysis</button>
        <button class="app-btn" type="submit" name="mode" value="agents" data-cint-analysis-run="agents">Run live agents</button>
        <p data-cint-live-run-status class="state-success">Sync a GitHub repo first, then run analysis/agents for real-time results.</p>
      </form>
      ${kpis([
        ["Application health", "Watch", "health"],
        ["Security posture", "SEV-1 open", "security"],
        ["Dependency health", "1 demo advisory", "deps"],
        ["Maintainability", "64", "quality"],
        ["Architecture", "Drift in billing", "arch"],
      ])}
      <section><h3>Recent findings</h3>
        <table><thead><tr><th>ID</th><th>Title</th><th>Sev</th><th>Confidence</th><th>Lifecycle</th></tr></thead>
        <tbody data-cint-finding-rows="overview"></tbody></table>
      </section>
      <section><h3>Activity</h3><div data-cint-activity></div></section>
      <section><h3>Recommendations</h3><div data-cint-recs></div></section>
      ${integrationHostHtmlForPage("overview")}`,
    ),
  repositories: () =>
    wrap(
      "repositories",
      "Repositories",
      "Where connections live: which repos exist, branch/commit, stack, and access. Selecting a row sets workspace context for every other page.",
      `<table><thead><tr><th>Repository</th><th>Stack</th><th>Branch</th><th>Commit</th><th>Access</th><th>Analysis</th></tr></thead>
      <tbody data-cint-repo-rows></tbody></table>
      <section>
        <h3>Repository profile</h3>
        <pre data-cint-repo-profile></pre>
      </section>
      <section>
        <h3>Tech profile</h3>
        <div data-cint-tech-profile></div>
      </section>
      <form data-cint-form="github-connect" action="#" method="post" onsubmit="return false;">
        <button class="app-btn" type="submit" name="action" value="connect" data-cint-github-action="connect">Connect GitHub</button>
        <button class="app-btn" type="submit" name="action" value="repos" data-cint-github-action="repos">List repos</button>
        <label>Repository <input name="repository" placeholder="owner/repo" data-cint-github-repo autocomplete="off" /></label>
        <button class="app-btn" type="submit" name="action" value="sync" data-cint-github-action="sync">Sync repository</button>
        <button class="app-btn" type="submit" name="action" value="load-self" data-cint-github-action="load-self">Load CINT product (self)</button>
        <button class="app-btn" type="submit" name="action" value="publish-product" data-cint-github-action="publish-product">Publish CINT product repo</button>
        <p data-cint-github-status class="state-success">GitHub status: checking…</p>
      </form>
      ${integrationHostHtmlForPage("repositories")}`,
    ),
  architecture: () =>
    wrap(
      "architecture",
      "Architecture Explorer",
      "How the selected repository is structured: modules, flows, auth, and data stores. Pack 08 graph selection inspects a node — it does not open the finding register.",
      `<div class="cint-split">
        <section>
          <label>Search modules <input data-cint-arch-search /></label>
          <label>Flow filter
            <select data-cint-arch-filter>
              <option value="all">All</option>
              <option value="auth">Authentication</option>
              <option value="data">Data</option>
              <option value="api">API</option>
              <option value="ops">Ops</option>
              <option value="shared">Shared</option>
            </select>
          </label>
          <pre data-cint-file-tree></pre>
          <div data-cint-graph></div>
          <section>
            <h3>Intended vs observed</h3>
            <pre data-cint-arch-intended></pre>
          </section>
        </section>
        <section>
          <h3>Node details</h3>
          <div data-cint-arch-detail>Select a module to inspect relationships and drift.</div>
          <h3>Architecture decisions</h3>
          <div data-cint-arch-decisions></div>
          <h3>Knowledge graph</h3>
          <pre data-cint-knowledge-graph></pre>
        </section>
      </div>
      ${integrationHostHtmlForPage("architecture")}`,
    ),
  security: () =>
    wrap(
      "security",
      "Security Center",
      "Posture only: AUTH, ACCESS, TLS, SECRETS, API, and CONFIG grouped for this commit. Individual issue workflow lives on Findings. Fix proposals live on Remediation.",
      `${kpis([
        ["SEV-0", "0", "s0"],
        ["SEV-1", "—", "s1"],
        ["SEV-2", "—", "s2"],
      ])}
      <div class="app-toolbar">
        <select data-cint-sec-cat><option value="all">All security categories</option><option value="AUTH">AUTH</option><option value="ACCESS">ACCESS</option><option value="TLS">TLS</option><option value="SECRETS">SECRETS</option><option value="API">API</option><option value="CONFIG">CONFIG</option></select>
        <select data-cint-sec-sev><option value="all">All severities</option><option value="SEV-1">SEV-1</option><option value="SEV-2">SEV-2</option><option value="SEV-3">SEV-3</option></select>
        <button type="button" class="app-btn" data-cint-reset-filters="security">Reset filters</button>
      </div>
      <table><thead><tr><th>ID</th><th>Area</th><th>Sev</th><th>Why it exists</th><th>Evidence</th></tr></thead>
      <tbody data-cint-finding-rows="security"></tbody></table>
      ${integrationHostHtmlForPage("security")}`,
    ),
  findings: () =>
    wrap(
      "findings",
      "Findings",
      "Cross-category register for this repository and commit: quality, security, docs, and deps in one lifecycle. Same finding ID as Overview or Security opens the same drawer.",
      `<div class="app-toolbar">
        <input data-cint-finding-search placeholder="Search title or file" />
        <select data-cint-finding-cat><option value="all">All categories</option><option value="SECRETS">SECRETS</option><option value="AUTH">AUTH</option><option value="DEPS">DEPS</option><option value="DUP">DUP</option><option value="ARCH">ARCH</option><option value="MAINT">MAINT</option><option value="DOC">DOC</option><option value="CONFIG">CONFIG</option></select>
        <select data-cint-finding-life><option value="all">All lifecycle</option><option value="DETECTED">DETECTED</option><option value="TRIAGED">TRIAGED</option><option value="ACCEPTED">ACCEPTED</option><option value="IN_PROGRESS">IN_PROGRESS</option><option value="VALIDATION">VALIDATION</option><option value="RESOLVED">RESOLVED</option><option value="REOPENED">REOPENED</option></select>
        <button type="button" class="app-btn" data-cint-reset-filters="findings">Reset</button>
        <button type="button" class="app-btn" data-cint-export>Export workspace JSON</button>
      </div>
      <table><thead><tr><th>ID</th><th>Title</th><th>Sev</th><th>Conf</th><th>Cat</th><th>Lifecycle</th><th>File</th></tr></thead>
      <tbody data-cint-finding-rows="findings"></tbody></table>
      ${integrationHostHtmlForPage("findings")}
      <section data-cint-evidence-explorer>
        <h3>Evidence Explorer</h3>
        <p class="cint-purpose">Every finding must have evidence. Screenshots and stack traces appear only when present in the snapshot.</p>
        <div class="app-toolbar">
          <input data-cint-evidence-search placeholder="Search evidence id, file, snippet" />
          <select data-cint-evidence-slot>
            <option value="all">All sources</option>
            <option value="code_snippets">Code snippets</option>
            <option value="file_references">File references</option>
            <option value="stack_traces">Stack traces</option>
            <option value="logs">Logs</option>
            <option value="configs">Configs</option>
            <option value="commit_history">Commit history</option>
            <option value="screenshots">Screenshots</option>
          </select>
          <select data-cint-evidence-kind>
            <option value="all">All kinds</option>
            <option value="SOURCE_CODE">SOURCE_CODE</option>
            <option value="CONFIGURATION">CONFIGURATION</option>
            <option value="DEPENDENCY">DEPENDENCY</option>
            <option value="DOCUMENTATION">DOCUMENTATION</option>
            <option value="COMMIT_HISTORY">COMMIT_HISTORY</option>
            <option value="LOG">LOG</option>
          </select>
        </div>
        <table><thead><tr><th>ID</th><th>Finding</th><th>Source</th><th>Kind</th><th>Location</th><th>Summary</th></tr></thead>
        <tbody data-cint-evidence-rows></tbody></table>
        <pre data-cint-evidence-detail>Select a row to inspect the snippet.</pre>
      </section>
      <section data-cint-investigation-workspace>
        <h3>Investigation Workspace</h3>
        <p class="cint-purpose">Pack 06 — investigations open only from findings that already have evidence. Not a separate Investigations page.</p>
        <table><thead><tr><th>ID</th><th>Finding</th><th>Question</th><th>State</th><th>Evidence</th></tr></thead>
        <tbody data-cint-investigation-rows></tbody></table>
        <pre data-cint-investigation-detail>Select an investigation to inspect hypotheses and conclusion.</pre>
      </section>`,
    ),
  remediation: () =>
    wrap(
      "remediation",
      "Remediation",
      "Proposed fixes only: patch preview, impact, tests, approval, and rollback. This is not a second findings list. Approving never writes source.",
      `<div class="cint-split">
        <section>
          <table><thead><tr><th>Plan</th><th>Finding</th><th>Impact</th><th>Tests</th><th>Status</th></tr></thead>
          <tbody data-cint-remediation-rows></tbody></table>
        </section>
        <section>
          <h3>Patch preview</h3>
          <pre data-cint-diff></pre>
          <p>Approve + apply opens a real GitHub PR when the repo is connected and L4/L5 recovery is present. Type real values — gray placeholders do not count.</p>
          <form data-cint-form="approve-remediation" data-cint-remediation-apply="1" action="#" onsubmit="return false;">
            <label>Patch path <input name="patchPath" placeholder="cint-proof/remediation-smoke.md" data-cint-patch-path autocomplete="off" /></label>
            <label>Patch content <textarea name="patchContent" rows="4" data-cint-patch-content placeholder="CINT L4 proof — do not merge blindly."></textarea></label>
            <label>Recovery snapshot id <input name="recoverySnapshotId" data-cint-recovery-id placeholder="snap_manual_YYYY-MM-DD_l4" autocomplete="off" /></label>
            <button class="app-btn" type="button" data-cint-remediation-decision="approve">Approve + open PR</button>
            <button class="app-btn" type="button" data-cint-remediation-decision="reject">Reject</button>
          </form>
          <p data-cint-remediation-status class="cint-muted" aria-live="polite"></p>
          <div data-cint-approval-history></div>
        </section>
      </div>
      ${integrationHostHtmlForPage("remediation")}`,
    ),
  dependencies: () =>
    wrap(
      "dependencies",
      "Dependencies",
      "Package inventory and advisory status for the selected commit. Advisories are demo-labeled; they are not live CVE lookups.",
      `<div class="app-toolbar">
        <input data-cint-dep-search placeholder="Search packages" />
        <select data-cint-dep-kind><option value="all">Direct + transitive</option><option value="direct">Direct</option><option value="transitive">Transitive</option></select>
        <button type="button" class="app-btn" data-cint-reset-filters="dependencies">Reset</button>
      </div>
      <table><thead><tr><th>Package</th><th>Kind</th><th>Version</th><th>Advisory</th><th>License</th><th>Upgrade</th></tr></thead>
      <tbody data-cint-dep-rows></tbody></table>
      <section><h3>Dependency graph</h3><pre data-cint-dep-graph></pre></section>
      <section><h3>Upgrade comparison</h3><div data-cint-upgrade></div></section>
      ${integrationHostHtmlForPage("dependencies")}`,
    ),
  quality: () =>
    wrap(
      "quality",
      "Code Quality",
      "Maintainability, duplication, complexity, and coupling for this commit. Security issues are not listed here — they belong on Security Center and the Findings register.",
      `${kpis([
        ["Maintainability", "64", "maint"],
        ["Duplication", "12%", "dup"],
        ["Hotspots", "auth handler", "hot"],
      ])}
      <div class="app-toolbar">
        <select data-cint-quality-cat><option value="all">All quality kinds</option><option value="COMPLEX">COMPLEX</option><option value="DUP">DUP</option><option value="PERF">PERF</option></select>
        <button type="button" class="app-btn" data-cint-reset-filters="quality">Reset</button>
      </div>
      <table><thead><tr><th>ID</th><th>Issue</th><th>Kind</th><th>File</th></tr></thead>
      <tbody data-cint-quality-rows></tbody></table>
      <section><h3>Refactor example</h3><pre data-cint-refactor></pre></section>
      ${integrationHostHtmlForPage("quality")}`,
    ),
  documentation: () =>
    wrap(
      "documentation",
      "Documentation",
      "Developer vs end-user guides, outline, freshness, and version. Outdated pages are labeled STALE against the analyzed commit. Knowledge Intelligence (KIL) is read-only browse — no edit/generate.",
      `<div class="cint-split">
        <nav data-cint-doc-toc></nav>
        <article>
          <div class="app-toolbar"><input data-cint-doc-search placeholder="Search docs" /><button type="button" class="app-btn" data-cint-reset-filters="docs">Reset</button></div>
          <div data-cint-doc-view></div>
        </article>
      </div>
      <section class="cint-kil" data-cint-kil="1" data-cint-kil-version="CINT-KIL-1.0">
        <h3>Knowledge Intelligence</h3>
        <p class="cint-purpose">Read-only catalog of sealed objects (K1–K5). Search by ID, kind, or class. No edit or generate.</p>
        <div class="app-toolbar" data-cint-kil-toolbar>
          <input data-cint-kil-search placeholder="Search ID or title" aria-label="KIL search" />
          <select data-cint-kil-kind aria-label="KIL kind">
            <option value="">All kinds</option>
            <option value="finding">Finding</option>
            <option value="evidence">Evidence</option>
            <option value="remediation">Remediation</option>
            <option value="analysis_run">Analysis run</option>
            <option value="dependency">Dependency</option>
          </select>
          <select data-cint-kil-class aria-label="KIL class">
            <option value="">All classes</option>
            <option value="Security">Security</option>
            <option value="Quality">Quality</option>
            <option value="Dependency">Dependency</option>
            <option value="Architecture">Architecture</option>
            <option value="Documentation">Documentation</option>
            <option value="Operational">Operational</option>
            <option value="Governance">Governance</option>
            <option value="Knowledge">Knowledge</option>
          </select>
          <button type="button" class="app-btn" data-cint-kil-run>Browse</button>
        </div>
        <p data-cint-kil-status class="cint-muted">Run Analyze, then Browse.</p>
        <div data-cint-kil-results></div>
        <div data-cint-kil-detail>Select an object to inspect classification and relationships.</div>
        <pre data-cint-kil-edges></pre>
      </section>
      ${integrationHostHtmlForPage("documentation")}`,
    ),
  assistant: () =>
    wrap(
      "assistant",
      "AI Assistant",
      "Live Assistant bound to the active repository and commit. Uses Claude (CINT_ANTHROPIC_API_KEY) when configured on the host.",
      `<p data-cint-assistant-context></p>
      <p data-cint-suggest-row>Suggested:
        <button type="button" class="app-btn" data-cint-suggest="Summarize the top findings for this repository and commit.">Top findings</button>
        <button type="button" class="app-btn" data-cint-suggest="Which direct dependencies look most important in the live inventory?">Key dependencies</button>
      </p>
      <p data-cint-assistant-meta class="cint-muted">Ask sends live findings / evidence / deps with the question. Answers time out instead of spinning forever.</p>
      <div data-cint-thread></div>
      <form data-cint-form="assistant"><input name="q" required placeholder="Ask about this repository" />
      <button class="app-btn" type="submit" data-cint-assistant-ask>Ask</button></form>
      <section><h3>Citations</h3><div data-cint-citations></div></section>`,
    ),
  history: () =>
    wrap(
      "history",
      "Analysis History",
      "Past runs for this workspace: commit references, resolved/reopened findings, and trend direction. A failed run is marked failed — not rendered as a clean scorecard.",
      `<table><thead><tr><th>Run</th><th>Commit</th><th>State</th><th>Resolved</th><th>Reopened</th><th>Notes</th></tr></thead>
      <tbody data-cint-history-rows></tbody></table>
      <section><h3>Compare</h3>
      <button type="button" class="app-btn" data-cint-compare>Compare last two runs</button>
      <div data-cint-compare-out></div></section>
      ${integrationHostHtmlForPage("history")}`,
    ),
  settings: () =>
    wrap(
      "settings",
      "Settings",
      "Workspace preferences for this Code Intelligence app. Organisation Admin, Contacts, and Support are separate sealed pages.",
      `<form data-cint-form="prefs">
        <h3>Analysis preferences</h3>
        <label>Retention days <input name="retention" type="number" value="30" /></label>
        <h3>Notifications</h3>
        <label><input type="checkbox" name="notify" checked /> Local finding notifications</label>
        <label><input type="checkbox" name="reminders" checked /> Local reminder digests</label>
        <h3>Audit</h3>
        <label><input type="checkbox" name="audit" checked /> Keep local audit events</label>
        <h3>Access</h3>
        <p data-cint-access>Architect · review_findings, view_architecture, approve_remediation</p>
        <h3>Integrations present</h3>
        <p>Simulated GitHub connection · Phase 7 Import/Upload/Export host surfaces (prepare-only).</p>
        <button class="app-btn" type="submit">Save</button>
      </form>
      <p class="cint-row">
        <a href="#admin" data-view-nav="admin" class="app-btn">Open Admin</a>
        <a href="#contacts" data-view-nav="contacts" class="app-btn">Open Contacts</a>
        <a href="#support" data-view-nav="support" class="app-btn">Open Support</a>
      </p>
      <p><button type="button" class="app-btn" data-cint-signout>Sign out of this demo</button></p>
      <section><h3>Audit events</h3><div data-cint-audit></div></section>`,
    ),
  admin: () =>
    wrap(
      "admin",
      "Admin",
      "Code Intelligence organisation Admin — IdP members and role promotion. Not Replica host /admin. Requires role Admin (org.admin).",
      `<section data-cint-admin-gate="1">
        <p class="cint-purpose" data-cint-admin-access>Only workspace <strong>Admin</strong> can promote roles. Architect can approve remediation without org.admin.</p>
        <p data-cint-admin-status class="cint-purpose" aria-live="polite"></p>
        <p class="cint-row" data-cint-admin-bootstrap-wrap hidden>
          <button type="button" class="app-btn" data-cint-admin-bootstrap>Claim workspace Admin (first Admin)</button>
        </p>
        <div class="cint-row">
          <button type="button" class="app-btn" data-cint-admin-refresh>Refresh members</button>
        </div>
        <h3>IdP members</h3>
        <table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Promote</th></tr></thead>
        <tbody data-cint-admin-members></tbody></table>
      </section>
      <section>
        <h3>Assignable roles</h3>
        <div data-cint-admin-roles>Admin · Architect · Security Analyst · Viewer</div>
      </section>
      <form data-cint-form="admin-policy">
        <h3>Workspace policy (local prefs)</h3>
        <label><input type="checkbox" name="requireApproval" checked /> Remediation requires human L4 approval</label>
        <label><input type="checkbox" name="requireRecovery" checked /> Mutate requires recovery snapshot</label>
        <label><input type="checkbox" name="connectorFreeze" checked /> Connector freeze until human lift</label>
        <button class="app-btn" type="submit">Save policy (local)</button>
      </form>
      <p data-cint-admin-note>Admin governs this sealed CI product — not FOC contacts and not Replica Platform Intelligence. Role changes require the member to sign out and sign in again.</p>`,
    ),
  contacts: () =>
    wrap(
      "contacts",
      "Contacts",
      "Organisation directory for this Code Intelligence workspace — owners, reviewers, and engineering contacts. Not FOC driver/customer contacts.",
      `<form data-cint-form="contact-add" class="app-form">
        <h3>Add contact</h3>
        <label>Name <input name="name" required /></label>
        <label>Email <input name="email" type="email" required /></label>
        <label>Role
          <select name="role">
            <option>Admin</option>
            <option>Architect</option>
            <option>Security Analyst</option>
            <option>Engineering Manager</option>
            <option>Developer</option>
            <option>Reviewer</option>
            <option>Viewer</option>
          </select>
        </label>
        <label>Team <input name="team" placeholder="Platform / Security / Delivery" /></label>
        <button class="app-btn" type="submit">Save contact</button>
      </form>
      <table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Team</th><th></th></tr></thead>
      <tbody data-cint-contact-rows></tbody></table>`,
    ),
  support: () =>
    wrap(
      "support",
      "Support",
      "Help desk for the Code Intelligence engineering platform — guides, FAQs, and local support requests.",
      `<section>
        <h3>Quick help</h3>
        <ul data-cint-support-faq>
          <li>Seal Recovery before any mutate agent action.</li>
          <li>Notifications never imply approval (Article XI).</li>
          <li>Connector lift stays authorized_not_wired until live OAuth is wired.</li>
          <li>Remediation Engineer cannot write source until connectors + L4/L5 + recovery.</li>
        </ul>
      </section>
      <form data-cint-form="support-ticket" class="app-form">
        <h3>Open a support request</h3>
        <label>Subject <input name="subject" required /></label>
        <label>Category
          <select name="category">
            <option>Workspace access</option>
            <option>Analysis / findings</option>
            <option>Governance / approvals</option>
            <option>Integrations</option>
            <option>Other</option>
          </select>
        </label>
        <label>Details <textarea name="body" rows="4" required></textarea></label>
        <button class="app-btn" type="submit">Submit (local demo)</button>
      </form>
      <section>
        <h3>Your requests</h3>
        <table><thead><tr><th>When</th><th>Subject</th><th>Category</th><th>Status</th></tr></thead>
        <tbody data-cint-support-rows></tbody></table>
      </section>`,
    ),
  landing: () => {
    const paint = codeIntelligenceProductStyleTag();
    const body = buildCodeIntelligenceMarketingLandingHtml();
    return `${paint}<div data-cint-shell data-product-surface="code_intelligence" data-cint-page="landing" data-cint-auth="1" data-cint-gateway-surface="marketing">${body}</div>`;
  },
  login: () =>
    wrap(
      "login",
      "Sign in",
      "Workspace access for the engineering intelligence product.",
      `<form data-cint-form="login" class="app-form" data-cint-auth-action="login" action="#" onsubmit="return false;" novalidate>
        <label>Email <input type="email" name="email" required autocomplete="username" /></label>
        <label>Password <input type="password" name="password" required autocomplete="current-password" /></label>
        <p data-cint-auth-status class="cint-purpose" aria-live="polite"></p>
        <button class="app-btn" type="submit" data-cint-auth-submit="login">Continue</button>
        <p><a href="#signup" data-view-nav="signup">Create account</a>
        · <a href="#forgot-password" data-view-nav="forgot-password">Forgot password</a></p>
        <p class="state-success" hidden>Signed in. Opening Overview…</p>
      </form>`,
      true,
    ),
  signup: () =>
    wrap(
      "signup",
      "Create account",
      "Creates a Code Intelligence IdP account (Viewer). Demo only if Auth env is unset.",
      `<form data-cint-form="signup" class="app-form" data-cint-auth-action="signup" action="#" onsubmit="return false;" novalidate>
        <label>Email <input type="email" name="email" required autocomplete="username" /></label>
        <label>Password <input type="password" name="password" required minlength="8" autocomplete="new-password" /></label>
        <p data-cint-auth-status class="cint-purpose" aria-live="polite"></p>
        <button class="app-btn" type="submit" data-cint-auth-submit="signup">Create</button>
        <p><a href="#login" data-view-nav="login">Already have an account? Sign in</a></p>
        <p class="state-success" hidden>Account ready. Opening Overview…</p>
      </form>`,
      true,
    ),
  "forgot-password": () =>
    wrap(
      "forgot-password",
      "Reset password",
      "Sends a Code Intelligence IdP reset email when Auth is configured.",
      `<form data-cint-form="forgot" class="app-form" data-cint-auth-action="forgot" action="#" onsubmit="return false;" novalidate>
        <label>Email <input type="email" name="email" required autocomplete="username" /></label>
        <p data-cint-auth-status class="cint-purpose" aria-live="polite"></p>
        <button class="app-btn" type="submit" data-cint-auth-submit="forgot">Send reset link</button>
        <p><a href="#login" data-view-nav="login">Back to sign in</a></p>
        <p class="state-success" hidden>Check your email for the reset link, then sign in.</p>
      </form>`,
      true,
    ),
};

export function isCodeIntelligencePanelContext(
  options?: {
    userPrompt?: string;
    fieldRegistryId?: string | null;
    pages?: readonly string[];
    modules?: readonly string[];
  } | null,
): boolean {
  // Prompt-only was wrong: sealed field / CI page floor must paint CI panels even when
  // the transient userPrompt is empty, merged, or non-explicit at panel resolve time.
  if (isCodeIntelligencePromptText(options?.userPrompt)) return true;
  return isCodeIntelligenceProductAsk({
    userPrompt: options?.userPrompt,
    fieldRegistryId: options?.fieldRegistryId,
    pages: options?.pages ?? options?.modules,
  });
}

/** Full CI app-shell from sealed contract pages — last resort when incremental heal leaves brochure. */
export function rebuildCodeIntelligencePreviewShell(
  contractPages?: readonly string[],
): string {
  const labels =
    contractPages && contractPages.length > 0
      ? [...contractPages]
      : [
          "Landing",
          "Login",
          "Signup",
          "Forgot Password",
          "Overview",
          "Repositories",
          "Findings",
          "Settings",
        ];
  const seen = new Set<string>();
  const panels: string[] = [];
  for (const label of labels) {
    const key = normalizePageKey(label);
    if (!key || seen.has(key)) continue;
    if (key === "dashboard" || key === "command-centre" || key === "home") continue;
    if (!CI_CONTRACT_SEED_KEYS.has(key) && !CINT_GATEWAY_FLOORS.some((f) => f.id === key)) {
      // Still allow any label buildCodeIntelligencePanel knows.
      if (!buildCodeIntelligencePanel(label)) continue;
    }
    seen.add(key);
    const body = stripCodeIntelligenceProductCss(buildCodeIntelligencePanel(label) ?? "");
    if (!body) continue;
    const hidden = key === "landing" ? "" : " hidden";
    panels.push(
      `<section class="app-view-panel" data-view="${key}" id="${key}"${hidden}>${body}</section>`,
    );
  }
  if (!seen.has("landing")) {
    const body = stripCodeIntelligenceProductCss(buildCodeIntelligencePanel("Landing") ?? "");
    if (body) {
      panels.unshift(
        `<section class="app-view-panel" data-view="landing" id="landing">${body}</section>`,
      );
    }
  }
  if (!seen.has("overview")) {
    const body = stripCodeIntelligenceProductCss(buildCodeIntelligencePanel("Overview") ?? "");
    if (body) {
      panels.push(
        `<section class="app-view-panel" data-view="overview" id="overview" hidden>${body}</section>`,
      );
    }
  }
  return `${codeIntelligenceProductStyleTag()}
<link rel="icon" type="image/svg+xml" href="/ci-favicon.svg" data-cint-favicon="1" />
<div class="app-shell" data-cint-app-shell="1" data-product-surface="code_intelligence" data-cint-sidebar="expanded" data-cint-zone="gateway">${buildCodeIntelligenceTopbarHtml()}${buildCodeIntelligenceRailHtml(labels)}
<main class="app-main app-main-operational">
${panels.join("\n")}
</main>
</div>`;
}

export function buildCodeIntelligencePanel(label: string): string | null {
  const key = normalizePageKey(label);
  if (key === "dashboard" || key === "command-centre") return PANELS.overview();
  const build = PANELS[key];
  return build ? build() : null;
}
