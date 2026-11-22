/**
 * Code Intelligence workspace runtime — one store, all routes.
 * Demo localStorage by default; when data-pgbe-sealed="1", prefers Part II API
 * (/api/projects/:id/cint/:entity) and keeps localStorage as cache only.
 */

import { demoRuntimeWorkspaceSeed } from "@/core/codeIntelligence/codeIntelligenceAnalysis";

export const CINT_RUNTIME_START = "/* replica-cint-runtime-start */";
export const CINT_RUNTIME_END = "/* replica-cint-runtime-end */";
export const CINT_BOOT = "__replicaCintRuntimeInstalled";

export function htmlHasCodeIntelligenceSurface(html: string): boolean {
  return (
    /\bdata-cint-shell\b/i.test(html) ||
    /\bdata-cint-app-shell\b/i.test(html) ||
    /\bdata-cint-demo\b/i.test(html) ||
    /\bdata-cint-page\b/i.test(html) ||
    /\bdata-product-surface=["']code_intelligence["']/i.test(html)
  );
}

export function stripCodeIntelligenceRuntime(js: string | null | undefined): string {
  if (!js?.trim()) return "";
  const start = js.indexOf(CINT_RUNTIME_START);
  if (start === -1) return js.trim();
  const end = js.indexOf(CINT_RUNTIME_END, start);
  if (end === -1) return js.slice(0, start).trim();
  return (js.slice(0, start) + js.slice(end + CINT_RUNTIME_END.length)).trim();
}

export const CINT_RUNTIME_ENGINE_VERSION = "CINT-EE-1.56" as const;

export function generateCodeIntelligenceRuntimeScript(): string {
  const seed = demoRuntimeWorkspaceSeed();
  const profilesJson = JSON.stringify(seed.profiles);
  const findingsJson = JSON.stringify(seed.findings);
  const depsJson = JSON.stringify(seed.deps);
  const evidenceJson = JSON.stringify(seed.evidence);
  const investigationsJson = JSON.stringify(seed.investigations);
  const remediationsJson = JSON.stringify(seed.remediations);
  const architectureJson = JSON.stringify(seed.architecture);
  return `${CINT_RUNTIME_START}
(function(){
  if(window.${CINT_BOOT}) return;
  window.${CINT_BOOT}=true;
  var NS="cint.v1.";
  var ENGINE="${CINT_RUNTIME_ENGINE_VERSION}";
  var shell=document.querySelector("[data-product-surface='code_intelligence'],[data-cint-app-shell],[data-cint-shell]");
  var PGBE=shell && shell.getAttribute("data-pgbe-sealed")==="1";
  /* Stamp rail-on BEFORE first paint settles — avoids 1-col OK then navy-rail FOUC / Integration drift. */
  (function earlyWorkspaceRail(){
    var app=document.querySelector(".app-shell[data-cint-app-shell],[data-cint-app-shell]");
    if(!app) return;
    var sess=null;
    try{ sess=localStorage.getItem("cint.session.v1"); }catch(e){}
    if(!sess) return;
    var hash="";
    try{ hash=String(location.hash||"").replace(/^#/,"").toLowerCase(); }catch(e){}
    if(hash==="home") hash="landing";
    if(hash==="dashboard"||hash==="command-centre") hash="overview";
    if(!hash || hash==="landing" || hash==="login" || hash==="signup" || hash==="forgot-password" || hash==="forgot" || hash==="forgot_password") return;
    app.setAttribute("data-cint-authed","1");
    app.setAttribute("data-cint-zone","workspace");
    app.setAttribute("data-cint-rail-on","1");
  })();
  /* EE-1.36 — kill legacy gateway CSS that forced [hidden] landing to 32rem display:block. */
  (function injectGatewayViewCssKill(){
    if(document.getElementById("cint-ee-136-gateway-view-kill")) return;
    var st=document.createElement("style");
    st.id="cint-ee-136-gateway-view-kill";
    st.textContent=[
      '.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"] > .app-main > [data-view="landing"][hidden],',
      '.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"] [data-view="landing"][hidden]{display:none!important;visibility:hidden!important;height:0!important;max-height:0!important;overflow:hidden!important;width:0!important;max-width:0!important;margin:0!important;padding:0!important;pointer-events:none!important}',
      '.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"] > .app-main > [data-view="login"][hidden],',
      '.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"] > .app-main > [data-view="signup"][hidden],',
      '.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"] > .app-main > [data-view="forgot-password"][hidden]{display:none!important;visibility:hidden!important;height:0!important;overflow:hidden!important;pointer-events:none!important}',
      '.app-shell[data-cint-app-shell="1"][data-cint-zone="gateway"]:not([data-cint-authed="1"]) > .app-main > [data-view="landing"]:not([hidden]):has([data-cint-marketing="1"]){width:100%!important;max-width:none!important;margin:0!important;display:flex!important;flex-direction:column!important;align-self:stretch!important}'
    ].join("");
    (document.head||document.documentElement).appendChild(st);
  })();
  function hostPathname(){
    try{
      if(window.top&&window.top.location&&window.top.location.pathname) return window.top.location.pathname;
    }catch(e){}
    return location.pathname||"";
  }
  function resolveProjectId(){
    var liveShell=document.querySelector("[data-product-surface='code_intelligence'],[data-cint-app-shell],[data-cint-shell]")||shell;
    var fromShell=liveShell && (
      liveShell.getAttribute("data-cint-project-id")||
      liveShell.getAttribute("data-replica-project-id")||
      liveShell.getAttribute("data-project-id")
    );
    if(fromShell&&fromShell!=="local"&&fromShell!=="oauth") return fromShell;
    try{
      var fromHtml=document.documentElement.getAttribute("data-cint-project-id")||
        document.documentElement.getAttribute("data-replica-project-id");
      if(fromHtml&&fromHtml!=="local"&&fromHtml!=="oauth") return fromHtml;
    }catch(e){}
    var path=hostPathname();
    // Builder /projects/:id, public /deploy/:slug, and /preview/:id must all resolve.
    var m=path.match(/\\/(?:projects|preview|deploy)\\/([^/]+)/);
    if(m&&m[1]&&m[1]!=="local"&&m[1]!=="oauth") return m[1];
    try{
      m=location.pathname.match(/\\/(?:projects|preview|deploy)\\/([^/]+)/);
      if(m&&m[1]&&m[1]!=="local"&&m[1]!=="oauth") return m[1];
    }catch(e2){}
    return fromShell||"local";
  }
  // Re-resolve on every use — srcdoc boot can miss a late-stamped project id.
  function projectId(){ return resolveProjectId(); }
  // Legacy alias kept for in-script call sites (export name, OAuth notes).
  Object.defineProperty(window, "__cintProjectId", { get: projectId, configurable: true });
  var PROJECT=projectId();
  function syncProjectId(){ PROJECT=projectId(); return PROJECT; }
  var ENTITY_KEY={findings:"findings",evidence:"evidence",investigations:"investigations",remediation:"remediation",remediations:"remediation",repos:"repositories",repositories:"repositories",history:"analysis_runs",analysis_runs:"analysis_runs"};
  // Live preview srcdoc has no origin — resolve API calls against the host frame.
  function apiOrigin(){
    try{
      if(window.top&&window.top.location&&window.top.location.origin&&window.top.location.origin!=="null"){
        return window.top.location.origin;
      }
    }catch(e){}
    try{ if(location.origin&&location.origin!=="null") return location.origin; }catch(e2){}
    return "";
  }
  function apiUrl(entity){ return apiOrigin()+"/api/projects/"+encodeURIComponent(projectId())+"/cint/"+encodeURIComponent(entity); }
  function cintPath(suffix){ return apiOrigin()+"/api/projects/"+encodeURIComponent(projectId())+"/cint/"+suffix; }
  function authHeaders(extra){
    var h=Object.assign({"Content-Type":"application/json"}, extra||{});
    var s=readSession();
    if(s&&s.accessToken) h.Authorization="Bearer "+s.accessToken;
    return h;
  }
  function hostReturnPath(){
    try{
      if(window.top&&window.top.location){
        return window.top.location.pathname+window.top.location.search;
      }
    }catch(e){}
    return location.pathname+location.search;
  }
  function read(k, fb){ try{ var r=localStorage.getItem(NS+k); return r?JSON.parse(r):fb; }catch(e){ return fb; } }
  function write(k,v){
    try{ localStorage.setItem(NS+k, JSON.stringify(v)); }catch(e){}
    if(!PGBE) return;
    var entity=ENTITY_KEY[k];
    if(!entity) return;
    try{
      fetch(apiUrl(entity),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:k+"-bundle",key:k,payload:v,provider:"local_snapshot"})}).catch(function(){});
    }catch(e){}
  }
  var SECURITY_CATS={SECRETS:1,AUTH:1,ACCESS:1,TLS:1,SEC:1,CONFIG:1,SECURITY:1};
  var QUALITY_CATS={DUP:1,COMPLEX:1,MAINT:1,PERF:1,DOC:1,DEAD:1,LARGE:1,QUALITY:1};
  function normalizeFindingRow(f, repository){
    var sev=f.severity||f.sev||"INFO";
    var file=f.file||f.location||"";
    var cat=String(f.category||f.criteria||"general").toUpperCase();
    var security=f.security===true||f.security===false?!!f.security:!!SECURITY_CATS[cat];
    var quality=f.quality===true||f.quality===false?!!f.quality:!!QUALITY_CATS[cat];
    return {
      id:f.id,
      repo:repository||f.repositoryName||f.repo||f.repository||f.name||f.repositoryId||"",
      title:f.title||f.id,
      sev:sev,
      severity:sev,
      confidence:f.confidence||"—",
      lifecycle:f.lifecycle||(f.status==="open"?"DETECTED":String(f.status||"DETECTED").toUpperCase()),
      category:f.category||f.criteria||"general",
      location:file,
      file:file,
      why:f.why||"",
      area:f.area||f.category||"",
      security:security,
      quality:quality,
      evidence:f.evidence||"",
      rec:f.rec||"Review evidence. Engines never modify source."
    };
  }
  function mapEntityRowsToWorkspace(entity, rows){
    if(entity==="findings"){
      return rows.filter(function(row){ return row && !row.key && (row.title||row.id); }).map(function(f){
        return normalizeFindingRow(f, f.repositoryName||f.repo||f.repository||f.name||f.repositoryId||"");
      });
    }
    if(entity==="evidence"){
      return rows.filter(function(row){ return row && !row.key && (row.summary||row.id); }).map(function(e){
        return {
          id:e.id,
          findingId:e.findingId||"",
          repo:e.repositoryId||e.repo||"",
          repositoryId:e.repositoryId||e.repo||"",
          slot:e.slot||e.traceRef||"code",
          kind:e.kind||e.source||"snippet",
          location:e.location||"",
          summary:e.summary||"",
          snippet:e.snippet||""
        };
      });
    }
    if(entity==="investigations"){
      return rows.filter(function(row){ return row && !row.key && (row.findingId||row.id); }).map(function(x){
        return {
          id:x.id,
          repo:x.repositoryId||x.repo||"",
          findingId:x.findingId||"",
          question:x.question||x.hypothesis||"",
          state:x.state||x.status||"OPEN",
          evidenceIds:x.evidenceIds||[],
          hypotheses:x.hypotheses||[],
          analysis:x.analysis||"",
          conclusion:x.conclusion||""
        };
      });
    }
    if(entity==="analysis_runs"||entity==="history"){
      return rows.filter(function(row){ return row && !row.key && row.id; }).map(function(h){
        return {
          id:h.id,
          run:h.id,
          repo:h.repositoryName||h.repository_name||h.repository||h.repo||"",
          state:h.state||"COMPLETED",
          at:h.created_at||h.createdAt||h.at||"",
          commit:h.commitSha||h.commit_sha||h.commit||"",
          findings:h.findingsCount||h.findings_count||0,
          evidence:h.evidenceCount||h.evidence_count||0
        };
      });
    }
    return null;
  }
  function hydrateFromApi(){
    // B2: rehydrate durable entities whenever we have a real project id — not only PGBE-sealed HTML.
    var pid=syncProjectId();
    if(!pid||pid==="local"||pid==="oauth") return;
    ["findings","evidence","investigations","remediation","repositories","analysis_runs"].forEach(function(entity){
      try{
        fetch(apiUrl(entity)).then(function(r){ return r.json(); }).then(function(body){
          if(!body||!body.ok||!body.data) return;
          var rows=Array.isArray(body.data)?body.data:[body.data];
          var bundle=rows.find(function(row){ return row && row.key && ENTITY_KEY[row.key]===entity; });
          if(bundle && bundle.payload!=null){
            try{ localStorage.setItem(NS+(bundle.key), JSON.stringify(bundle.payload)); }catch(e){}
          } else {
            var mapped=mapEntityRowsToWorkspace(entity, rows);
            if(mapped && mapped.length){
              var storeKey=entity==="analysis_runs"?"history":entity;
              try{ localStorage.setItem(NS+storeKey, JSON.stringify(mapped)); }catch(e){}
            }
          }
          if(typeof paint==="function") paint();
        }).catch(function(){});
      }catch(e){}
    });
  }
  hydrateFromApi();
  function paintImportHonesty(oauthConfigured, connected){
    // Local/ZIP extract stays available without OAuth; only GitHub provider needs Connect.
    document.querySelectorAll("[data-cint-ihs-import-submit]").forEach(function(btn){
      btn.disabled=false;
      btn.textContent="Import / extract";
      btn.title=oauthConfigured
        ?(connected?"GitHub + local extract ready":"Local extract live — Connect GitHub for github provider")
        :"Local / ZIP extract live — set CINT_GITHUB_CLIENT_ID/SECRET for GitHub";
    });
    document.querySelectorAll("[data-cint-ihs-github-card] .cint-ihs-meta").forEach(function(meta){
      if(!oauthConfigured){
        meta.innerHTML='<span class="cint-ihs-chip" data-level="observe">Local extract live</span><span class="cint-ihs-chip" data-level="prepare">GitHub OAuth missing</span>';
        return;
      }
      meta.innerHTML=connected
        ?'<span class="cint-ihs-chip" data-level="observe">GitHub connected</span><span class="cint-ihs-chip" data-level="observe">Local extract live</span>'
        :'<span class="cint-ihs-chip" data-level="observe">OAuth ready</span><span class="cint-ihs-chip" data-level="prepare">Connect GitHub</span><span class="cint-ihs-chip" data-level="observe">Local extract live</span>';
    });
  }
  function refreshGitHubStatus(){
    var statusEl=document.querySelector("[data-cint-github-status]");
    fetch(cintPath("github/status")).then(function(r){ return r.json(); }).then(function(body){
      if(!body||!body.ok){
        if(statusEl) statusEl.textContent="GitHub status unavailable";
        return;
      }
      paintImportHonesty(!!body.oauthConfigured, !!body.connected);
      if(!statusEl) return;
      if(!body.oauthConfigured){
        statusEl.textContent="GitHub OAuth not configured (set CINT_GITHUB_CLIENT_ID + CINT_GITHUB_CLIENT_SECRET)";
        return;
      }
      if(!body.connected){ statusEl.textContent="GitHub: disconnected — click Connect GitHub"; return; }
      var live=body.liveIndex&&body.liveIndex.synced;
      statusEl.textContent=live
        ?("GitHub: "+(body.accountLogin||"connected")+" · synced "+(body.selectedRepo||"")+" @ "+String((body.liveIndex&&body.liveIndex.commitSha)||"").slice(0,7))
        :("GitHub: connected as "+(body.accountLogin||"user")+" — select repo and Sync");
    }).catch(function(){
      if(statusEl) statusEl.textContent="GitHub status error";
    });
  }
  refreshGitHubStatus();
  var SEED={
    workspace:"eng-platform",
    activeRepo:"payments-api",
    repos:{
      "payments-api":{stack:"Go, Postgres", branch:"main", commit:"c0ffee1", access:"demo_disconnected", analysis:"configured"},
      "catalog-service":{stack:"TypeScript, Redis", branch:"release", commit:"bada55e", access:"demo_simulated", analysis:"configured"}
    },
    analysis:{
      "payments-api":{id:"A-1", state:"COMPLETED", current:true, at:"demo-clock", failed:false, partial:false, stale:false},
      "catalog-service":{id:"A-2", state:"PARTIAL", current:false, at:"demo-clock-2", failed:false, partial:true, stale:true}
    },
    findings:${findingsJson},
    remediations:${remediationsJson},
    investigations:${investigationsJson},
    architecture:${architectureJson},
    deps:${depsJson},
    evidence:${evidenceJson},
    docs:[
      {repo:"payments-api", title:"Auth runbook", audience:"developer", freshness:"STALE", body:"How JWT is loaded. Stale vs commit c0ffee1."},
      {repo:"payments-api", title:"Operator FAQ", audience:"user", freshness:"CURRENT", body:"How to rotate keys in demo ops."},
      {repo:"catalog-service", title:"Catalog API", audience:"developer", freshness:"CURRENT", body:"List/search catalog resources."}
    ],
    history:[
      {repo:"payments-api", run:"A-1", commit:"c0ffee1", state:"COMPLETED", resolved:1, reopened:0, notes:"Clean complete demo run"},
      {repo:"payments-api", run:"A-0", commit:"aaa111", state:"FAILED", resolved:0, reopened:0, notes:"Failed — do not treat as clean scores"},
      {repo:"catalog-service", run:"A-2", commit:"bada55e", state:"PARTIAL", resolved:0, reopened:1, notes:"Partial analyzers only"}
    ],
    notifications:[],
    conversations:[],
    preferences:{retentionDays:30, notifyFindings:true, reminders:true, auditTrail:true},
    adminMembers:[
      {name:"Alex Chen", email:"alex@eng-platform.demo", role:"Architect", status:"Active"},
      {name:"Sam Rivera", email:"sam@eng-platform.demo", role:"Admin", status:"Active"},
      {name:"Jordan Lee", email:"jordan@eng-platform.demo", role:"Security Analyst", status:"Active"}
    ],
    adminRoles:["Admin","Architect","Security Analyst","Engineering Manager","Developer","Staff Engineer","Technical Lead","Security Engineer","Reviewer","Viewer"],
    contacts:[
      {id:"C-1", name:"Alex Chen", email:"alex@eng-platform.demo", role:"Architect", team:"Platform"},
      {id:"C-2", name:"Sam Rivera", email:"sam@eng-platform.demo", role:"Admin", team:"Workspace"},
      {id:"C-3", name:"Jordan Lee", email:"jordan@eng-platform.demo", role:"Security Analyst", team:"Security"}
    ],
    supportTickets:[
      {id:"T-1", at:"demo-clock", subject:"How to seal Phase 12 recovery", category:"Governance / approvals", status:"Open"}
    ],
    profiles:${profilesJson}
  };
  function boot(){
    if(!read("workspace", null)){
      write("workspace", SEED.workspace);
      write("activeRepo", SEED.activeRepo);
      write("repos", SEED.repos);
      write("analysis", SEED.analysis);
      write("findings", SEED.findings);
      write("remediations", SEED.remediations);
      write("investigations", SEED.investigations);
      write("architecture", SEED.architecture);
      write("deps", SEED.deps);
      write("docs", SEED.docs);
      write("history", SEED.history);
      write("notifications", []);
    write("conversations", []);
      write("preferences", SEED.preferences);
      write("profiles", SEED.profiles);
      write("evidence", SEED.evidence);
      write("adminMembers", SEED.adminMembers);
      write("adminRoles", SEED.adminRoles);
      write("contacts", SEED.contacts);
      write("supportTickets", SEED.supportTickets);
      write("integrationIngress", []);
      write("integrationEgress", []);
      write("engine", ENGINE);
      write("audit", []);
    } else if(read("engine", "")!==ENGINE){
      write("profiles", SEED.profiles);
      write("findings", SEED.findings);
      write("deps", SEED.deps);
      write("evidence", SEED.evidence);
      write("investigations", SEED.investigations);
      write("remediations", SEED.remediations);
      write("architecture", SEED.architecture);
      if(!read("adminMembers", null)) write("adminMembers", SEED.adminMembers);
      if(!read("adminRoles", null)) write("adminRoles", SEED.adminRoles);
      if(!read("contacts", null)) write("contacts", SEED.contacts);
      if(!read("supportTickets", null)) write("supportTickets", SEED.supportTickets);
      write("engine", ENGINE);
    }
    if(!read("adminMembers", null)) write("adminMembers", SEED.adminMembers);
    if(!read("adminRoles", null)) write("adminRoles", SEED.adminRoles);
    if(!read("contacts", null)) write("contacts", SEED.contacts);
    if(!read("supportTickets", null)) write("supportTickets", SEED.supportTickets);
    write("engine", ENGINE);
  }
  function repo(){ return read("activeRepo", "payments-api"); }
  function findings(){
    return read("findings", []).filter(function(f){ return f.repo===repo(); }).map(function(f){
      return normalizeFindingRow(f, f.repo);
    });
  }
  function isLiveRepo(name){
    var meta=(read("repos", {})[name||repo()])||{};
    return meta.access==="github_live" || meta.analysis==="synced" || meta.analysis==="live" || !!meta.live;
  }
  function syncRepoSelectOptions(){
    var repos=read("repos", {})||{};
    var keys=Object.keys(repos);
    if(!keys.length) keys=["payments-api","catalog-service"];
    var active=repo();
    if(keys.indexOf(active)===-1) keys=keys.concat([active]);
    document.querySelectorAll("[data-cint-repo-select]").forEach(function(sel){
      var html=keys.map(function(id){
        return "<option value=\\""+id+"\\">"+id+"</option>";
      }).join("");
      sel.innerHTML=html;
      sel.value=active;
    });
  }
  function applyLiveTrustChrome(live){
    document.querySelectorAll("[data-cint-trust=\\"mode\\"],[data-cint-trust='mode']").forEach(function(el){
      el.textContent=live?"Live workspace":"Demo workspace";
    });
    document.querySelectorAll("[data-cint-freshness]").forEach(function(el){
      el.textContent=live?"Freshness: live sync":"Freshness: seeded demo";
    });
    document.querySelectorAll("[data-cint-source]").forEach(function(el){
      el.textContent=live?"Evidence: live analysis":"Evidence: illustrative snapshot";
    });
    document.querySelectorAll("[data-cint-demo=\\"1\\"],[data-cint-demo='1']").forEach(function(el){
      el.textContent=live
        ?"Live GitHub sync/analysis for the selected repository. Findings filter by active repo."
        :"Illustrative demo data. Changing repository updates lists and links in this workspace. No live GitHub, CVE feed, pull request, or model investigation.";
    });
  }
  function applySyncedRepositoryToWorkspace(body, fallbackName){
    var syncedName=(body&&body.repository)||fallbackName||"";
    if(!syncedName) return syncedName;
    var selfMode=body&&(body.mode==="self_load"||body.mode==="publish_github");
    var provenance=body&&body.mode==="self_load"?"cint_product_self":(body&&body.mode==="publish_github"?"cint_product_github":"github_sync");
    var reposM=read("repos", {});
    reposM[syncedName]={
      stack:selfMode?"cint_product":"github_read",
      branch:body.defaultBranch||(body&&body.mode==="self_load"?"product":"main"),
      commit:(body.commitSha||"").slice(0,7),
      access:body&&body.mode==="self_load"?"cint_product_self":"github_live",
      analysis:"synced",
      fileCount:body.fileCount||0
    };
    write("repos", reposM);
    write("activeRepo", syncedName);
    syncRepoSelectOptions();
    applyLiveTrustChrome(true);
    var profiles=read("profiles", {});
    profiles[syncedName]={
      profile:{id:syncedName,fileCount:body.fileCount||0,provenance:provenance,branch:body.defaultBranch||"main",commitSha:body.commitSha||null},
      tech:{frontend:[],backend:[],database:[],cloud:[],infrastructure:[],provenance:provenance,note:"Tree synced — run Analyze for full tech profile"},
      dependencies:{edges:[]}
    };
    write("profiles", profiles);
    return syncedName;
  }
  function runGithubConnectAction(form, action){
    action=String(action||"connect").toLowerCase();
    if(action!=="connect"&&action!=="repos"&&action!=="sync"&&action!=="publish-product"&&action!=="load-self") action="connect";
    var statusEl=(form&&form.querySelector&&form.querySelector("[data-cint-github-status]"))||document.querySelector("[data-cint-github-status]");
    var repoInput=(form&&form.querySelector&&(form.querySelector('[name="repository"]')||form.querySelector("[data-cint-github-repo]")))||document.querySelector("[data-cint-github-repo]");
    try{ if(form){ form.setAttribute("onsubmit","return false;"); form.setAttribute("action","#"); } }catch(e){}
    try{ if(hasSession()){ setAuthed(true); showView("repositories"); } }catch(e2){}
    if(action==="load-self"){
      if(statusEl) statusEl.textContent="Loading CINT product pack (self)…";
      note("Loading standalone CINT product source into workspace…");
      fetch(cintPath("github/publish-product"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mode:"self_load"})})
        .then(function(r){ return r.json().then(function(body){ return {http:r.status,body:body}; }); })
        .then(function(res){
          var body=res.body||{};
          if(!body||!body.ok){
            var err=(body&&(body.error||body.detail))||("Load CINT product failed ("+res.http+")");
            if(statusEl) statusEl.textContent=err;
            note(err);
            return;
          }
          var loaded=applySyncedRepositoryToWorkspace(body, body.repository||"code-intelligence");
          if(repoInput) repoInput.value=loaded||"code-intelligence";
          if(statusEl) statusEl.textContent="CINT product loaded ("+(body.fileCount||0)+" files) — run Analyze";
          note("CINT product self-loaded: "+(loaded||"code-intelligence")+" ("+(body.fileCount||0)+" files)");
          audit("cint product self-load "+(loaded||""));
          try{ if(hasSession()) showView("repositories"); }catch(eSelf){}
          if(typeof paint==="function") paint();
        }).catch(function(err){
          var msg="Load CINT product network error"+(err&&err.message?(": "+err.message):"");
          if(statusEl) statusEl.textContent=msg;
          note(msg);
        });
      return;
    }
    if(action==="publish-product"){
      if(statusEl) statusEl.textContent="Publishing CINT product repo to GitHub…";
      note("Publishing standalone CINT product pack to GitHub…");
      var wantedRepo=((repoInput&&repoInput.value)||"").trim();
      var publishBody={mode:"publish_github"};
      if(wantedRepo&&wantedRepo!=="owner/repo") publishBody.repoName=wantedRepo;
      fetch(cintPath("github/publish-product"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(publishBody)})
        .then(function(r){ return r.json().then(function(body){ return {http:r.status,body:body}; }); })
        .then(function(res){
          var body=res.body||{};
          if(!body||!body.ok){
            var err=(body&&(body.error||body.detail||body.code))||("Publish CINT product failed ("+res.http+")");
            if(statusEl) statusEl.textContent=err;
            note(err);
            return;
          }
          var published=applySyncedRepositoryToWorkspace(body, body.repository);
          if(repoInput&&published) repoInput.value=published;
          if(statusEl) statusEl.textContent="Published "+(published||"")+" ("+(body.fileCount||0)+" files) — Sync/Analyze ready";
          note("CINT product published: "+(published||"")+(body.htmlUrl?" → "+body.htmlUrl:""));
          audit("cint product publish "+(published||""));
          refreshGitHubStatus();
          try{ if(hasSession()) showView("repositories"); }catch(ePub){}
          if(typeof paint==="function") paint();
        }).catch(function(err){
          var msg="Publish CINT product network error"+(err&&err.message?(": "+err.message):"");
          if(statusEl) statusEl.textContent=msg;
          note(msg);
        });
      return;
    }
    if(action==="connect"){
      if(statusEl) statusEl.textContent="Connecting to GitHub…";
      note("Starting GitHub OAuth for project "+syncProjectId()+"…");
      fetch(cintPath("github/connect"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({returnPath:hostReturnPath()})})
        .then(function(r){ return r.json().then(function(body){ return {http:r.status,body:body}; }); })
        .then(function(res){
          var body=res.body||{};
          if(body&&body.redirectUrl){
            if(statusEl) statusEl.textContent="Redirecting to GitHub…";
            var url=body.redirectUrl;
            var navigated=false;
            try{ if(window.open(url,"_top")) navigated=true; }catch(eOpen){}
            if(!navigated){
              try{
                var a=document.createElement("a");
                a.href=url; a.target="_top"; a.rel="noopener noreferrer";
                document.body.appendChild(a); a.click(); a.remove();
                navigated=true;
              }catch(eA){}
            }
            if(!navigated){
              try{ window.top.location.assign(url); navigated=true; }catch(eTop){}
            }
            if(!navigated){
              if(statusEl) statusEl.textContent="Open Deploy / break out of Live preview, then Connect again";
              note("GitHub OAuth blocked inside Live preview iframe. Use Open Deploy, or open: "+url);
            }
            return;
          }
          var err=(body&&body.error)||("GitHub connect failed ("+res.http+")");
          if(statusEl) statusEl.textContent=err;
          note(err+(syncProjectId()!=="local"?"":" — missing project id on shell"));
        }).catch(function(err){
          var msg="GitHub connect network error"+(err&&err.message?(": "+err.message):"");
          if(statusEl) statusEl.textContent=msg;
          note(msg);
        });
      return;
    }
    if(action==="repos"){
      if(statusEl) statusEl.textContent="Listing GitHub repos…";
      fetch(cintPath("github/repos")).then(function(r){ return r.json(); }).then(function(body){
        if(!body||!body.ok){
          var err=(body&&body.error)||"List repos failed — connect GitHub first";
          if(statusEl) statusEl.textContent=err;
          note(err);
          return;
        }
        var list=body.data||[];
        var names=list.map(function(x){ return x.fullName; }).slice(0,12).join(", ");
        if(statusEl) statusEl.textContent="Repos ("+list.length+"): "+(names||"—");
        // Prefill Sync field with first repo so Sync is one click.
        if(repoInput&&list[0]&&list[0].fullName){
          var cur=(repoInput.value||"").trim();
          if(!cur||cur==="owner/repo") repoInput.value=list[0].fullName;
        }
        note("Loaded "+list.length+" repos");
        try{ if(hasSession()) showView("repositories"); }catch(e3){}
      }).catch(function(){
        if(statusEl) statusEl.textContent="Repos network error";
        note("Repos network error");
      });
      return;
    }
    if(action==="sync"){
      var fullName=((repoInput&&repoInput.value)||"").trim();
      if(!fullName||fullName==="owner/repo"){
        if(statusEl) statusEl.textContent="Enter owner/repo before Sync (or List repos first)";
        note("Enter owner/repo before Sync");
        return;
      }
      if(statusEl) statusEl.textContent="Syncing "+fullName+"…";
      note("Syncing "+fullName+"…");
      fetch(cintPath("github/sync"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fullName:fullName})})
        .then(function(r){ return r.json().then(function(body){ return {http:r.status,body:body}; }); })
        .then(function(res){
          var body=res.body||{};
          if(!body||!body.ok){
            var err=(body&&(body.error||body.detail))||("Sync failed ("+res.http+")");
            if(statusEl) statusEl.textContent=err;
            note(err);
            return;
          }
          var syncedName=body.repository||fullName;
          var reposM=read("repos", {});
          reposM[syncedName]={
            stack:"github_read",
            branch:body.defaultBranch||"main",
            commit:(body.commitSha||"").slice(0,7),
            access:"github_live",
            analysis:"synced",
            fileCount:body.fileCount||0
          };
          write("repos", reposM);
          write("activeRepo", syncedName);
          syncRepoSelectOptions();
          applyLiveTrustChrome(true);
          var profiles=read("profiles", {});
          profiles[syncedName]={
            profile:{id:syncedName,fileCount:body.fileCount||0,provenance:"github_sync",branch:body.defaultBranch||"main",commitSha:body.commitSha||null},
            tech:{frontend:[],backend:[],database:[],cloud:[],infrastructure:[],provenance:"github_sync",note:"Tree synced — run Analyze for full tech profile"},
            dependencies:{edges:[]}
          };
          write("profiles", profiles);
          if(repoInput) repoInput.value=syncedName;
          var msg="Synced "+syncedName+" @ "+(body.commitSha||"").slice(0,7)+" ("+(body.fileCount||0)+" files)";
          if(statusEl) statusEl.textContent=msg;
          note(msg+" — open Overview → Run live analysis");
          audit("github sync "+syncedName);
          refreshGitHubStatus();
          try{ if(hasSession()){ setAuthed(true); showView("repositories"); } }catch(e4){}
          if(typeof paint==="function") paint();
        }).catch(function(err){
          var msg="Sync network error"+(err&&err.message?(": "+err.message):"");
          if(statusEl) statusEl.textContent=msg;
          note(msg);
        });
    }
  }
  function runLiveAnalysis(form, mode){
    mode=mode==="agents"?"agents":"analyze";
    var statusLive=(form&&form.querySelector&&form.querySelector("[data-cint-live-run-status]"))||document.querySelector("[data-cint-live-run-status]");
    var endpoint=mode==="agents"?"agents/run":"analyze";
    var runRepo=repo();
    var startedMs=Date.now();
    var timeoutMs=endpoint==="agents/run"?120000:90000;
    var expectHint=endpoint==="agents/run"
      ?"Typical agents: 5–40s on synced sample (≤400 paths). Hard stop "+(timeoutMs/1000)+"s."
      :"Typical analyze: 2–20s on synced sample (≤400 paths / 24 content files). Hard stop "+(timeoutMs/1000)+"s.";
    var runButtons=form?form.querySelectorAll('button[type="submit"],[data-cint-analysis-run]'):[];
    runButtons.forEach(function(btn){ btn.disabled=true; });
    // Stay on Overview while the request runs — never let a default form nav reboot to Landing.
    try{ if(hasSession()){ setAuthed(true); showView("overview"); } }catch(e){}
    if(window.__cintLiveRunTimer) clearInterval(window.__cintLiveRunTimer);
    function paintRunTick(){
      var sec=Math.round((Date.now()-startedMs)/1000);
      if(statusLive){
        statusLive.textContent="Running live "+endpoint+" on "+runRepo+"… "+sec+"s elapsed. "+expectHint;
      }
    }
    paintRunTick();
    window.__cintLiveRunTimer=setInterval(paintRunTick, 1000);
    note("Live "+endpoint+" started on "+runRepo);
    var controller=typeof AbortController!=="undefined"?new AbortController():null;
    var abortTimer=controller?setTimeout(function(){ try{ controller.abort(); }catch(e){} }, timeoutMs):null;
    fetch(cintPath(endpoint),{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({repository:runRepo,persist:true}),
      signal:controller?controller.signal:undefined
    }).then(function(r){ return r.json().then(function(body){ return {http:r.status,body:body}; }); }).then(function(res){
      if(window.__cintLiveRunTimer){ clearInterval(window.__cintLiveRunTimer); window.__cintLiveRunTimer=null; }
      if(abortTimer) clearTimeout(abortTimer);
      runButtons.forEach(function(btn){ btn.disabled=false; });
      var body=res.body||{};
      var elapsed=Date.now()-startedMs;
      if(!body||!body.ok){
        var err=(body&&body.error)||("Live run failed ("+res.http+") — sync GitHub repo first");
        if(statusLive) statusLive.textContent=err+" · "+elapsed+"ms";
        note(err);
        try{ if(hasSession()) showView("overview"); }catch(e2){}
        return;
      }
      var counts=body.counts||{};
      var findingN=(counts.findings!=null?counts.findings:(body.analysis&&body.analysis.findings&&body.analysis.findings.length)||(body.result&&body.result.findings&&body.result.findings.length)||0);
      ingestLiveAnalysisResult(body);
      var an=read("analysis", {});
      an[body.repository||runRepo]={
        id:body.runId||("A-"+Date.now()),
        state:body.state||"COMPLETED",
        current:true,
        at:new Date().toISOString(),
        failed:false,
        partial:false,
        stale:false,
        live:true,
        commitSha:body.commitSha||null,
        fileCount:body.fileCount||0,
        findings:findingN,
        mode:body.mode||"analyze",
        durationMs:body.durationMs||elapsed
      };
      write("analysis", an);
      if(body.agents){
        write("agentRuns", {at:new Date().toISOString(), repository:body.repository, agents:body.agents, mode:body.mode});
      }
      var serverMs=body.durationMs!=null?body.durationMs:elapsed;
      var msg="DONE "+(body.mode||endpoint)+": "+findingN+" findings · "+(body.fileCount||0)+" files · server "+serverMs+"ms · wall "+elapsed+"ms — open Findings (FI)";
      if(body.persistQueued) msg += " · store persist queued";
      if(body.persistError) msg += " · store warn: "+String(body.persistError).slice(0,120);
      if(statusLive) statusLive.textContent=msg;
      note(msg);
      audit("live "+endpoint+" "+(body.repository||runRepo));
      try{ if(hasSession()){ setAuthed(true); showView("overview"); } }catch(e3){}
      if(typeof paint==="function") paint();
      setTimeout(function(){ hydrateFromApi(); }, 400);
    }).catch(function(err){
      if(window.__cintLiveRunTimer){ clearInterval(window.__cintLiveRunTimer); window.__cintLiveRunTimer=null; }
      if(abortTimer) clearTimeout(abortTimer);
      runButtons.forEach(function(btn){ btn.disabled=false; });
      var elapsed=Date.now()-startedMs;
      var aborted=err && (err.name==="AbortError" || /abort/i.test(String(err.message||err)));
      var msg=aborted
        ?("Timed out after "+elapsed+"ms (limit "+timeoutMs+"ms). Server may still be working — retry Analyze, or check terminal/network.")
        :("Network/error on live run after "+elapsed+"ms"+(err&&err.message?(": "+err.message):""));
      if(statusLive) statusLive.textContent=msg;
      note(msg);
      try{ if(hasSession()) showView("overview"); }catch(e4){}
    });
  }
  function ingestLiveAnalysisResult(body){
    var repository=body.repository||repo();
    var result=(body.result&&typeof body.result==="object")?body.result:((body.analysis&&typeof body.analysis==="object")?body.analysis:{});
    write("activeRepo", repository);
    var reposM=read("repos", {});
    if(!reposM[repository]){
      reposM[repository]={stack:"github_read",branch:body.defaultBranch||"main",commit:(body.commitSha||"").slice(0,7),access:"github_live",analysis:"live",live:true};
    } else {
      reposM[repository].analysis="live";
      reposM[repository].live=true;
      if(body.commitSha) reposM[repository].commit=String(body.commitSha).slice(0,7);
      if(body.defaultBranch) reposM[repository].branch=body.defaultBranch;
    }
    write("repos", reposM);
    var findingSrc=result.findings||[];
    var evidenceSrc=result.evidence||[];
    var invSrc=result.investigations||[];
    var remSrc=result.remediations||[];
    if(findingSrc.length){
      var mapped=findingSrc.map(function(f){
        var row=normalizeFindingRow(f, repository);
        row.lifecycle="DETECTED";
        return row;
      });
      var kept=read("findings", []).filter(function(f){ return f.repo!==repository; });
      write("findings", kept.concat(mapped));
    }
    if(evidenceSrc.length){
      var mappedEv=evidenceSrc.map(function(e){
        return {id:e.id,findingId:e.findingId,repo:repository,repositoryId:repository,slot:e.slot||e.traceRef||"code",kind:e.kind||e.source||"snippet",location:e.location||"",summary:e.summary||"",snippet:e.snippet||""};
      });
      var keptEv=read("evidence", []).filter(function(e){ return e.repo!==repository && e.repositoryId!==repository; });
      write("evidence", keptEv.concat(mappedEv));
    }
    if(invSrc.length){
      var mappedInv=invSrc.map(function(x){
        return {id:x.id,repo:repository,findingId:x.findingId,question:x.question||x.hypothesis||"",state:x.state||x.status||"OPEN",evidenceIds:x.evidenceIds||[],hypotheses:x.hypotheses||[],analysis:x.analysis||"",conclusion:x.conclusion||""};
      });
      var keptInv=read("investigations", []).filter(function(x){ return x.repo!==repository; });
      write("investigations", keptInv.concat(mappedInv));
    }
    if(remSrc.length){
      var mappedRem=remSrc.map(function(r){
        return {id:r.id,repo:repository,findingId:r.findingId,title:r.proposal||r.title||r.id,status:r.status||"PROPOSED",impact:r.risk||r.impact||"",tests:r.tests||"—",diff:r.diff||"",rationale:r.rationale||""};
      });
      var keptRem=read("remediations", []).filter(function(r){ return r.repo!==repository; });
      write("remediations", keptRem.concat(mappedRem));
    }
    /* Live Analyze must refresh Profiles / Deps / Architecture — not leave demo seed. */
    var profiles=read("profiles", {});
    var depGraph=result.dependencies||{};
    var depEdges=Array.isArray(depGraph.edges)?depGraph.edges:[];
    var depNodes=Array.isArray(depGraph.nodes)?depGraph.nodes:[];
    profiles[repository]={
      profile:result.profile||{id:repository,fileCount:body.fileCount||0,provenance:"github_live",branch:body.defaultBranch||"main",commitSha:body.commitSha||null},
      tech:result.tech||{frontend:[],backend:[],database:[],cloud:[],infrastructure:[],provenance:"github_live"},
      dependencies:{edges:depEdges,nodes:depNodes,cycles:depGraph.cycles||[],provenance:depGraph.provenance||"deterministic_scan"}
    };
    write("profiles", profiles);
    var depsKept=read("deps", []).filter(function(d){ return d.repo!==repository; });
    var depsLive=depNodes.map(function(n){
      return {repo:repository,name:n.name,kind:n.relation||"direct",version:n.version||"—",advisory:"none (deterministic graph — not a CVE)",license:"unknown",upgrade:"—"};
    });
    write("deps", depsKept.concat(depsLive));
    if(result.architecture&&typeof result.architecture==="object"){
      var archAll=read("architecture", {});
      archAll[repository]={
        nodes:result.architecture.nodes||[],
        edges:result.architecture.edges||[],
        decisions:result.architecture.decisions||[],
        knowledge:result.architecture.knowledge||[],
        intendedVsObserved:result.architecture.intendedVsObserved||[],
        provenance:result.architecture.provenance||"deterministic_scan"
      };
      write("architecture", archAll);
    }
    var runId=body.runId||("A-"+Date.now().toString(36));
    var findingN=findingSrc.length;
    var hist=read("history", []).filter(function(h){ return !(h.repo===repository && h.run===runId); });
    hist.unshift({
      repo:repository,
      run:runId,
      commit:(body.commitSha||"").slice(0,7)||"—",
      state:body.state||"COMPLETED",
      resolved:0,
      reopened:0,
      notes:"Live "+(body.mode||"analyze")+" · "+findingN+" findings · "+(body.fileCount||0)+" files"
    });
    write("history", hist.slice(0,40));
    /* Phase E KIL — store classified catalog + relationships for Documentation Knowledge UI. */
    var kilPayload=result.kil||body.kil||null;
    if(kilPayload&&typeof kilPayload==="object"){
      var kilAll=read("kil", {});
      kilAll[repository]=kilPayload;
      write("kil", kilAll);
    }
    syncRepoSelectOptions();
    applyLiveTrustChrome(true);
  }
  function note(title){
    var n=read("notifications", []);
    n.unshift({id:"N-"+Date.now(), title:title, at:new Date().toISOString()});
    write("notifications", n);
    try{
      document.querySelectorAll("[data-cint-notes-list]").forEach(function(el){
        el.innerHTML=n.slice(0,8).map(function(x){ return "<p><strong>"+x.title+"</strong> <span class=\\"cint-chip\\">"+x.at+"</span></p>"; }).join("")||"<p>No notifications.</p>";
      });
      document.querySelectorAll("[data-cint-notes]").forEach(function(el){ el.hidden=false; el.removeAttribute("hidden"); });
      document.querySelectorAll("[data-cint-ihs-log]").forEach(function(el){ el.textContent=title; });
    }catch(e){}
  }
  function triggerBlobDownload(blob, filename){
    var url=URL.createObjectURL(blob);
    var a=document.createElement("a");
    a.href=url;
    a.download=filename;
    a.rel="noopener";
    a.style.display="none";
    document.body.appendChild(a);
    a.click();
    setTimeout(function(){
      try{ URL.revokeObjectURL(url); }catch(e){}
      try{ a.parentNode && a.parentNode.removeChild(a); }catch(e2){}
    }, 1500);
  }
  /** Prefer host-frame download so large exports use the browser download UI (srcdoc fetch feels "stuck"). */
  function triggerHostDownload(url, filename){
    try{
      var topWin=window.top;
      var topDoc=topWin && topWin.document;
      if(!topDoc) return false;
      var a=topDoc.createElement("a");
      a.href=url;
      a.setAttribute("download", filename);
      a.rel="noopener";
      a.style.display="none";
      topDoc.body.appendChild(a);
      a.click();
      setTimeout(function(){ try{ a.parentNode && a.parentNode.removeChild(a); }catch(e){} }, 1500);
      return true;
    }catch(e){ return false; }
  }
  function audit(msg){
    var a=read("audit", []);
    a.unshift({at:"demo-clock", msg:msg, repo:repo()});
    write("audit", a);
  }
  function badge(kind, value){ return '<span class="cint-chip" data-cint-badge="'+kind+'">'+value+"</span>"; }
  function findingButton(f){
    return '<button type="button" class="app-btn" data-cint-open-finding="'+f.id+'">'+f.id+"</button>";
  }
  var TOGGLE_ICON='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/></svg>';
  var BRAND_MARK='<svg class="cint-brand-mark" width="28" height="28" viewBox="0 0 32 32" role="img" aria-label="Code Intelligence"><rect width="32" height="32" rx="8" fill="#2563EB"/><path fill="none" stroke="#F8FAFC" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M12 9 L7 16 L12 23 M20 9 L25 16 L20 23"/><path fill="none" stroke="#F8FAFC" stroke-width="2.4" stroke-linecap="round" d="M17.2 10 L14.8 22"/></svg>';
  function applySidebarMode(next){
    document.querySelectorAll("[data-cint-app-shell]").forEach(function(el){
      el.setAttribute("data-cint-sidebar", next);
    });
    document.querySelectorAll("[data-cint-sidebar-toggle]").forEach(function(tog){
      tog.setAttribute("aria-expanded", next==="collapsed"?"false":"true");
      if(!String(tog.innerHTML||"").trim()) tog.innerHTML=TOGGLE_ICON;
    });
    document.querySelectorAll(".app-sidebar[data-cint-rail] .cint-nav-abbr").forEach(function(el){
      if(next==="collapsed") el.removeAttribute("hidden");
      else el.setAttribute("hidden","");
    });
    try{ localStorage.setItem("cint.sidebar.v1", next); }catch(e){}
  }
  function ensureTopbar(shell){
    var bar=shell.querySelector(":scope > [data-cint-topbar]");
    var TOPBAR_HTML='<div class="cint-topbar-left" data-cint-topbar-left><button type="button" class="cint-sidebar-toggle" data-cint-sidebar-toggle aria-expanded="true" aria-label="Toggle sidebar" title="Toggle sidebar">'+TOGGLE_ICON+'</button><div class="cint-topbar-brand"><strong class="cint-topbar-title">Code Intelligence</strong><span class="cint-topbar-kicker">WORKSPACE</span></div></div><span class="cint-topbar-sep" data-cint-topbar-sep aria-hidden="true"></span><div class="cint-topbar-right" data-cint-topbar-right><span class="cint-topbar-chip" data-cint-trust="mode">Demo workspace</span><span class="cint-topbar-chip" data-cint-session-chip title="Session">Signed out</span><strong class="cint-topbar-workspace" data-cint-workspace>eng-platform</strong><button type="button" class="app-btn cint-topbar-btn" data-cint-open-notes>Notifications</button><button type="button" class="app-btn cint-topbar-btn" data-cint-open-assistant>Ask Assistant</button><button type="button" class="app-btn cint-topbar-btn" data-cint-signout>Sign out</button></div>';
    if(!bar){
      try{
        bar=document.createElement("header");
        bar.className="cint-topbar";
        bar.setAttribute("data-cint-topbar","1");
        bar.innerHTML=TOPBAR_HTML;
        // Topband is always the first shell child (rail + main follow).
        shell.insertBefore(bar, shell.firstElementChild);
      }catch(e){ return null; }
    } else if(!bar.querySelector("[data-cint-topbar-sep]") || !bar.querySelector("[data-cint-topbar-right]")){
      try{ bar.innerHTML=TOPBAR_HTML; }catch(e){}
    }
    try{
      if(bar.parentNode===shell && shell.firstElementChild!==bar) shell.insertBefore(bar, shell.firstElementChild);
    }catch(e){}
    var tog=bar.querySelector("[data-cint-sidebar-toggle]");
    if(tog && !String(tog.innerHTML||"").trim()) tog.innerHTML=TOGGLE_ICON;
    return bar;
  }
  /* GP-CI-05: HTML rail owner is healCodeIntelligencePreviewHtml; ensureRail is fallback only.
     data-cint-rail-on stamps a REAL visible column — never 2-col from :has(rail) while display:none.
     Toggle lives on data-cint-topbar (Replica-style band), not inside the rail. */
  function ensureRail(){
    var shell=productShell();
    if(!shell) return null;
    var zoneOn=shell.getAttribute("data-cint-zone")==="workspace"||shell.getAttribute("data-cint-authed")==="1";
    var topbar=ensureTopbar(shell);
    var rail=shell.querySelector(":scope > .app-sidebar[data-cint-rail], :scope > .app-sidebar");
    if(!rail){
      try{
        rail=document.createElement("aside");
        rail.className="app-sidebar";
        rail.setAttribute("data-cint-rail","1");
        rail.setAttribute("data-layout-role","sidebar");
        rail.setAttribute("aria-label","Code Intelligence");
        rail.innerHTML='<div class="app-sidebar-brand">'+BRAND_MARK+'<div class="app-sidebar-brand-text"><p class="app-sidebar-brand-title">Code Intelligence</p><p class="app-sidebar-brand-kicker">Workspace</p></div></div><nav class="app-sidebar-nav" aria-label="Workspace"><a href="#overview" class="app-sidebar-link" data-view-nav="overview" data-cint-route="overview"><span class="cint-nav-full">Overview</span><span class="cint-nav-abbr" hidden>OV</span></a><a href="#repositories" class="app-sidebar-link" data-view-nav="repositories" data-cint-route="repositories"><span class="cint-nav-full">Repositories</span><span class="cint-nav-abbr" hidden>RE</span></a><a href="#findings" class="app-sidebar-link" data-view-nav="findings" data-cint-route="findings"><span class="cint-nav-full">Findings</span><span class="cint-nav-abbr" hidden>FI</span></a><a href="#settings" class="app-sidebar-link" data-view-nav="settings" data-cint-route="settings"><span class="cint-nav-full">Settings</span><span class="cint-nav-abbr" hidden>SE</span></a></nav>';
        var after=topbar && topbar.parentNode===shell ? topbar.nextSibling : shell.firstElementChild;
        shell.insertBefore(rail, after);
      }catch(e){ return null; }
    } else {
      try{
        var railTogs=rail.querySelectorAll("[data-cint-sidebar-toggle]");
        for(var i=0;i<railTogs.length;i++){ railTogs[i].parentNode && railTogs[i].parentNode.removeChild(railTogs[i]); }
        var anchor=topbar && topbar.parentNode===shell ? topbar.nextSibling : shell.firstElementChild;
        if(rail!==anchor) shell.insertBefore(rail, anchor);
      }catch(e){}
    }
    try{
      rail.style.removeProperty("display");
      rail.style.removeProperty("visibility");
      if(topbar){
        topbar.style.removeProperty("display");
        topbar.style.removeProperty("visibility");
      }
      if(!zoneOn){
        shell.removeAttribute("data-cint-rail-on");
        rail.setAttribute("hidden","");
        rail.hidden=true;
        if(topbar){ topbar.setAttribute("hidden",""); topbar.hidden=true; }
        return rail;
      }
      shell.setAttribute("data-cint-rail-on","1");
      rail.removeAttribute("hidden");
      rail.hidden=false;
      if(topbar){ topbar.removeAttribute("hidden"); topbar.hidden=false; }
      rail.style.setProperty("display","flex","important");
      rail.style.setProperty("visibility","visible","important");
      rail.style.setProperty("opacity","1","important");
      rail.style.setProperty("flex-direction","column","important");
      rail.style.setProperty("background","#0f1b2d","important");
      rail.style.setProperty("color","#e8eef8","important");
      rail.style.setProperty("z-index","40","important");
      rail.style.setProperty("position","relative","important");
      var brand=rail.querySelector(".app-sidebar-brand");
      if(brand) brand.style.setProperty("flex","0 0 auto","important");
      var nav=rail.querySelector(".app-sidebar-nav");
      if(nav){
        nav.style.setProperty("flex","1 1 auto","important");
        nav.style.setProperty("min-height","0","important");
        nav.style.setProperty("overflow-y","scroll","important");
      }
    }catch(e){}
    return rail;
  }
  function syncShellLayout(){
    var shell=productShell();
    if(!shell) return;
    // Overview (etc.) visible while zone stuck at gateway → black void + missing rail.
    var ws=shell.querySelector('.app-main [data-view]:not([hidden]):not([data-view="landing"]):not([data-view="login"]):not([data-view="signup"]):not([data-view="forgot-password"])');
    if(!ws) return;
    // Zone BEFORE ensureRail — otherwise inline display:none!important sticks and paints an empty grey gutter.
    shell.setAttribute("data-cint-zone","workspace");
    if(hasSession()) shell.setAttribute("data-cint-authed","1");
    ensureRail();
  }
  function paintChrome(){
    syncShellLayout();
    var r=repo();
    var meta=(read("repos", {})[r])||{};
    var an=(read("analysis", {})[r])||{};
    var live=isLiveRepo(r)||!!an.live;
    syncRepoSelectOptions();
    applyLiveTrustChrome(live);
    var sess=readSession();
    document.querySelectorAll("[data-cint-session-chip]").forEach(function(el){
      if(!sess){ el.textContent="Signed out"; el.title="No session"; return; }
      var mode=sess.authMode==="idp"?"IdP":"Demo";
      el.textContent=mode+" · "+(sess.role||"Viewer")+(sess.email?" · "+sess.email:"");
      el.title=(sess.displayName||sess.email||"")+" ("+mode+")";
    });
    document.querySelectorAll("[data-cint-signout]").forEach(function(el){ el.hidden=!sess; });
    // Admin nav — visible to IdP/demo sessions (read-only or Claim). Promote still needs Admin.
    document.querySelectorAll('[data-view-nav="admin"],[data-cint-route="admin"],a[href="#admin"]').forEach(function(el){
      var allow=!!sess&&(sess.role==="Admin"||sess.authMode==="idp"||sess.authMode==="demo");
      el.hidden=!allow;
      if(el.style) el.style.display=allow?"":"none";
    });
    document.querySelectorAll("[data-cint-access]").forEach(function(el){
      var role=(sess&&sess.role)||"Viewer";
      if(role==="Admin") el.textContent="Admin · org.admin, approve_remediation, integrations";
      else if(role==="Architect") el.textContent="Architect · approve_remediation, architecture.review (no org.admin)";
      else if(role==="Security Analyst") el.textContent="Security Analyst · triage / propose (no approve)";
      else el.textContent="Viewer · workspace.read only";
    });
    document.querySelectorAll("[data-cint-workspace]").forEach(function(el){ el.textContent=read("workspace","eng-platform"); });
    document.querySelectorAll("[data-cint-branch]").forEach(function(el){ el.textContent=meta.branch||"—"; });
    document.querySelectorAll("[data-cint-commit]").forEach(function(el){ el.textContent=meta.commit||"—"; });
    document.querySelectorAll("[data-cint-repo-select]").forEach(function(sel){ sel.value=r; });
    var status="Latest run: "+(an.id||"—")+" "+(an.state||"UNKNOWN");
    if(an.failed) status += " · FAILED — scores withheld";
    else if(an.partial) status += " · partial results";
    else if(an.stale) status += " · stale vs commit";
    else if(an.current) status += " · current · "+(an.at||"");
    document.querySelectorAll("[data-cint-analysis-status]").forEach(function(el){ el.textContent=status; });
    document.querySelectorAll("[data-cint-assistant-context]").forEach(function(el){
      el.textContent=(live?"Live context for ":"Demo knowledge for ")+r+" @ "+(meta.commit||"?")+(live?".":". Not a live investigation.");
    });
    document.querySelectorAll("[data-cint-state]").forEach(function(el){ el.hidden=true; });
    if(an.failed){
      document.querySelectorAll('[data-cint-state="failed-run"]').forEach(function(el){ el.hidden=false; });
      document.querySelectorAll("[data-cint-kpi] b").forEach(function(el){ el.textContent="—"; });
    } else if(an.partial){
      document.querySelectorAll('[data-cint-state="partial"]').forEach(function(el){ el.hidden=false; });
    } else if(an.stale){
      document.querySelectorAll('[data-cint-state="stale"]').forEach(function(el){ el.hidden=false; });
    }
    var page=(document.querySelector("[data-cint-page]")||{}).getAttribute && document.querySelector("[data-cint-page]").getAttribute("data-cint-page");
    var visible=document.querySelector(".app-view-panel:not([hidden]),[data-view]:not([hidden])");
    var viewPage=visible && visible.getAttribute("data-view") || page;
    document.querySelectorAll("[data-cint-nav] a, .app-shell[data-cint-app-shell] [data-view-nav]").forEach(function(a){
      var nav=a.getAttribute("data-nav")||a.getAttribute("data-view-nav")||a.getAttribute("data-cint-route");
      var current=nav===viewPage || nav===page || (nav==="overview" && (page==="dashboard"||page==="command-centre"||viewPage==="dashboard"));
      a.setAttribute("aria-current", current ? "page" : "");
      if(nav==="overview" && !document.querySelector("#overview,[data-view='overview']") && document.querySelector("#dashboard,[data-view='dashboard']")){
        a.setAttribute("href","#dashboard");
      }
    });
    document.querySelectorAll(".app-notification-bell,.app-header-utilities,.app-user-menu,.website-sidebar,.saas-workspace-utilities").forEach(function(el){
      el.style.setProperty("display","none","important");
    });
    document.querySelectorAll(".app-sidebar").forEach(function(el){
      if(el.hasAttribute("data-cint-rail") || el.closest("[data-cint-app-shell]")) return;
      el.style.setProperty("display","none","important");
    });
    try{
      var saved=localStorage.getItem("cint.sidebar.v1");
      var mode=saved==="collapsed"?"collapsed":"expanded";
      // Collapsed without abbr labels = empty 3.25rem strip (cramped toggle-only rail).
      if(mode==="collapsed" && !document.querySelector(".app-sidebar[data-cint-rail] .cint-nav-abbr")){
        mode="expanded";
      }
      applySidebarMode(mode);
    }catch(e){}
  }
  function paintFindings(){
    var list=findings();
    var an=(read("analysis", {})[repo()])||{};
    if(an.failed){
      document.querySelectorAll("[data-cint-finding-rows]").forEach(function(tb){
        var panel=tb.closest("[data-view]");
        if(panel && (panel.hidden || panel.getAttribute("hidden")!==null)) return;
        tb.innerHTML="<tr><td colspan=\\"7\\">Withheld — latest analysis failed.</td></tr>";
      });
      return;
    }
    var cat=(document.querySelector("[data-cint-finding-cat]")||{}).value||"all";
    var life=(document.querySelector("[data-cint-finding-life]")||{}).value||"all";
    var q=((document.querySelector("[data-cint-finding-search]")||{}).value||"").toLowerCase();
    var gq=((document.querySelector("[data-cint-global-search]")||{}).value||"").toLowerCase();
    var secCat=(document.querySelector("[data-cint-sec-cat]")||{}).value||"all";
    var secSev=(document.querySelector("[data-cint-sec-sev]")||{}).value||"all";
    function rows(mode){
      var filtered=list.filter(function(f){
        var file=f.file||f.location||"";
        var sev=f.severity||f.sev||"";
        if(mode==="security" && !f.security) return false;
        if(mode==="overview") return true;
        if(mode==="findings"){
          if(cat!=="all" && f.category!==cat) return false;
          if(life!=="all" && f.lifecycle!==life) return false;
          if(q && (f.title+" "+file).toLowerCase().indexOf(q)===-1) return false;
        }
        if(mode==="security"){
          if(secCat!=="all" && f.area!==secCat) return false;
          if(secSev!=="all" && sev!==secSev) return false;
        }
        if(gq && (f.title+" "+file+" "+f.id).toLowerCase().indexOf(gq)===-1) return false;
        return true;
      });
      if(mode==="overview") filtered=filtered.slice(0,4);
      if(!filtered.length){
        return '<tr><td colspan="7">No findings for this repository and filter.</td></tr>';
      }
      return filtered.map(function(f){
        var sev=f.severity||f.sev||"—";
        var file=f.file||f.location||"—";
        if(mode==="security"){
          return "<tr data-status=\\""+f.lifecycle.toLowerCase()+"\\"><td>"+findingButton(f)+"</td><td>"+f.area+"</td><td>"+badge("sev",sev)+"</td><td>"+f.why+"</td><td>"+f.evidence+"</td></tr>";
        }
        if(mode==="overview"){
          return "<tr><td>"+findingButton(f)+"</td><td>"+f.title+"</td><td>"+badge("sev",sev)+"</td><td>"+badge("conf",f.confidence)+"</td><td>"+badge("life",f.lifecycle)+"</td></tr>";
        }
        return "<tr data-status=\\""+f.lifecycle.toLowerCase()+"\\"><td>"+findingButton(f)+"</td><td>"+f.title+"</td><td>"+badge("sev",sev)+"</td><td>"+badge("conf",f.confidence)+"</td><td>"+f.category+"</td><td>"+badge("life",f.lifecycle)+"</td><td>"+file+"</td></tr>";
      }).join("") || '<tr><td colspan="7">No findings for this repository.</td></tr>';
    }
    // Only paint tables in visible panels — hidden chrome copies × live findings = thousands of buttons and a frozen UI.
    document.querySelectorAll("[data-cint-finding-rows]").forEach(function(tb){
      var panel=tb.closest("[data-view]");
      if(panel && (panel.hidden || panel.getAttribute("hidden")!==null)) return;
      tb.innerHTML=rows(tb.getAttribute("data-cint-finding-rows")||"findings");
    });
    var pageEl=document.querySelector(".app-main [data-view]:not([hidden]) [data-cint-page], .app-main [data-view]:not([hidden])");
    var page=pageEl && (pageEl.getAttribute("data-cint-page")||pageEl.getAttribute("data-view"));
    var activeTb=document.querySelector('.app-main [data-view]:not([hidden]) [data-cint-finding-rows="'+(page==="security"?"security":page==="overview"?"overview":"findings")+'"]');
    if(activeTb && /No findings/.test(activeTb.textContent||"")){
      var anEmpty=(read("analysis", {})[repo()])||{};
      var syncedEmpty=isLiveRepo(repo());
      document.querySelectorAll('[data-cint-state="empty"]').forEach(function(el){
        el.hidden=false;
        if(syncedEmpty && !anEmpty.live && !anEmpty.id){
          el.textContent="Synced — no analysis yet. On Overview click Run live analysis, then return to Findings.";
        } else if(syncedEmpty && anEmpty.live && !list.length){
          el.textContent="Live analysis returned no findings for this repository and commit.";
        } else {
          el.textContent="No records for this repository and commit.";
        }
      });
    }
    var statusHint=document.querySelector("[data-cint-live-run-status]");
    if(statusHint && isLiveRepo(repo())){
      var anHint=(read("analysis", {})[repo()])||{};
      if(!anHint.live && !anHint.id && !/Running live|Live analyze|Live agents|findings ·/.test(statusHint.textContent||"")){
        statusHint.textContent="Ready: "+repo()+" @ "+(((read("repos", {})[repo()])||{}).commit||"?")+" — click Run live analysis";
      }
    }
    var sec=list.filter(function(f){ return f.security; });
    var s1=sec.filter(function(f){ return (f.severity||f.sev)==="SEV-1" && f.lifecycle!=="RESOLVED"; }).length;
    var s2=sec.filter(function(f){ return (f.severity||f.sev)==="SEV-2" && f.lifecycle!=="RESOLVED"; }).length;
    var openN=list.filter(function(f){ return f.lifecycle!=="RESOLVED"; }).length;
    var qN=list.filter(function(f){ return f.quality && f.lifecycle!=="RESOLVED"; }).length;
    var depN=read("deps", []).filter(function(d){ return d.repo===repo(); }).length;
    var archSnap=(read("architecture", {})[repo()])||null;
    var archN=archSnap&&archSnap.nodes?archSnap.nodes.length:0;
    var live=!!((read("repos", {})[repo()]||{}).live||(read("analysis", {})[repo()]||{}).live);
    document.querySelectorAll('[data-cint-kpi="s1"] b').forEach(function(el){ el.textContent=String(s1); });
    document.querySelectorAll('[data-cint-kpi="s2"] b').forEach(function(el){ el.textContent=String(s2); });
    document.querySelectorAll('[data-cint-kpi="security"] b').forEach(function(el){
      el.textContent=s1?"SEV-1 open":(sec.length?(sec.length+" open"):(live?"Clear":"Clear (demo)"));
    });
    document.querySelectorAll('[data-cint-kpi="health"] b').forEach(function(el){
      el.textContent=live?(openN? (openN+" open findings"):"Healthy"):"Watch";
    });
    document.querySelectorAll('[data-cint-kpi="deps"] b').forEach(function(el){
      el.textContent=live?(depN? (depN+" packages"):"No manifests"):"1 demo advisory";
    });
    document.querySelectorAll('[data-cint-kpi="quality"] b').forEach(function(el){
      el.textContent=live?String(qN):"64";
    });
    document.querySelectorAll('[data-cint-kpi="arch"] b').forEach(function(el){
      el.textContent=live?(archN? (archN+" modules"):"No snapshot"):"Drift in billing";
    });
  }
  function paintRest(){
    var r=repo();
    var repos=read("repos", {});
    var repoHtml=Object.keys(repos).map(function(id){
      var m=repos[id];
      return "<tr><td><button type=\\"button\\" class=\\"app-btn\\" data-cint-pick-repo=\\""+id+"\\">"+id+"</button></td><td>"+m.stack+"</td><td>"+m.branch+"</td><td>"+m.commit+"</td><td>"+m.access+"</td><td>"+m.analysis+"</td></tr>";
    }).join("");
    document.querySelectorAll("[data-cint-repo-rows]").forEach(function(el){ el.innerHTML=repoHtml; });
    var prof=(read("profiles", {})[r])||null;
    document.querySelectorAll("[data-cint-repo-profile]").forEach(function(el){
      el.textContent=prof? JSON.stringify(prof.profile, null, 2): "No repository profile.";
    });
    document.querySelectorAll("[data-cint-tech-profile]").forEach(function(el){
      el.textContent=prof? JSON.stringify(prof.tech, null, 2): "No tech profile.";
    });
    document.querySelectorAll("[data-cint-dep-graph]").forEach(function(el){
      el.textContent=prof&&prof.dependencies? prof.dependencies.edges.map(function(e){ return e.from+" -"+e.type+"("+(e.relation||"direct")+")-> "+e.to; }).join("\\n"): "No dependency graph.";
    });
    var rem=read("remediations", []).filter(function(x){ return x.repo===r; });
    document.querySelectorAll("[data-cint-remediation-rows]").forEach(function(el){
      el.innerHTML=rem.map(function(x){ return "<tr><td><button type=\\"button\\" class=\\"app-btn\\" data-cint-open-remediation=\\""+x.id+"\\">"+x.id+"</button> "+x.title+"</td><td><button type=\\"button\\" class=\\"app-btn\\" data-cint-open-finding=\\""+x.findingId+"\\">"+x.findingId+"</button></td><td>"+x.impact+"</td><td>"+x.tests+"</td><td>"+x.status+"</td></tr>"; }).join("")||"<tr><td colspan=5>No proposed fixes.</td></tr>";
    });
    document.querySelectorAll("[data-cint-diff]").forEach(function(el){ el.textContent=(rem[0]&&rem[0].diff)||"Select a plan"; });
    document.querySelectorAll("[data-cint-approval-history]").forEach(function(el){ el.textContent=rem.map(function(x){ return x.id+" "+x.status+" — source not modified"; }).join(" \\n "); });
    paintInvestigations();
    var deps=read("deps", []).filter(function(d){ return d.repo===r; });
    var kind=(document.querySelector("[data-cint-dep-kind]")||{}).value||"all";
    var dq=((document.querySelector("[data-cint-dep-search]")||{}).value||"").toLowerCase();
    document.querySelectorAll("[data-cint-dep-rows]").forEach(function(el){
      el.innerHTML=deps.filter(function(d){ return (kind==="all"||d.kind===kind) && (!dq || d.name.toLowerCase().indexOf(dq)!==-1); }).map(function(d){
        return "<tr><td>"+d.name+"</td><td>"+d.kind+"</td><td>"+d.version+"</td><td>"+d.advisory+"</td><td>"+d.license+"</td><td>"+d.upgrade+"</td></tr>";
      }).join("");
    });
    document.querySelectorAll("[data-cint-upgrade]").forEach(function(el){
      el.textContent=deps.filter(function(d){ return d.upgrade!=="—"; }).map(function(d){ return d.name+" "+d.version+" → "+d.upgrade; }).join("; ")||"No upgrades queued.";
    });
    var qcat=(document.querySelector("[data-cint-quality-cat]")||{}).value||"all";
    var ql=findings().filter(function(f){ return f.quality && (qcat==="all"||f.category===qcat); });
    document.querySelectorAll("[data-cint-quality-rows]").forEach(function(el){
      el.innerHTML=ql.map(function(f){ return "<tr><td>"+findingButton(f)+"</td><td>"+f.title+"</td><td>"+f.category+"</td><td>"+(f.file||f.location||"—")+"</td></tr>"; }).join("")||"<tr><td colspan=4>No quality issues for this filter.</td></tr>";
    });
    document.querySelectorAll("[data-cint-refactor]").forEach(function(el){ el.textContent="Before: handleAll(req)\\nAfter: handleAuth / handleBilling  (example only)"; });
    var docs=read("docs", []).filter(function(d){ return d.repo===r; });
    var dqry=((document.querySelector("[data-cint-doc-search]")||{}).value||"").toLowerCase();
    document.querySelectorAll("[data-cint-doc-toc]").forEach(function(el){
      el.innerHTML=docs.filter(function(d){ return !dqry || (d.title+" "+d.body).toLowerCase().indexOf(dqry)!==-1; }).map(function(d){ return "<button type=\\"button\\" class=\\"app-btn\\" data-cint-doc=\\""+d.title+"\\">"+d.title+" ("+d.audience+", "+d.freshness+")</button>"; }).join(" ");
    });
    document.querySelectorAll("[data-cint-doc-view]").forEach(function(el){ el.textContent=(docs[0]&&docs[0].body)||""; });
    var hist=read("history", []).filter(function(h){ return h.repo===r; });
    document.querySelectorAll("[data-cint-history-rows]").forEach(function(el){
      el.innerHTML=hist.map(function(h){ return "<tr><td>"+h.run+"</td><td>"+h.commit+"</td><td>"+h.state+"</td><td>"+h.resolved+"</td><td>"+h.reopened+"</td><td>"+h.notes+"</td></tr>"; }).join("");
    });
    var arch=(read("architecture", {})[r])||null;
    document.querySelectorAll("[data-cint-file-tree]").forEach(function(el){
      el.textContent=arch&&arch.nodes? arch.nodes.map(function(n){ return n.path+" ["+n.kind+"]"; }).join("\\n"): (r==="payments-api"?"cmd/api\\ninternal/auth\\ninternal/billing\\nmigrations":"src/session.ts\\nsrc/catalog.ts\\nsrc/redis.ts");
    });
    var flow=(document.querySelector("[data-cint-arch-filter]")||{}).value||"all";
    var archQ=((document.querySelector("[data-cint-arch-search]")||{}).value||"").toLowerCase();
    document.querySelectorAll("[data-cint-graph]").forEach(function(el){
      var nodes=arch&&arch.nodes? arch.nodes: [{id:"auth",label:"auth",flow:"auth"},{id:"billing",label:"billing",flow:"api"},{id:"ledger",label:"ledger",flow:"data"}];
      el.innerHTML=nodes.filter(function(n){
        if(flow!=="all"&&n.flow!==flow) return false;
        if(archQ && (n.label||n.id||"").toLowerCase().indexOf(archQ)===-1) return false;
        return true;
      }).map(function(n){
        return '<button type="button" data-cint-node="'+n.id+'">'+(n.label||n.id)+"</button>";
      }).join(" → ") || "No modules for this flow filter.";
    });
    document.querySelectorAll("[data-cint-arch-intended]").forEach(function(el){
      el.textContent=arch&&arch.intendedVsObserved? arch.intendedVsObserved.join("\\n"): "No architecture snapshot.";
    });
    document.querySelectorAll("[data-cint-arch-decisions]").forEach(function(el){
      el.innerHTML=arch&&arch.decisions? arch.decisions.map(function(d){ return "<p><strong>"+d.id+"</strong> "+d.title+" — "+d.rationale+"</p>"; }).join(""): "<p>No decisions indexed.</p>";
    });
    document.querySelectorAll("[data-cint-knowledge-graph]").forEach(function(el){
      el.textContent=arch&&arch.knowledge? arch.knowledge.map(function(k){ return k.id+" · "+k.kind+" · "+k.label+" → "+(k.refs||[]).join(","); }).join("\\n"): "No knowledge graph.";
    });
    document.querySelectorAll("[data-cint-recs]").forEach(function(el){
      var rec=findings().filter(function(f){ return f.lifecycle!=="RESOLVED"; })[0];
      el.innerHTML=rec? (findingButton(rec)+" "+rec.rec) : "No open recommendations.";
    });
    document.querySelectorAll("[data-cint-activity]").forEach(function(el){
      el.textContent="Finding lifecycle and analysis events for "+r+" stay in this workspace.";
    });
    document.querySelectorAll("[data-cint-audit]").forEach(function(el){
      el.textContent=read("audit", []).map(function(x){ return x.at+" "+x.msg; }).join(" | ")||"No audit events.";
    });
    document.querySelectorAll("[data-cint-notes-list]").forEach(function(el){
      el.textContent=read("notifications", []).map(function(n){ return n.title; }).join(" · ")||"No notifications.";
    });
    document.querySelectorAll("[data-cint-citations]").forEach(function(el){
      el.textContent=read("evidence", []).filter(function(e){ return e.repo===r||e.repositoryId===r; }).slice(0,8).map(function(e){ return e.id; }).join(" · ")||"No evidence indexed.";
    });
    /* Live suggest chips — replace demo JWT/auth prompts with this repo's findings/deps. */
    document.querySelectorAll("[data-cint-suggest-row]").forEach(function(row){
      var open=findings().filter(function(f){ return f.lifecycle!=="RESOLVED"; })[0];
      var dep=read("deps", []).filter(function(d){ return d.repo===r; })[0];
      var q1=open
        ? ("Why is finding "+(open.id||"")+" ("+(open.title||"issue")+") raised for this commit?")
        : ("Summarize the top findings for "+r+" at commit "+(meta.commit||"HEAD")+".");
      var q2=dep
        ? ("What depends on "+dep.name+" in the live dependency inventory?")
        : ("Which direct dependencies look most important in the live inventory for "+r+"?");
      var l1=open ? ("Explain "+(open.id||"finding")) : "Top findings";
      var l2=dep ? ("Depends on "+dep.name) : "Key dependencies";
      row.innerHTML="Suggested: "+
        '<button type="button" class="app-btn" data-cint-suggest="'+String(q1).replace(/"/g,"&quot;")+'">'+l1+"</button> "+
        '<button type="button" class="app-btn" data-cint-suggest="'+String(q2).replace(/"/g,"&quot;")+'">'+l2+"</button>";
    });
    paintEvidenceExplorer();
    paintIntegrationHosts();
    paintKil();
  }
  function kilBundle(){
    var all=read("kil", {});
    return all[repo()]||null;
  }
  function kilRetrieve(query){
    var kil=kilBundle();
    if(!kil||!kil.classified||!kil.classified.byId) return {total:0,hits:[]};
    var byId=kil.classified.byId;
    if(query&&query.id&&byId[query.id]) return {total:1,hits:[byId[query.id]]};
    var ids=Object.keys(byId);
    if(query&&query.kind){
      var kindIds=(kil.registry&&kil.registry.byKind&&kil.registry.byKind[query.kind])||[];
      ids=kindIds.slice();
    }
    if(query&&query.class){
      var classIds=(kil.classified.byClass&&kil.classified.byClass[query.class])||[];
      var classSet={};
      classIds.forEach(function(id){ classSet[id]=1; });
      ids=ids.filter(function(id){ return classSet[id]; });
    }
    var q=((query&&query.q)||"").toLowerCase().trim();
    var hits=[];
    ids.forEach(function(id){
      var e=byId[id];
      if(!e) return;
      if(e.status==="Archived") return;
      if(q){
        var hay=(e.id+" "+e.title+" "+e.kind+" "+(e.class||"")+" "+(e.labels||[]).join(" ")).toLowerCase();
        if(hay.indexOf(q)===-1) return;
      }
      hits.push(e);
    });
    return {total:hits.length,hits:hits.slice(0,80)};
  }
  function paintKil(){
    var kil=kilBundle();
    var statusEls=document.querySelectorAll("[data-cint-kil-status]");
    if(!document.querySelector("[data-cint-kil]")) return;
    if(!kil){
      statusEls.forEach(function(el){ el.textContent="Run Analyze to load the Knowledge catalog."; });
      document.querySelectorAll("[data-cint-kil-results]").forEach(function(el){ el.innerHTML=""; });
      return;
    }
    var qEl=document.querySelector("[data-cint-kil-search]");
    var kindEl=document.querySelector("[data-cint-kil-kind]");
    var classEl=document.querySelector("[data-cint-kil-class]");
    var res=kilRetrieve({
      q:(qEl&&qEl.value)||"",
      kind:(kindEl&&kindEl.value)||"",
      class:(classEl&&classEl.value)||""
    });
    statusEls.forEach(function(el){
      el.textContent="KIL "+(kil.version||"")+" · "+(kil.classified&&kil.classified.count!=null?kil.classified.count:0)+" objects · showing "+res.hits.length+(res.total>res.hits.length?" of "+res.total:"");
    });
    document.querySelectorAll("[data-cint-kil-results]").forEach(function(el){
      el.innerHTML=res.hits.map(function(e){
        return '<button type="button" class="app-btn" data-cint-kil-open="'+e.id+'"><strong>'+e.id+'</strong> · '+(e.class||"")+' · '+(e.title||e.kind)+"</button>";
      }).join(" ") || "<p class=\\"cint-muted\\">No objects match.</p>";
    });
  }
  function showKilDetail(id){
    var kil=kilBundle();
    if(!kil||!kil.classified||!kil.classified.byId) return;
    var e=kil.classified.byId[id];
    document.querySelectorAll("[data-cint-kil-detail]").forEach(function(el){
      if(!e){ el.textContent="Object not in catalog."; return; }
      el.innerHTML="<p><strong>"+e.id+"</strong></p><p>"+(e.title||"")+"</p><p>Kind: "+e.kind+" · Class: "+(e.class||"—")+" · Trust: "+(e.trust||"—")+" · Status: "+(e.status||"—")+"</p><p>Labels: "+((e.labels||[]).join(", ")||"—")+"</p>";
    });
    var edges=((kil.relationships&&kil.relationships.edges)||[]).filter(function(edge){
      return edge.from===id||edge.to===id;
    });
    document.querySelectorAll("[data-cint-kil-edges]").forEach(function(el){
      el.textContent=edges.length? edges.map(function(edge){ return edge.type+" · "+edge.from+" → "+edge.to; }).join("\\n"): "No relationships for this object.";
    });
  }
  function sessionRole(){
    var s=readSession();
    return (s&&s.role)||"Viewer";
  }
  function isOrgAdminSession(){
    return sessionRole()==="Admin";
  }
  function adminStatus(msg){
    document.querySelectorAll("[data-cint-admin-status]").forEach(function(el){ el.textContent=msg||""; });
    if(msg) note(msg);
  }
  function roleSelectHtml(current){
    var roles=["Admin","Architect","Security Analyst","Viewer"];
    return '<select data-cint-admin-role-select>'+roles.map(function(r){
      return '<option value="'+r+'"'+(r===current?' selected':'')+'>'+r+"</option>";
    }).join("")+"</select>";
  }
  function paintAdminMembersLocalFallback(){
    document.querySelectorAll("[data-cint-admin-members]").forEach(function(tb){
      tb.innerHTML=read("adminMembers", []).map(function(m){
        return "<tr><td>"+m.name+"</td><td>"+m.email+"</td><td>"+m.role+"</td><td>—</td></tr>";
      }).join("") || '<tr><td colspan="4">No IdP members loaded.</td></tr>';
    });
  }
  function loadAdminDirectory(){
    var sess=readSession();
    document.querySelectorAll("[data-cint-admin-bootstrap-wrap]").forEach(function(el){ el.hidden=true; });
    document.querySelectorAll("[data-cint-admin-access]").forEach(function(el){
      el.textContent=isOrgAdminSession()
        ?("Signed in as Admin"+(sess&&sess.email?(" · "+sess.email):"")+" — you can promote roles.")
        :("Signed in as "+sessionRole()+" — org.admin required to promote. Architect can still Approve remediation.");
    });
    if(!sess||sess.authMode!=="idp"||!sess.accessToken){
      paintAdminMembersLocalFallback();
      adminStatus("Sign in with IdP to manage Admin members.");
      return;
    }
    adminStatus("Loading members…");
    fetch(cintPath("admin"),{method:"GET",headers:authHeaders()}).then(function(r){
      return r.json().then(function(body){ return {status:r.status, body:body}; });
    }).then(function(res){
      var body=res.body||{};
      var boot=!!body.canBootstrap;
      document.querySelectorAll("[data-cint-admin-bootstrap-wrap]").forEach(function(el){ el.hidden=!boot; });
      if(body.roles&&body.roles.length){
        document.querySelectorAll("[data-cint-admin-roles]").forEach(function(el){
          el.textContent=body.roles.join(" · ");
        });
      }
      if(!body.ok){
        paintAdminMembersLocalFallback();
        adminStatus(body.error||("Admin API "+res.status));
        return;
      }
      var members=body.members||[];
      document.querySelectorAll("[data-cint-admin-members]").forEach(function(tb){
        if(!members.length){
          tb.innerHTML='<tr><td colspan="4">'+(boot?"No Admin yet — claim workspace Admin below.":"No members.")+"</td></tr>";
          return;
        }
        tb.innerHTML=members.map(function(m){
          var promote=isOrgAdminSession()
            ?(roleSelectHtml(m.role)+' <button type="button" class="app-btn" data-cint-admin-promote="'+m.userId+'">Save</button>')
            :"—";
          return "<tr><td>"+(m.displayName||"—")+"</td><td>"+(m.email||"—")+"</td><td>"+(m.role||"—")+"</td><td>"+promote+"</td></tr>";
        }).join("");
      });
      adminStatus(isOrgAdminSession()?"Members loaded.":(boot?"Bootstrap available — claim first Admin.":"Read-only (need Admin)."));
    }).catch(function(err){
      paintAdminMembersLocalFallback();
      adminStatus("Admin network error"+(err&&err.message?(": "+err.message):""));
    });
  }
  function paintOrganisation(){
    loadAdminDirectory();
    document.querySelectorAll("[data-cint-admin-roles]").forEach(function(el){
      if(!(el.textContent||"").trim()) el.textContent="Admin · Architect · Security Analyst · Viewer";
    });
    document.querySelectorAll("[data-cint-contact-rows]").forEach(function(tb){
      tb.innerHTML=read("contacts", []).map(function(c){
        return "<tr><td>"+c.name+"</td><td>"+c.email+"</td><td>"+c.role+"</td><td>"+c.team+"</td><td><button type=\\"button\\" class=\\"app-btn\\" data-cint-contact-remove=\\""+c.id+"\\">Remove</button></td></tr>";
      }).join("") || '<tr><td colspan="5">No contacts yet.</td></tr>';
    });
    document.querySelectorAll("[data-cint-support-rows]").forEach(function(tb){
      tb.innerHTML=read("supportTickets", []).map(function(t){
        return "<tr><td>"+t.at+"</td><td>"+t.subject+"</td><td>"+t.category+"</td><td>"+t.status+"</td></tr>";
      }).join("") || '<tr><td colspan="4">No support requests.</td></tr>';
    });
  }
  function paintIntegrationHosts(){
    var ingress=read("integrationIngress", []);
    document.querySelectorAll("[data-cint-ihs-ingress-rows]").forEach(function(tb){
      tb.innerHTML=ingress.slice().reverse().slice(0,20).map(function(row){
        return "<tr><td>"+row.at+"</td><td>"+row.kind+"</td><td>"+row.source+"</td><td>"+row.status+"</td><td>"+row.approval+"</td></tr>";
      }).join("") || '<tr><td colspan="5">No prepared imports/uploads yet.</td></tr>';
    });
    var egress=read("integrationEgress", []);
    document.querySelectorAll("[data-cint-ihs-egress-rows]").forEach(function(tb){
      tb.innerHTML=egress.slice().reverse().slice(0,20).map(function(row){
        return "<tr><td>"+row.at+"</td><td>"+row.action+"</td><td>"+row.format+"</td><td>"+row.page+"</td><td>"+row.status+"</td></tr>";
      }).join("") || '<tr><td colspan="5">No export/print/share events yet.</td></tr>';
    });
  }
  function fillEvidenceChain(finding){
    var ev=read("evidence", []).filter(function(e){ return finding && e.findingId===finding.id; })[0];
    var set=function(sel, val){ document.querySelectorAll(sel).forEach(function(el){ el.textContent=val; }); };
    if(!finding){
      set("[data-cint-ec-ref]", "—");
      set("[data-cint-ec-criteria]", "—");
      set("[data-cint-ec-confidence]", "—");
      set("[data-cint-ec-verification]", "—");
      set("[data-cint-ec-specialist]", "—");
      set("[data-cint-ec-timestamp]", "—");
      return;
    }
    var exists=!!ev || !!(finding.evidence && String(finding.evidence).length>2 && !/no evidence/i.test(String(finding.evidence)));
    var criteria=finding.criteria||finding.why||"";
    var conf=finding.confidence||"";
    var specialist=finding.specialist||(finding.security?"security_specialist":finding.quality?"quality_specialist":"architecture_specialist");
    var ts=finding.at||(ev?"demo-clock":"");
    var complete=exists && !!criteria && !!conf && !!specialist && !!ts;
    var status=!exists?"UNVERIFIED":!complete?"EVIDENCE_INCOMPLETE":"VERIFIED";
    set("[data-cint-ec-ref]", ev? (ev.id+" · "+ev.location): (finding.evidence||"No evidence attached — not verified"));
    set("[data-cint-ec-criteria]", criteria||"Assessment criteria not sealed for this finding");
    set("[data-cint-ec-confidence]", conf||"—");
    set("[data-cint-ec-verification]", status+(status==="VERIFIED"?"":" — Evidence Gate demotion"));
    set("[data-cint-ec-specialist]", specialist);
    set("[data-cint-ec-timestamp]", ts||"—");
  }
  function evidenceRows(){
    var r=repo();
    var slot=(document.querySelector("[data-cint-evidence-slot]")||{}).value||"all";
    var kind=(document.querySelector("[data-cint-evidence-kind]")||{}).value||"all";
    var q=((document.querySelector("[data-cint-evidence-search]")||{}).value||"").toLowerCase();
    return read("evidence", []).filter(function(e){
      if(e.repo!==r && e.repositoryId!==r) return false;
      if(slot!=="all" && e.slot!==slot) return false;
      if(kind!=="all" && e.kind!==kind) return false;
      if(!q) return true;
      return (e.id+" "+e.findingId+" "+e.kind+" "+e.slot+" "+e.summary+" "+e.location+" "+e.snippet).toLowerCase().indexOf(q)!==-1;
    });
  }
  function paintEvidenceExplorer(){
    var rows=evidenceRows();
    document.querySelectorAll("[data-cint-evidence-rows]").forEach(function(tb){
      tb.innerHTML=rows.map(function(e){
        return "<tr><td><button type=\\"button\\" class=\\"app-btn\\" data-cint-open-evidence=\\""+e.id+"\\">"+e.id+"</button></td><td><button type=\\"button\\" class=\\"app-btn\\" data-cint-open-finding=\\""+e.findingId+"\\">"+e.findingId+"</button></td><td>"+e.slot+"</td><td>"+e.kind+"</td><td>"+e.location+"</td><td>"+e.summary+"</td></tr>";
      }).join("") || '<tr><td colspan="6">No evidence for this snapshot and filter. Screenshots/stack traces appear only when present.</td></tr>';
    });
  }
  function paintInvestigations(){
    var r=repo();
    var inv=read("investigations", []).filter(function(x){ return x.repo===r; });
    document.querySelectorAll("[data-cint-investigation-rows]").forEach(function(tb){
      tb.innerHTML=inv.map(function(x){
        return "<tr><td><button type=\\"button\\" class=\\"app-btn\\" data-cint-open-investigation=\\""+x.id+"\\">"+x.id+"</button></td><td><button type=\\"button\\" class=\\"app-btn\\" data-cint-open-finding=\\""+x.findingId+"\\">"+x.findingId+"</button></td><td>"+x.question+"</td><td>"+x.state+"</td><td>"+(x.evidenceIds||[]).join(", ")+"</td></tr>";
      }).join("") || '<tr><td colspan="5">No investigations — Pack 06 opens only when findings have evidence.</td></tr>';
    });
  }
  function openInvestigation(id){
    var x=read("investigations", []).filter(function(row){ return row.id===id; })[0];
    if(!x) return;
    document.querySelectorAll("[data-cint-investigation-detail]").forEach(function(el){
      el.textContent=x.id+" · "+x.state+"\\nFinding "+x.findingId+"\\n"+x.question+"\\nHypotheses: "+(x.hypotheses||[]).join(" | ")+"\\nAnalysis: "+x.analysis+"\\nConclusion: "+x.conclusion+"\\nEvidence: "+(x.evidenceIds||[]).join(", ");
    });
    if(x.findingId) openFinding(x.findingId);
  }
  function openRemediation(id){
    var x=read("remediations", []).filter(function(row){ return row.id===id; })[0];
    if(!x) return;
    // Keep Approve/Reject usable — do not auto-open the finding modal (showModal blocks the page).
    closeFindingDrawer();
    document.querySelectorAll("[data-cint-diff]").forEach(function(el){ el.textContent=x.diff||"No diff"; });
    document.querySelectorAll("[data-cint-approval-history]").forEach(function(el){
      el.textContent=x.id+" "+x.status+" — neverWritesSource="+(x.neverWritesSource!==false)+" — source not modified";
    });
  }
  function openEvidence(id){
    var e=read("evidence", []).filter(function(x){ return x.id===id; })[0];
    if(!e) return;
    document.querySelectorAll("[data-cint-evidence-detail]").forEach(function(el){
      el.textContent=e.id+" · "+e.slot+" · "+e.kind+"\\nFinding "+e.findingId+"\\n"+e.location+"\\n"+e.summary+"\\n"+e.snippet;
    });
    if(e.findingId) openFinding(e.findingId);
  }
  // Per-page chrome() embeds a drawer inside each workspace panel. Opening the first
  // match (often Overview while FI is visible) keeps <dialog> under display:none → 0×0 "frozen".
  function ensureFindingDrawer(){
    var shell=productShell();
    var host=shell||document.body;
    var drawers=document.querySelectorAll("[data-cint-finding-drawer]");
    var keeper=null;
    for(var i=0;i<drawers.length;i++){
      if(drawers[i].open){ keeper=drawers[i]; break; }
    }
    if(!keeper && drawers.length) keeper=drawers[0];
    if(!keeper){
      keeper=document.createElement("dialog");
      keeper.setAttribute("data-cint-finding-drawer","");
      keeper.className="cint-drawer";
      keeper.hidden=true;
      keeper.innerHTML='<button type="button" class="app-btn" data-cint-close-drawer>Close</button><div data-cint-finding-detail></div>';
    }
    if(keeper.parentElement!==host){
      try{ host.appendChild(keeper); }catch(e){}
    }
    document.querySelectorAll("[data-cint-finding-drawer]").forEach(function(d){
      if(d===keeper) return;
      try{ if(d.open && typeof d.close==="function") d.close(); }catch(e){}
      try{ if(d.parentNode) d.parentNode.removeChild(d); }catch(e2){}
    });
    if(!keeper.querySelector("[data-cint-finding-detail]")){
      var detail=document.createElement("div");
      detail.setAttribute("data-cint-finding-detail","");
      keeper.appendChild(detail);
    }
    return keeper;
  }
  function openFindingDrawer(drawer){
    drawer=drawer||ensureFindingDrawer();
    if(!drawer) return;
    drawer.hidden=false;
    drawer.removeAttribute("hidden");
    try{
      drawer.style.setProperty("width","min(26rem, 100vw)","important");
      drawer.style.setProperty("height","100vh","important");
      drawer.style.setProperty("max-height","100vh","important");
      drawer.style.setProperty("position","fixed","important");
      drawer.style.setProperty("inset","0 auto 0 auto","important");
      drawer.style.setProperty("right","0","important");
      drawer.style.setProperty("left","auto","important");
      drawer.style.setProperty("z-index","9999","important");
    }catch(e){}
    // <dialog> stays display:none until show/showModal — removing [hidden] alone looks "frozen".
    // On Remediation, prefer non-modal show() so Approve/Reject stay clickable (no backdrop lock).
    var remVisible=!!document.querySelector(
      '.app-main [data-view="remediation"]:not([hidden]),.app-main [data-cint-page="remediation"]:not([hidden]),[data-view="remediation"]:not([hidden])'
    );
    try{
      if(typeof drawer.showModal==="function" && !remVisible){
        if(!drawer.open) drawer.showModal();
      } else if(typeof drawer.show==="function"){
        if(!drawer.open) drawer.show();
        else drawer.setAttribute("open","");
      } else {
        drawer.setAttribute("open","");
      }
    }catch(e){
      try{ if(typeof drawer.show==="function") drawer.show(); else drawer.setAttribute("open",""); }catch(e2){}
    }
  }
  function closeFindingDrawer(drawer){
    var list=drawer
      ? [drawer]
      : Array.prototype.slice.call(document.querySelectorAll("[data-cint-finding-drawer]"));
    list.forEach(function(d){
      if(!d) return;
      try{ if(typeof d.close==="function") d.close(); }catch(e){}
      try{ d.removeAttribute("open"); }catch(e2){}
      d.hidden=true;
      d.setAttribute("hidden","");
      try{ d.style.removeProperty("display"); }catch(e3){}
    });
  }
  function remediationStatus(msg){
    document.querySelectorAll("[data-cint-remediation-status]").forEach(function(el){
      el.textContent=msg||"";
    });
    document.querySelectorAll("[data-cint-approval-history]").forEach(function(el){
      if(msg) el.textContent=msg;
    });
    if(msg) note(msg);
  }
  function visibleRemediationRoot(){
    return document.querySelector(
      '.app-main [data-view="remediation"]:not([hidden]),.app-main [data-cint-page="remediation"]:not([hidden]),[data-view="remediation"]:not([hidden]),[data-cint-page="remediation"]:not([hidden])'
    )||document;
  }
  function readRemediationFields(root){
    root=root||visibleRemediationRoot();
    var pathEl=root.querySelector("[data-cint-patch-path]")||document.querySelector("[data-cint-patch-path]");
    var contentEl=root.querySelector("[data-cint-patch-content]")||document.querySelector("[data-cint-patch-content]");
    var recoveryEl=root.querySelector("[data-cint-recovery-id]")||document.querySelector("[data-cint-recovery-id]");
    return {
      patchPath:((pathEl&&pathEl.value)||"").trim(),
      patchContent:((contentEl&&contentEl.value)||"").trim(),
      recoveryId:((recoveryEl&&recoveryEl.value)||"").trim()
    };
  }
  function runRemediationDecision(decision){
    closeFindingDrawer();
    decision=decision==="reject"?"reject":"approve";
    remediationStatus(decision==="reject"?"Reject clicked…":"Approve clicked…");
    if(decision==="reject"){
      var remR=read("remediations", []).map(function(x){ if(x.repo===repo()) x.status="REJECTED"; return x; });
      write("remediations", remR);
      paint();
      remediationStatus("Remediation rejected — source not modified");
      return;
    }
    var fields=readRemediationFields();
    if(!fields.patchPath||!fields.patchContent){
      remediationStatus("Type patch path + content (placeholders do not count)");
      return;
    }
    if(!fields.recoveryId){
      remediationStatus("Type a recovery snapshot id (e.g. snap_manual_2026-11-20_l4)");
      return;
    }
    remediationStatus("Opening GitHub PR…");
    fetch(cintPath("remediation/apply"),{
      method:"POST",
      headers:authHeaders(),
      body:JSON.stringify({
        humanApproved:true,
        recoverySnapshotId:fields.recoveryId,
        repository:repo(),
        proposal:"Approve remediation for "+repo(),
        files:[{path:fields.patchPath,content:fields.patchContent}]
      })
    }).then(function(r){ return r.json(); }).then(function(body){
      if(!body||!body.ok){
        remediationStatus((body&&body.error)||"PR apply failed");
        return;
      }
      var remA=read("remediations", []).map(function(x){
        if(x.repo===repo()){ x.status="APPLIED"; x.prUrl=body.prUrl; }
        return x;
      });
      write("remediations", remA);
      paint();
      remediationStatus("PR opened: "+(body.prUrl||body.remediationId));
      audit("remediation PR "+(body.prUrl||""));
    }).catch(function(err){
      remediationStatus("PR apply network error"+(err&&err.message?(": "+err.message):""));
    });
  }
  function openFinding(id){
    var f=read("findings", []).filter(function(x){ return x.id===id; })[0];
    fillEvidenceChain(f||null);
    var drawer=ensureFindingDrawer();
    var box=drawer && drawer.querySelector("[data-cint-finding-detail]");
    if(!f){
      note("Finding not in local store: "+id+" — re-run Analyze, or open from FI");
      return;
    }
    if(!drawer||!box) return;
    var ev=read("evidence", []).filter(function(e){ return e.findingId===id; });
    var evHtml=ev.map(function(e){
      return '<p><button type="button" class="app-btn" data-cint-open-evidence="'+e.id+'">'+e.id+"</button> "+badge("kind",e.slot)+" "+e.kind+" @ "+e.location+" — "+e.summary+"</p><pre>"+e.snippet+"</pre>";
    }).join("") || "<p>FINDING_EVIDENCE_MISSING</p>";
    box.innerHTML="<h3>"+f.id+" "+f.title+"</h3>"+
      badge("sev",f.severity||f.sev||"—")+" "+badge("conf",f.confidence)+" "+badge("life",f.lifecycle)+
      "<p>Repository "+f.repo+" · file "+(f.file||f.location||"—")+"</p>"+
      "<p>Why: "+f.why+"</p>"+
      "<h3>Evidence</h3>"+evHtml+
      "<p>Recommendation: "+f.rec+"</p>"+
      '<label>Lifecycle <select data-cint-set-life="'+f.id+'"><option>DETECTED</option><option>TRIAGED</option><option>ACCEPTED</option><option>IN_PROGRESS</option><option>VALIDATION</option><option>RESOLVED</option><option>REOPENED</option></select></label>';
    var sel=box.querySelector("[data-cint-set-life]");
    if(sel) sel.value=f.lifecycle;
    openFindingDrawer(drawer);
  }
  function paint(){ paintChrome(); paintFindings(); paintRest(); paintOrganisation(); }
  function productShell(){ return document.querySelector("[data-cint-app-shell]"); }
  // In-memory backup — preview iframes / private mode can reject sessionStorage writes,
  // which previously made showView("overview") bounce to Login while still returning true.
  var memorySession=null;
  function sessionStillValid(s){
    if(!s||!s.authed) return false;
    if(typeof s.expiresAt==="number" && s.expiresAt<=Date.now()) return false;
    return true;
  }
  function readSession(){
    if(memorySession&&sessionStillValid(memorySession)) return memorySession;
    if(memorySession&&!sessionStillValid(memorySession)){ memorySession=null; }
    try{
      var raw=sessionStorage.getItem("cint.session.v1")||localStorage.getItem("cint.session.v1");
      if(!raw) return null;
      var s=JSON.parse(raw);
      // Migrate sticky localStorage demo sessions off the shared origin store so
      // Deploy/Preview iframes do not auto-jump away from marketing Landing.
      if(localStorage.getItem("cint.session.v1")){
        try{ sessionStorage.setItem("cint.session.v1", raw); }catch(e){}
        try{ localStorage.removeItem("cint.session.v1"); }catch(e){}
      }
      if(s&&sessionStillValid(s)){ memorySession=s; return s; }
      if(s&&s.authed&&!sessionStillValid(s)){
        try{ sessionStorage.removeItem("cint.session.v1"); }catch(e2){}
        try{ localStorage.removeItem("cint.session.v1"); }catch(e3){}
      }
      return null;
    }catch(e){ return null; }
  }
  function writeSession(payload){
    memorySession=payload||null;
    try{ sessionStorage.setItem("cint.session.v1", JSON.stringify(payload)); }catch(e){}
    try{ localStorage.removeItem("cint.session.v1"); }catch(e){}
  }
  function clearSession(){
    memorySession=null;
    try{ sessionStorage.removeItem("cint.session.v1"); }catch(e){}
    try{ localStorage.removeItem("cint.session.v1"); }catch(e){}
  }
  function hasSession(){ return !!readSession(); }
  function isGatewayViewKey(key){
    return key==="landing"||key==="home"||key==="login"||key==="signup"||key==="forgot-password";
  }
  function workspacePanelVisible(shell){
    if(!shell) return false;
    return !!(
      shell.querySelector('[data-view="overview"]:not([hidden]),[data-cint-page="overview"]:not([hidden])') ||
      shell.querySelector('.app-main [data-view]:not([hidden]):not([data-view="landing"]):not([data-view="login"]):not([data-view="signup"]):not([data-view="forgot-password"])')
    );
  }
  /** Public gateway after sign-out — marketing Landing when present, else Login. */
  function gatewayEntryView(){
    var shell=productShell()||document;
    if(shell.querySelector('[data-view="landing"],[data-cint-page="landing"],[data-cint-marketing]')) return "landing";
    return "login";
  }
  function showGatewayEntry(){
    var dest=gatewayEntryView();
    if(typeof showView==="function") showView(dest);
    else try{ window.location.hash="#"+dest; }catch(e){}
  }
  function setAuthed(on){
    var el=productShell();
    if(!el) return;
    if(on){
      // Attributes first — ensureRail reads zone/authed; calling it before stamped
      // display:none!important and left the navy rail as an empty light gutter.
      el.setAttribute("data-cint-authed","1");
      el.setAttribute("data-cint-zone","workspace");
      ensureRail();
    } else {
      el.removeAttribute("data-cint-authed");
      el.setAttribute("data-cint-zone","gateway");
      ensureRail();
    }
  }
  function seatPanelInMain(el){
    if(!el) return null;
    var shell=productShell();
    if(!shell) return el;
    var main=shell.querySelector("main.app-main, main");
    if(!main) return el;
    var panel=el.closest ? (el.closest("[data-view]")||el) : el;
    if(panel.parentElement===main) return panel;
    try{ main.appendChild(panel); }catch(e){}
    return panel;
  }
  var MKT_SCROLL_IDS={platform:1,solutions:1,intelligence:1,security:1,documentation:1,pricing:1,trust:1,knowledge:1,audiences:1,vision:1,"how-it-works":1,workspace:1};
  function findViewTarget(shell, key){
    var target=shell.querySelector('[data-view="'+key+'"]')||shell.querySelector('[data-cint-page="'+key+'"]');
    if(!target && key==="overview"){
      target=shell.querySelector('[data-view="dashboard"]')||shell.querySelector('[data-cint-page="dashboard"]')||
        shell.querySelector('[data-view="command-centre"]')||shell.querySelector('[data-cint-page="command-centre"]');
    }
    if(!target){
      var stray=document.querySelector('[data-view="'+key+'"]')||document.querySelector('[data-cint-page="'+key+'"]');
      if(stray) target=seatPanelInMain(stray);
    }
    return target;
  }
  function firstWorkspaceTarget(shell){
    var ids=["overview","repositories","findings","architecture","security","dependencies","quality","documentation","assistant","remediation","history","settings","admin","contacts","support"];
    for(var i=0;i<ids.length;i++){
      var hit=findViewTarget(shell, ids[i]);
      if(hit) return { key: ids[i]==="overview"? "overview": ids[i], el: hit };
    }
    return null;
  }
  function showView(id){
    if(!id) return false;
    var key=String(id).toLowerCase().replace(/^#/,"");
    if(key==="home") key="landing";
    if(key==="forgot"||key==="forgot_password") key="forgot-password";
    if(key==="dashboard"||key==="command-centre") key="overview";
    var shell=productShell();
    if(!shell) return false;
    // Marketing landing uses #security / #documentation anchors — but workspace also owns
    // those page keys. Prefer sealed workspace panels when authed; else ignore as mkt scroll.
    if(MKT_SCROLL_IDS[key]){
      var mktWorkspace=findViewTarget(shell, key);
      var mktAuthed=shell.getAttribute("data-cint-authed")==="1"||hasSession();
      if(!(mktWorkspace && mktAuthed && !isGatewayViewKey(key))) return false;
    }
    var target=findViewTarget(shell, key);
    if(!target){
      // Sidebar may list a route whose panel was never sealed — fall back to overview / first workspace.
      if(key!=="overview" && key!=="landing" && key!=="login" && key!=="signup" && key!=="forgot-password"){
        target=findViewTarget(shell, "overview");
        if(target) key="overview";
      }
      if(!target && key==="overview"){
        var fb=firstWorkspaceTarget(shell);
        if(fb){ target=fb.el; key=fb.key; }
      }
      if(!target){
        // Never leave workspace zone with every panel hidden (white blank).
        if(key==="overview"||(!MKT_SCROLL_IDS[key] && !isGatewayViewKey(key))){
          setAuthed(false);
          var loginDoor=findViewTarget(shell, "login")||findViewTarget(shell, "landing");
          if(loginDoor){
            try{ console.warn("[cint] missing workspace panel for", id, "— staying on gateway"); }catch(e){}
            showView(loginDoor.getAttribute("data-view")||loginDoor.getAttribute("data-cint-page")||"login");
            // Requested a workspace route but could not open it — callers must treat as failure.
            return false;
          }
        }
        return false;
      }
    } else {
      target=seatPanelInMain(target)||target;
    }
    var gateway=isGatewayViewKey(key);
    // Workspace routes always raise the rail; do not leave zone=gateway with Overview visible
    // (that paints an empty grey first grid column in deploy iframes).
    // Never invent a demo session here — only explicit login/signup may write cint.session.
    if(gateway) setAuthed(false);
    else {
      if(!hasSession()){
        setAuthed(false);
        var door=findViewTarget(shell, "login")||findViewTarget(shell, "landing");
        if(door && key!=="login"){
          showView(door.getAttribute("data-view")||door.getAttribute("data-cint-page")||"login");
          return false;
        }
        return false;
      }
      setAuthed(true);
    }
    // Topband → rail → main. Never hoist rail ahead of the toggle/separator band.
    try{
      var topband=ensureTopbar(shell);
      var rail=shell.querySelector(":scope > .app-sidebar[data-cint-rail], :scope > .app-sidebar");
      if(topband && shell.firstElementChild!==topband) shell.insertBefore(topband, shell.firstElementChild);
      if(rail){
        var afterTop=topband && topband.parentNode===shell ? topband.nextSibling : shell.firstElementChild;
        if(rail!==afterTop) shell.insertBefore(rail, afterTop);
      }
    }catch(e){}
    // Only toggle panels seated in the shell/main — body orphans must stay hidden.
    var panelScope=shell.querySelector(".app-main")||shell;
    panelScope.querySelectorAll("[data-view]").forEach(function(p){
      var v=(p.getAttribute("data-view")||"").toLowerCase();
      if(!v) return;
      if(v===key || (key==="overview" && (v==="dashboard"||v==="command-centre"))){
        p.removeAttribute("hidden");
        p.hidden=false;
        try{ p.style.removeProperty("display"); }catch(e){}
      } else {
        p.setAttribute("hidden","");
        p.hidden=true;
      }
    });
    // Orphans only: never match .website-shell [data-view] descendants — that re-hides
    // seated app-main panels (Sign In → blank / landing stuck at 32rem).
    document.querySelectorAll("body > [data-view], .website-shell > [data-view]").forEach(function(p){
      if(panelScope.contains(p) || shell.contains(p)) return;
      p.setAttribute("hidden","");
      p.hidden=true;
    });
    document.querySelectorAll("[data-view]").forEach(function(p){
      if(shell.contains(p)) return;
      p.setAttribute("hidden","");
      p.hidden=true;
    });
    // Footer bleed lock — Activity/Recs are Overview-only; quarantine orphans outside that route.
    document.querySelectorAll("[data-cint-activity],[data-cint-recs]").forEach(function(el){
      var panel=el.closest("[data-view],[data-cint-page]");
      var panelKey=((panel&&(panel.getAttribute("data-view")||panel.getAttribute("data-cint-page")))||"").toLowerCase();
      var onOverview=panelKey==="overview"||panelKey==="dashboard"||panelKey==="command-centre";
      var panelOpen=!!(panel && !panel.hidden && !panel.hasAttribute("hidden"));
      var wrap=el.closest("section")||el;
      if(!(onOverview && panelOpen && key==="overview")){
        wrap.setAttribute("hidden","");
        wrap.hidden=true;
        wrap.setAttribute("data-cint-orphan","1");
      } else {
        wrap.removeAttribute("hidden");
        wrap.hidden=false;
        wrap.removeAttribute("data-cint-orphan");
      }
    });
    shell.querySelectorAll("[data-cint-page]").forEach(function(p){
      var v=(p.getAttribute("data-cint-page")||"").toLowerCase();
      if(!v) return;
      if(v===key || (key==="overview" && (v==="dashboard"||v==="command-centre"))){
        p.removeAttribute("hidden");
        p.hidden=false;
        try{ p.style.removeProperty("display"); }catch(e){}
      } else {
        p.setAttribute("hidden","");
        p.hidden=true;
      }
    });
    try{ if(location.hash!=="#"+key) location.hash="#"+key; }catch(e){}
    try{
      var main=shell.querySelector("main.app-main, main");
      if(main) main.scrollTop=0;
    }catch(e){}
    // paint() already runs paintChrome → syncShellLayout; do not triple-paint on every nav.
    paint();
    return true;
  }
  window.__replicaCintShowView=showView;
  window.__replicaCintOpenFinding=openFinding;
  boot();
  try{ ensureFindingDrawer(); }catch(e){}
  document.addEventListener("click", function(ev){
    var t=ev.target;
    if(!t || !t.closest) return;
    var mkt=t.closest("[data-cint-mkt-scroll]");
    if(mkt && productShell()){
      var sid=mkt.getAttribute("data-cint-mkt-scroll");
      var root=productShell().querySelector("[data-cint-marketing]")||document;
      var section=sid? root.querySelector("#"+sid) || document.getElementById(sid): null;
      if(section){
        ev.preventDefault();
        if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
        else if(ev.stopPropagation) ev.stopPropagation();
        try{
          var main=productShell().querySelector("main.app-main, main");
          if(main && typeof section.getBoundingClientRect==="function"){
            var top=section.getBoundingClientRect().top - main.getBoundingClientRect().top + main.scrollTop - 8;
            main.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
          } else {
            section.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }catch(e){
          try{ section.scrollIntoView(true); }catch(e2){}
        }
        return;
      }
    }
    var route=t.closest("[data-view-nav],[data-cint-route]");
    if(!route || !productShell()) return;
    ev.preventDefault();
    if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    else if(ev.stopPropagation) ev.stopPropagation();
    var dest=route.getAttribute("data-view-nav")||route.getAttribute("data-cint-route");
    if(dest) showView(dest);
  }, true);
  // Default empty hash → marketing Landing sticks. Resume workspace only when the
  // hash already names a workspace route (set by Continue / login) and session exists.
  (function bootRoute(){
    var hash="";
    try{ hash=String(location.hash||"").replace(/^#/,"").toLowerCase(); }catch(e){}
    if(hash==="home") hash="landing";
    if(hash==="dashboard"||hash==="command-centre") hash="overview";
    if(hash==="forgot"||hash==="forgot_password") hash="forgot-password";
    var gateway=hash==="landing"||hash==="login"||hash==="signup"||hash==="forgot-password";
    if(gateway){ showView(hash); return; }
    if(hash && hasSession()){
      if(!showView(hash)) showGatewayEntry();
      return;
    }
    showGatewayEntry();
  })();
  // Unstick blank workspace (session + zone=workspace but no visible panel) and disabled Continue.
  (function recoverStuckAuthShell(){
    try{
      document.querySelectorAll("[data-cint-auth-submit],form[data-cint-form='login'] button,form[data-cint-form='signup'] button,form[data-cint-form='forgot'] button").forEach(function(b){
        try{
          b.disabled=false;
          b.removeAttribute("aria-busy");
          var idle=b.getAttribute("data-cint-auth-idle-label");
          if(idle) b.textContent=idle;
        }catch(e){}
      });
      var shell=productShell();
      if(!shell) return;
      var stamped=shell.getAttribute("data-cint-zone")==="workspace"||shell.getAttribute("data-cint-authed")==="1";
      if(!stamped) return;
      if(workspacePanelVisible(shell)) return;
      setAuthed(false);
      showView("login");
    }catch(e){}
  })();
  paint();
  document.addEventListener("change", function(ev){
    var t=ev.target;
    if(!t || !t.getAttribute) return;
    if(t.hasAttribute("data-cint-repo-select")){
      write("activeRepo", t.value);
      audit("repository selected "+t.value);
      paint();
    }
    if(t.hasAttribute("data-cint-set-life")){
      var id=t.getAttribute("data-cint-set-life");
      var all=read("findings", []).map(function(f){ if(f.id===id) f.lifecycle=t.value; return f; });
      write("findings", all);
      note("Lifecycle "+id+" → "+t.value);
      audit("lifecycle "+id+" "+t.value);
      paint();
    }
    if(t.hasAttribute("data-cint-finding-cat")||t.hasAttribute("data-cint-finding-life")||t.hasAttribute("data-cint-sec-cat")||t.hasAttribute("data-cint-sec-sev")||t.hasAttribute("data-cint-dep-kind")||t.hasAttribute("data-cint-quality-cat")||t.hasAttribute("data-cint-arch-filter")||t.hasAttribute("data-cint-evidence-slot")||t.hasAttribute("data-cint-evidence-kind")||t.hasAttribute("data-cint-kil-kind")||t.hasAttribute("data-cint-kil-class")) paint();
  });
  var paintInputTimer=null;
  function schedulePaint(){
    if(paintInputTimer) clearTimeout(paintInputTimer);
    paintInputTimer=setTimeout(function(){ paintInputTimer=null; paint(); }, 80);
  }
  document.addEventListener("input", function(ev){
    var t=ev.target;
    if(!t || !t.getAttribute) return;
    if(t.hasAttribute("data-cint-finding-search")||t.hasAttribute("data-cint-dep-search")||t.hasAttribute("data-cint-global-search")||t.hasAttribute("data-cint-doc-search")||t.hasAttribute("data-cint-arch-search")||t.hasAttribute("data-cint-evidence-search")||t.hasAttribute("data-cint-kil-search")) schedulePaint();
  });
  document.addEventListener("keydown", function(ev){
    if(ev.key==="Escape"||ev.keyCode===27){
      closeFindingDrawer();
    }
  });
  document.addEventListener("click", function(ev){
    var t=ev.target;
    if(!t || !t.closest) return;
    // Nav owned by capture listener — skip duplicate showView here.
    if(t.closest("[data-view-nav],[data-cint-route]")) return;
    var open=t.closest("[data-cint-open-finding]");
    if(open){
      ev.preventDefault();
      if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      else if(ev.stopPropagation) ev.stopPropagation();
      openFinding(open.getAttribute("data-cint-open-finding"));
      return;
    }
    var evOpen=t.closest("[data-cint-open-evidence]");
    if(evOpen){ openEvidence(evOpen.getAttribute("data-cint-open-evidence")); }
    var invOpen=t.closest("[data-cint-open-investigation]");
    if(invOpen){ openInvestigation(invOpen.getAttribute("data-cint-open-investigation")); }
    var remOpen=t.closest("[data-cint-open-remediation]");
    if(remOpen){ openRemediation(remOpen.getAttribute("data-cint-open-remediation")); }
    var remDecision=t.closest("[data-cint-remediation-decision]");
    if(remDecision){
      ev.preventDefault();
      if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      else if(ev.stopPropagation) ev.stopPropagation();
      runRemediationDecision(remDecision.getAttribute("data-cint-remediation-decision")||"approve");
      return;
    }
    if(t.closest("[data-cint-admin-refresh]")){
      ev.preventDefault();
      loadAdminDirectory();
      return;
    }
    if(t.closest("[data-cint-admin-bootstrap]")){
      ev.preventDefault();
      adminStatus("Claiming workspace Admin…");
      fetch(cintPath("admin"),{
        method:"POST",
        headers:authHeaders(),
        body:JSON.stringify({action:"bootstrap"})
      }).then(function(r){ return r.json().then(function(body){ return {status:r.status, body:body}; }); }).then(function(res){
        var body=res.body||{};
        if(!body.ok){
          adminStatus(body.error||("Bootstrap failed ("+res.status+")"));
          return;
        }
        adminStatus(body.message||"You are Admin — sign out and sign in again.");
        var sess=readSession();
        if(sess){
          sess.role="Admin";
          writeSession(sess);
        }
        paint();
      }).catch(function(err){
        adminStatus("Bootstrap network error"+(err&&err.message?(": "+err.message):""));
      });
      return;
    }
    var promoteBtn=t.closest("[data-cint-admin-promote]");
    if(promoteBtn){
      ev.preventDefault();
      var userId=promoteBtn.getAttribute("data-cint-admin-promote");
      var row=promoteBtn.closest("tr");
      var sel=row&&row.querySelector("[data-cint-admin-role-select]");
      var role=sel?sel.value:"Viewer";
      adminStatus("Saving role "+role+"…");
      fetch(cintPath("admin"),{
        method:"POST",
        headers:authHeaders(),
        body:JSON.stringify({action:"set_role",userId:userId,role:role})
      }).then(function(r){ return r.json().then(function(body){ return {status:r.status, body:body}; }); }).then(function(res){
        var body=res.body||{};
        if(!body.ok){
          adminStatus(body.error||("Promote failed ("+res.status+")"));
          return;
        }
        adminStatus(body.message||"Role updated.");
        var sess=readSession();
        if(sess&&body.member&&body.member.userId===sess.userId){
          sess.role=body.member.role;
          writeSession(sess);
        }
        loadAdminDirectory();
        paintChrome();
      }).catch(function(err){
        adminStatus("Promote network error"+(err&&err.message?(": "+err.message):""));
      });
      return;
    }
    if(t.closest("[data-cint-close-drawer]")){
      closeFindingDrawer();
    }
    var pick=t.closest("[data-cint-pick-repo]");
    if(pick){ write("activeRepo", pick.getAttribute("data-cint-pick-repo")); paint(); }
    if(t.closest("[data-cint-open-notes]")){
      document.querySelectorAll("[data-cint-notes]").forEach(function(el){ el.hidden=!el.hidden; });
    }
    if(t.closest("[data-cint-open-assistant]")){
      document.querySelectorAll("[data-cint-assistant-dock]").forEach(function(el){ el.hidden=!el.hidden; });
    }
    var reset=t.closest("[data-cint-reset-filters]");
    if(reset){
      document.querySelectorAll("[data-cint-finding-cat],[data-cint-finding-life],[data-cint-sec-cat],[data-cint-sec-sev],[data-cint-dep-kind],[data-cint-quality-cat],[data-cint-arch-filter],[data-cint-evidence-slot],[data-cint-evidence-kind]").forEach(function(s){ s.value="all"; });
      document.querySelectorAll("[data-cint-finding-search],[data-cint-dep-search],[data-cint-doc-search],[data-cint-global-search],[data-cint-arch-search],[data-cint-evidence-search]").forEach(function(i){ i.value=""; });
      paint();
    }
    var node=t.closest("[data-cint-node]");
    if(node){
      var nid=node.getAttribute("data-cint-node");
      var snap=(read("architecture", {})[repo()])||null;
      var hit=snap&&snap.nodes? snap.nodes.filter(function(n){ return n.id===nid; })[0]: null;
      var rel=snap&&snap.edges? snap.edges.filter(function(e){ return e.from===nid||e.to===nid; }).map(function(e){ return e.from+" -"+e.type+"-> "+e.to; }).join("\\n"): "";
      document.querySelectorAll("[data-cint-arch-detail]").forEach(function(el){
        el.textContent=hit? (hit.id+" · "+hit.kind+" · flow "+hit.flow+"\\npath "+hit.path+"\\n"+rel): (nid+" · intended vs observed for "+repo()+" @ selected commit.");
      });
    }
    var doc=t.closest("[data-cint-doc]");
    if(doc){
      var title=doc.getAttribute("data-cint-doc");
      var hitDoc=read("docs", []).filter(function(d){ return d.title===title; })[0];
      document.querySelectorAll("[data-cint-doc-view]").forEach(function(el){ el.textContent=hitDoc?hitDoc.body:""; });
    }
    if(t.closest("[data-cint-compare]")){
      document.querySelectorAll("[data-cint-compare-out]").forEach(function(el){
        el.textContent="A-1 COMPLETED vs A-0 FAILED on payments-api. Failed run is not a clean baseline.";
      });
    }
    var analysisRunBtn=t.closest("[data-cint-analysis-run],form[data-cint-form='analysis-run'] button[type='submit']");
    if(analysisRunBtn&&analysisRunBtn.tagName==="BUTTON"){
      ev.preventDefault();
      ev.stopPropagation();
      var analysisForm=analysisRunBtn.closest("form[data-cint-form='analysis-run']");
      if(analysisForm){
        try{ analysisForm.setAttribute("onsubmit","return false;"); }catch(e){}
        var analysisMode=analysisRunBtn.getAttribute("data-cint-analysis-run")||analysisRunBtn.value||"analyze";
        runLiveAnalysis(analysisForm, analysisMode==="agents"?"agents":"analyze");
      }
      return;
    }
    var githubActionBtn=t.closest("[data-cint-github-action],form[data-cint-form='github-connect'] button[type='submit'],form[data-cint-form='github-sim'] button[type='submit']");
    if(githubActionBtn&&githubActionBtn.tagName==="BUTTON"){
      ev.preventDefault();
      ev.stopPropagation();
      var githubForm=githubActionBtn.closest("form[data-cint-form='github-connect'],form[data-cint-form='github-sim']");
      if(githubForm){
        var githubAction=githubActionBtn.getAttribute("data-cint-github-action")||githubActionBtn.value||"connect";
        runGithubConnectAction(githubForm, githubAction);
      }
      return;
    }
    var kilRun=t.closest("[data-cint-kil-run]");
    if(kilRun){
      ev.preventDefault();
      paintKil();
      return;
    }
    var kilOpen=t.closest("[data-cint-kil-open]");
    if(kilOpen){
      ev.preventDefault();
      showKilDetail(kilOpen.getAttribute("data-cint-kil-open")||"");
      return;
    }
    var sug=t.closest("[data-cint-suggest]");
    if(sug){
      ev.preventDefault();
      var qText=(sug.getAttribute("data-cint-suggest")||sug.textContent||"").trim();
      if(!qText) return;
      /* Prefer the visible Assistant page form — not the hidden topbar dock's first match. */
      var pageForm=document.querySelector('.app-main [data-view="assistant"]:not([hidden]) [data-cint-form="assistant"], .app-main [data-cint-page="assistant"] [data-cint-form="assistant"], [data-view="assistant"]:not([hidden]) [data-cint-form="assistant"]');
      var dockForm=document.querySelector('[data-cint-assistant-dock]:not([hidden]) [data-cint-form="assistant"]');
      var form=pageForm||dockForm||document.querySelector('[data-cint-form="assistant"]');
      if(!form){ note("Open Assistant to use suggestions"); return; }
      var input=form.querySelector('[name="q"]');
      if(input){
        input.value=qText;
        try{ input.focus(); }catch(e){}
      }
      if(typeof form.requestSubmit==="function") form.requestSubmit();
      else form.dispatchEvent(new Event("submit",{bubbles:true,cancelable:true}));
      return;
    }
    if(t.closest("[data-cint-export]")){
      ev.preventDefault();
      var exportUrl=cintPath("export?format=json&download=1");
      var exportName="cint-export-"+syncProjectId()+".json";
      if(triggerHostDownload(exportUrl, exportName)){
        note("Export download started — check browser Downloads (can take ~10–30s on large repos)");
        audit("export live json");
        return;
      }
      note("Preparing live export…");
      fetch(exportUrl).then(function(r){
        if(!r.ok) throw new Error("export HTTP "+r.status);
        return r.blob();
      }).then(function(blob){
        triggerBlobDownload(blob, exportName);
        note("Exported live workspace JSON — check Downloads");
        audit("export live json");
      }).catch(function(err){ note("Export failed"+(err&&err.message?(": "+err.message):"")); });
      return;
    }
    var expBtn=t.closest("[data-cint-integration-export]");
    if(expBtn){
      ev.preventDefault();
      var fmt=expBtn.getAttribute("data-cint-integration-export")||"json";
      var page=expBtn.getAttribute("data-cint-ihs-page")||"workspace";
      var exportFmt=fmt==="md"?"markdown":fmt;
      var ext=exportFmt==="csv"?"csv":(exportFmt==="markdown"||exportFmt==="pdf")?"md":"json";
      var ihsUrl=cintPath("export?format="+encodeURIComponent(exportFmt)+"&download=1");
      var ihsName="cint-export-"+page+"."+ext;
      if(triggerHostDownload(ihsUrl, ihsName)){
        var egressQuick=read("integrationEgress", []);
        egressQuick.push({at:new Date().toISOString(), action:"export", format:fmt, page:page, status:"STARTED_LIVE", repo:repo()});
        write("integrationEgress", egressQuick);
        note("Live "+fmt.toUpperCase()+" export started for "+page+" — check Downloads");
        audit("integration export live "+fmt+" "+page);
        paintIntegrationHosts();
        return;
      }
      note("Preparing "+fmt.toUpperCase()+" export…");
      fetch(ihsUrl).then(function(r){
        if(!r.ok) throw new Error("export HTTP "+r.status);
        return r.blob();
      }).then(function(blob){
        triggerBlobDownload(blob, ihsName);
        var egress=read("integrationEgress", []);
        egress.push({at:new Date().toISOString(), action:"export", format:fmt, page:page, status:"COMPLETED_LIVE", repo:repo()});
        write("integrationEgress", egress);
        note("Live "+fmt.toUpperCase()+" export downloaded for "+page+" — check Downloads");
        audit("integration export live "+fmt+" "+page);
        paintIntegrationHosts();
      }).catch(function(err){ note("Export failed"+(err&&err.message?(": "+err.message):"")); });
      return;
    }
    if(t.closest("[data-cint-integration-print]")){
      var pp=(t.closest("[data-cint-integration-print]").getAttribute("data-cint-ihs-page"))||"workspace";
      var peg=read("integrationEgress", []);
      peg.push({at:new Date().toISOString(), action:"print", format:"print_view", page:pp, status:"PREPARED_L3", repo:repo()});
      write("integrationEgress", peg);
      note("Print view prepared — browser print only.");
      audit("integration print "+pp);
      paintIntegrationHosts();
      try{ window.print(); }catch(e){}
    }
    if(t.closest("[data-cint-integration-share]")){
      var sp=(t.closest("[data-cint-integration-share]").getAttribute("data-cint-ihs-page"))||"workspace";
      var seg=read("integrationEgress", []);
      seg.push({at:new Date().toISOString(), action:"share", format:"scoped_link", page:sp, status:"CONNECTOR_DEFERRED", repo:repo()});
      write("integrationEgress", seg);
      note("Share prepared — connector deferred; no link issued.");
      audit("integration share deferred "+sp);
      paintIntegrationHosts();
      document.querySelectorAll("[data-cint-ihs-log]").forEach(function(el){ el.textContent="Share request recorded — ACL connector deferred."; });
    }
    if(t.closest("[data-cint-sidebar-toggle]")){
      ev.preventDefault();
      var shell=t.closest("[data-cint-app-shell],[data-cint-shell]");
      if(shell && !shell.hasAttribute("data-cint-auth")){
        var next=shell.getAttribute("data-cint-sidebar")==="collapsed"?"expanded":"collapsed";
        applySidebarMode(next);
      }
    }
    if(t.closest("[data-cint-signout]")){
      var prior=readSession();
      fetch(cintPath("auth"),{method:"POST",headers:authHeaders(),body:JSON.stringify({action:"logout"})}).catch(function(){});
      clearSession();
      setAuthed(false);
      audit((prior&&prior.authMode==="idp"?"idp":"demo")+" sign-out");
      showGatewayEntry();
    }
    var remContact=t.closest("[data-cint-contact-remove]");
    if(remContact){
      var rid=remContact.getAttribute("data-cint-contact-remove");
      write("contacts", read("contacts", []).filter(function(c){ return c.id!==rid; }));
      note("Contact removed");
      paintOrganisation();
    }
  });
  document.addEventListener("cancel", function(ev){
    var d=ev.target;
    if(d && d.hasAttribute && d.hasAttribute("data-cint-finding-drawer")){
      closeFindingDrawer(d);
    }
  });
  function ensureAuthStatusEl(form){
    if(!form||!form.querySelector) return null;
    var el=form.querySelector("[data-cint-auth-status]");
    if(el) return el;
    el=document.createElement("p");
    el.setAttribute("data-cint-auth-status","1");
    el.className="cint-purpose";
    el.setAttribute("aria-live","polite");
    var btn=form.querySelector("[data-cint-auth-submit],button[type=\\"submit\\"]");
    if(btn&&btn.parentNode===form) form.insertBefore(el, btn);
    else form.appendChild(el);
    return el;
  }
  function setAuthStatus(form, msg, tone){
    var el=ensureAuthStatusEl(form);
    if(el){
      el.textContent=msg||"";
      el.setAttribute("data-cint-auth-tone", tone||(msg?"busy":""));
      try{
        el.style.display=msg?"block":"";
        el.style.minHeight=msg?"1.4em":"";
        el.style.color=tone==="error"?"#b45309":(tone==="ok"?"#0f766e":"#5b6b7c");
        el.style.fontWeight=msg?"600":"";
      }catch(e){}
    }
    if(msg){ try{ note(msg); }catch(e2){} }
  }
  function setAuthBusy(btn, busy, idleLabel){
    if(!btn) return;
    try{
      if(busy){
        if(!btn.getAttribute("data-cint-auth-idle-label")){
          btn.setAttribute("data-cint-auth-idle-label", (btn.textContent||"").trim()||idleLabel||"Continue");
        }
        btn.disabled=true;
        btn.setAttribute("aria-busy","true");
        btn.textContent=idleLabel==="forgot"||/reset/i.test(btn.getAttribute("data-cint-auth-idle-label")||"")
          ?"Sending…"
          :(/create/i.test(btn.getAttribute("data-cint-auth-idle-label")||"")?"Creating…":"Signing in…");
      } else {
        btn.disabled=false;
        btn.removeAttribute("aria-busy");
        var idle=btn.getAttribute("data-cint-auth-idle-label");
        if(idle) btn.textContent=idle;
      }
    }catch(e){
      try{ btn.disabled=!!busy; }catch(e2){}
    }
  }
  function runGatewayAuthForm(form, kind){
    if(!form) return;
    kind=kind||form.getAttribute("data-cint-form")||form.getAttribute("data-cint-auth-action")||"";
    if(kind==="forgot"){
      var forgotEmail=(form.querySelector('[name="email"]')||{}).value||"";
      var forgotBtn=form.querySelector("[data-cint-auth-submit],button[type=\\"submit\\"]");
      var forgotOk=form.querySelector(".state-success");
      if(!forgotEmail){
        setAuthStatus(form, "Email required", "error");
        return;
      }
      syncProjectId();
      var forgotUrl=cintPath("auth");
      var redirectTo="";
      try{ redirectTo=String(window.location.href||"").split("#")[0]||""; }catch(e){}
      setAuthStatus(form, "Sending reset link… · "+forgotUrl, "busy");
      setAuthBusy(forgotBtn, true, "forgot");
      var forgotCtrl=typeof AbortController!=="undefined"?new AbortController():null;
      var forgotTimer=forgotCtrl?setTimeout(function(){ try{ forgotCtrl.abort(); }catch(e){} }, 10000):null;
      fetch(forgotUrl,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({action:"forgot",email:forgotEmail,redirectTo:redirectTo||undefined}),
        signal:forgotCtrl?forgotCtrl.signal:undefined
      }).then(function(r){
        return r.text().then(function(txt){
          var body={};
          try{ body=txt?JSON.parse(txt):{}; }catch(e){ body={ ok:false, error:"Auth API returned non-JSON ("+r.status+")" }; }
          return {status:r.status, body:body};
        });
      }).then(function(res){
        if(forgotTimer) clearTimeout(forgotTimer);
        var body=res.body||{};
        if(body.ok){
          setAuthStatus(form, body.message||"Reset email sent — check inbox, then sign in", "ok");
          if(forgotOk) forgotOk.hidden=false;
          audit("idp password reset requested");
          setAuthBusy(forgotBtn, false);
          return;
        }
        if(body.code==="cint_auth_not_configured"||res.status===503){
          setAuthStatus(form, "IdP not configured — set CINT_SUPABASE_* to enable reset email", "error");
          setAuthBusy(forgotBtn, false);
          return;
        }
        setAuthStatus(form, body.error||("Reset failed ("+res.status+")"), "error");
        setAuthBusy(forgotBtn, false);
      }).catch(function(err){
        if(forgotTimer) clearTimeout(forgotTimer);
        setAuthBusy(forgotBtn, false);
        var aborted=err&&(err.name==="AbortError"||/abort/i.test(String(err.message||err)));
        setAuthStatus(form, aborted
          ?("Reset timed out (10s) — IdP slow or unreachable · "+forgotUrl)
          :("Reset network error — "+forgotUrl), "error");
      });
      return;
    }
    if(kind!=="login"&&kind!=="signup") return;
    var email=(form.querySelector('[name="email"]')||{}).value||"";
    var password=(form.querySelector('[name="password"]')||{}).value||"";
    var displayName=(form.querySelector('[name="name"],[name="displayName"]')||{}).value||"";
    var okAuth=form.querySelector(".state-success");
    var submitBtn=form.querySelector("[data-cint-auth-submit],button[type=\\"submit\\"]");
    function finishAuthed(sessionPayload, modeLabel){
      writeSession(sessionPayload);
      setAuthStatus(form, modeLabel+" — opening Overview", "busy");
      audit((sessionPayload.authMode||"demo")+" auth "+kind+" role="+(sessionPayload.role||"?"));
      // Never stamp workspace/authed before Overview is visible — that CSS-hides Login
      // and freezes a blank shell when Overview is missing or not yet seated.
      var opened=false;
      try{ opened=typeof showView==="function" ? showView("overview") : false; }catch(e){ opened=false; }
      var shellNow=productShell();
      var workspaceOpen=!!(opened && shellNow && shellNow.getAttribute("data-cint-authed")==="1" && workspacePanelVisible(shellNow));
      if(!workspaceOpen){
        try{ setAuthed(false); }catch(e){}
        try{ if(typeof showView==="function") showView("login"); }catch(e2){}
        setAuthStatus(form, "Signed in, but Overview did not open — Unlock CI freeze / Repair, then Continue again.", "error");
        if(okAuth) okAuth.hidden=true;
        document.querySelectorAll("[data-cint-auth-block]").forEach(function(el){ el.remove(); });
        var host=form.closest("[data-cint-shell],[data-cint-page]")||form.parentElement;
        if(host){
          var banner=document.createElement("p");
          banner.setAttribute("data-cint-auth-block","1");
          banner.className="cint-state";
          banner.style.cssText="margin:.75rem 0 0;color:#b45309;border-color:#f59e0b";
          banner.textContent="Session kept. Overview is missing or frozen — Advanced Repair → Unlock CI freeze → Repair automatically → hard-refresh → Continue.";
          form.appendChild(banner);
        }
        try{ paint(); }catch(e3){}
        setAuthBusy(submitBtn, false);
        return;
      }
      if(okAuth) okAuth.hidden=false;
      try{ paint(); }catch(e4){}
      setAuthBusy(submitBtn, false);
    }
    function demoFallback(reason){
      var at=Date.now();
      finishAuthed({
        authed:true,
        authMode:"demo",
        demo:true,
        at:at,
        expiresAt:at+(1000*60*60*24),
        userId:"demo:"+(email||"anonymous").toLowerCase(),
        email:(email||"demo@eng-platform.local").toLowerCase(),
        displayName:displayName||"Demo Engineer",
        role:"Admin"
      }, "Demo sign-in"+(reason?(" ("+reason+")"):""));
    }
    if(!email||!password){
      setAuthStatus(form, "Email and password required", "error");
      return;
    }
    if(kind==="signup"&&String(password).length<8){
      setAuthStatus(form, "Password must be at least 8 characters", "error");
      return;
    }
    // Single-segment /cint/auth only (never nested login/signup segments — those 404 as HTML).
    var authBody=kind==="signup"
      ?{action:"signup",email:email,password:password,displayName:displayName||undefined}
      :{action:"login",email:email,password:password};
    syncProjectId();
    var authUrl=cintPath("auth");
    setAuthStatus(form, (kind==="signup"?"Creating account…":"Signing in…")+" · "+authUrl, "busy");
    setAuthBusy(submitBtn, true, kind);
    var authCtrl=typeof AbortController!=="undefined"?new AbortController():null;
    var authTimer=authCtrl?setTimeout(function(){ try{ authCtrl.abort(); }catch(e){} }, 10000):null;
    fetch(authUrl,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(authBody),
      signal:authCtrl?authCtrl.signal:undefined
    }).then(function(r){
      return r.text().then(function(txt){
        var body={};
        try{ body=txt?JSON.parse(txt):{}; }catch(e){ body={ ok:false, error:"Auth API returned non-JSON ("+r.status+")" }; }
        return {status:r.status, body:body};
      });
    }).then(function(res){
      if(authTimer) clearTimeout(authTimer);
      var body=res.body||{};
      if(body.ok&&body.session&&body.session.authed){
        finishAuthed(body.session, body.session.authMode==="idp"?"IdP sign-in":"Signed in");
        return;
      }
      if(body.code==="cint_auth_not_configured"||res.status===503){
        demoFallback("IdP not configured");
        return;
      }
      if(body.code==="cint_auth_confirm_required"||res.status===202){
        setAuthStatus(form, body.error||"Confirm your email, then sign in", "error");
        setAuthBusy(submitBtn, false);
        if(typeof showView==="function") showView("login");
        return;
      }
      if(body.code==="cint_auth_incomplete_session"){
        setAuthStatus(form, body.error||"IdP session incomplete — check CINT Supabase Auth (access token / user id)", "error");
        setAuthBusy(submitBtn, false);
        return;
      }
      setAuthStatus(form, body.error||("Sign-in failed ("+res.status+")"), "error");
      setAuthBusy(submitBtn, false);
    }).catch(function(err){
      if(authTimer) clearTimeout(authTimer);
      setAuthBusy(submitBtn, false);
      var aborted=err&&(err.name==="AbortError"||/abort/i.test(String(err.message||err)));
      setAuthStatus(form, aborted
        ?("Auth timed out (10s) — IdP slow or unreachable · "+authUrl)
        :("Auth network error — "+authUrl), "error");
    });
  }
  // Heal older publish snapshots that lack data-cint-auth-submit / status line.
  (function healGatewayAuthForms(){
    document.querySelectorAll('form[data-cint-form="login"],form[data-cint-form="signup"],form[data-cint-form="forgot"],form[data-cint-auth-action]').forEach(function(f){
      try{ f.setAttribute("onsubmit","return false;"); }catch(e){}
      var kind=f.getAttribute("data-cint-form")||f.getAttribute("data-cint-auth-action")||"login";
      var btn=f.querySelector('button[type="submit"],button.app-btn');
      if(btn && !btn.getAttribute("data-cint-auth-submit")) btn.setAttribute("data-cint-auth-submit", kind);
      // Status ABOVE the button so busy/error text is visible while the control is locked.
      var st=f.querySelector("[data-cint-auth-status]");
      if(!st){
        st=document.createElement("p");
        st.setAttribute("data-cint-auth-status","1");
        st.className="cint-purpose";
        st.setAttribute("aria-live","polite");
        if(btn&&btn.parentNode===f) f.insertBefore(st, btn);
        else f.appendChild(st);
      } else if(btn&&btn.parentNode===f&&st.parentNode===f){
        try{ f.insertBefore(st, btn); }catch(eMove){}
      }
    });
  })();
  document.addEventListener("click", function(ev){
    var t=ev.target;
    if(!t || !t.closest) return;
    var authBtn=t.closest("[data-cint-auth-submit],form[data-cint-form='login'] button, form[data-cint-form='signup'] button, form[data-cint-form='forgot'] button, form[data-cint-auth-action] button");
    if(!authBtn || authBtn.tagName!=="BUTTON") return;
    // Inline host-style bridge owns auth when present (same idea as loginPreHydrationScript).
    if(document.querySelector("[data-cint-auth-inline]")||window.__cintAuthInlineInstalled){
      return;
    }
    // Disabled busy button — ignore duplicate clicks (status already shows progress).
    if(authBtn.disabled){
      ev.preventDefault();
      ev.stopPropagation();
      return;
    }
    var form=authBtn.closest("form[data-cint-form],form[data-cint-auth-action]");
    if(!form) return;
    ev.preventDefault();
    ev.stopPropagation();
    runGatewayAuthForm(form, authBtn.getAttribute("data-cint-auth-submit")||form.getAttribute("data-cint-form")||form.getAttribute("data-cint-auth-action"));
  }, true);
  document.addEventListener("submit", function(ev){
    var form=ev.target;
    if(!form || !form.getAttribute) return;
    var kind=form.getAttribute("data-cint-form");
    if(!kind) return;
    // Host-style inline bridge owns login/signup/forgot — do not steal the event.
    if((kind==="login"||kind==="signup"||kind==="forgot"||kind==="forgot-password")&&
      (document.querySelector("[data-cint-auth-inline]")||window.__cintAuthInlineInstalled)){
      return;
    }
    ev.preventDefault();
    ev.stopPropagation();
    if(kind==="analysis-run"){
      var modeBtn=ev.submitter||null;
      var mode=(modeBtn&&(modeBtn.getAttribute("data-cint-analysis-run")||modeBtn.value))||"analyze";
      if(mode!=="agents") mode="analyze";
      runLiveAnalysis(form, mode);
      return;
    }
    if(kind==="approve-remediation"){
      var decision=(ev.submitter&&ev.submitter.getAttribute&&ev.submitter.getAttribute("data-cint-remediation-decision"))||
        (ev.submitter&&ev.submitter.value)||"approve";
      runRemediationDecision(decision);
      return;
    }
    if(kind==="assistant"){
      var q=(form.querySelector('[name="q"]')||{}).value||"";
      if(!q.trim()){ note("Enter a question"); return; }
      var askBtns=form.querySelectorAll("[data-cint-assistant-ask],button[type=\\"submit\\"]");
      if(form.getAttribute("data-cint-assistant-busy")==="1"){
        note("Assistant still working — wait for Thinking to finish or time out");
        return;
      }
      form.setAttribute("data-cint-assistant-busy","1");
      askBtns.forEach(function(b){ try{ b.disabled=true; }catch(e){} });
      var c=read("conversations", []);
      var rAsk=repo();
      var metaAsk=(read("repos", {})[rAsk])||{};
      var anAsk=(read("analysis", {})[rAsk])||{};
      var findingsAsk=findings().filter(function(f){ return f.lifecycle!=="RESOLVED"; }).slice(0,12).map(function(f){
        return {id:f.id,title:f.title,severity:f.severity||f.sev,category:f.category,location:f.location,file:f.file};
      });
      var evidenceAsk=read("evidence", []).filter(function(e){ return e.repo===rAsk||e.repositoryId===rAsk; }).slice(0,10).map(function(e){
        return {id:e.id,findingId:e.findingId,summary:e.summary,location:e.location};
      });
      var depsAsk=read("deps", []).filter(function(d){ return d.repo===rAsk; }).slice(0,15).map(function(d){
        return {name:d.name,version:d.version,kind:d.kind};
      });
      var groundedAsk=findingsAsk.length>0||evidenceAsk.length>0||depsAsk.length>0;
      var knownIds=findingsAsk.map(function(f){ return f.id; }).concat(evidenceAsk.map(function(e){ return e.id; })).filter(Boolean);
      document.querySelectorAll("[data-cint-thread]").forEach(function(el){ el.textContent="Thinking… (live ask, up to 45s)"; });
      document.querySelectorAll("[data-cint-assistant-meta]").forEach(function(el){
        el.textContent=groundedAsk
          ? ("Sending "+findingsAsk.length+" findings · "+evidenceAsk.length+" evidence · "+depsAsk.length+" deps with question…")
          : "Warning: little local grounding — answer may be ungrounded until Analyze completes.";
      });
      var ASSISTANT_TIMEOUT_MS=45000;
      var controller=typeof AbortController!=="undefined" ? new AbortController() : null;
      var timeoutId=controller ? setTimeout(function(){ try{ controller.abort(); }catch(e){} }, ASSISTANT_TIMEOUT_MS) : null;
      function finishAssistantAsk(answerText, meta){
        if(timeoutId) clearTimeout(timeoutId);
        form.removeAttribute("data-cint-assistant-busy");
        askBtns.forEach(function(b){ try{ b.disabled=false; }catch(e){} });
        c.push({q:q,a:answerText,provider:meta&&meta.provider,model:meta&&meta.model,live:!!(meta&&meta.live),grounded:!!(meta&&meta.grounded)});
        write("conversations", c);
        document.querySelectorAll("[data-cint-thread]").forEach(function(el){ el.textContent=answerText; });
        var cited=[];
        var uncited=[];
        knownIds.forEach(function(id){
          if(answerText.indexOf(id)!==-1) cited.push(id);
          else uncited.push(id);
        });
        var citeLine=cited.length
          ? ("Cited in answer: "+cited.join(" · "))
          : (knownIds.length
            ? ("Answer did not cite indexed IDs — indexed: "+knownIds.slice(0,8).join(" · "))
            : "No evidence indexed for this repo yet — run Analyze.");
        if(meta&&meta.ok===false) citeLine="Ask failed — citations unchanged. "+citeLine;
        document.querySelectorAll("[data-cint-citations]").forEach(function(el){ el.textContent=citeLine; });
        document.querySelectorAll("[data-cint-assistant-meta]").forEach(function(el){
          if(meta&&meta.ok===false){
            el.textContent="Failed"+(meta.error?(": "+meta.error):"");
            return;
          }
          var bits=[];
          bits.push((meta&&meta.grounded)?"Grounded":"Ungrounded");
          if(meta&&meta.provider) bits.push(String(meta.provider)+(meta.model?(" / "+meta.model):""));
          if(meta&&meta.live) bits.push("live");
          if(cited.length) bits.push(cited.length+" id(s) cited");
          el.textContent=bits.join(" · ");
        });
      }
      fetch(cintPath("assistant"),{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        signal:controller ? controller.signal : undefined,
        body:JSON.stringify({
          question:q,
          repository:rAsk,
          commitSha:metaAsk.commit||anAsk.commit||null,
          contextNotes:"Active CI workspace · "+rAsk,
          live:!!(metaAsk.live||anAsk.live),
          analysisId:anAsk.id||anAsk.runId||null,
          grounding:{
            repository:rAsk,
            commitSha:metaAsk.commit||anAsk.commit||null,
            live:!!(metaAsk.live||anAsk.live),
            analysisId:anAsk.id||anAsk.runId||null,
            findings:findingsAsk,
            evidence:evidenceAsk,
            dependencies:depsAsk,
            contextNotes:"Active CI workspace"
          },
          findings:findingsAsk,
          evidence:evidenceAsk,
          dependencies:depsAsk
        })
      }).then(function(r){ return r.json().then(function(body){ return {http:r.status,body:body}; }); }).then(function(res){
        var body=res.body||{};
        if(body&&body.ok&&body.answer){
          finishAssistantAsk(body.answer,{ok:true,provider:body.provider,model:body.model,live:!!body.live,grounded:!!body.grounded});
          note("Assistant answered ("+(body.grounded?"grounded":"ungrounded")+")");
          return;
        }
        var err=(body&&body.error)||("Assistant unavailable (HTTP "+res.http+") — set CINT_ANTHROPIC_API_KEY on the host.");
        finishAssistantAsk(err,{ok:false,error:err,live:false,grounded:false});
        note(err);
      }).catch(function(err){
        var timedOut=err&&(err.name==="AbortError"||/abort/i.test(String(err.message||err)));
        var fallback=timedOut
          ? ("Assistant timed out after "+ASSISTANT_TIMEOUT_MS+"ms for "+rAsk+" — retry Ask, or check host LLM keys/network.")
          : ("Assistant network error for "+rAsk+(err&&err.message?(": "+err.message):""));
        finishAssistantAsk(fallback,{ok:false,error:fallback,live:false,grounded:false});
        note(fallback);
      });
    }
    if(kind==="github-connect"||kind==="github-sim"){
      var ghBtn=ev.submitter||null;
      var ghAction=(ghBtn&&(ghBtn.getAttribute("data-cint-github-action")||ghBtn.value))||"connect";
      runGithubConnectAction(form, ghAction);
      return;
    }
    if(kind==="prefs"){
      write("preferences", {
        retentionDays:Number((form.querySelector('[name="retention"]')||{}).value||30),
        notifyFindings:!!(form.querySelector('[name="notify"]')||{}).checked,
        reminders:!!(form.querySelector('[name="reminders"]')||{}).checked,
        auditTrail:!!(form.querySelector('[name="audit"]')||{}).checked
      });
      audit("preferences saved");
    }
    if(kind==="admin-policy"){
      write("adminPolicy", {
        requireApproval:!!(form.querySelector('[name="requireApproval"]')||{}).checked,
        requireRecovery:!!(form.querySelector('[name="requireRecovery"]')||{}).checked,
        connectorFreeze:!!(form.querySelector('[name="connectorFreeze"]')||{}).checked
      });
      note("Admin policy saved (local CI workspace)");
      audit("admin policy saved");
    }
    if(kind==="contact-add"){
      var contacts=read("contacts", []);
      contacts.unshift({
        id:"C-"+Date.now(),
        name:(form.querySelector('[name="name"]')||{}).value||"",
        email:(form.querySelector('[name="email"]')||{}).value||"",
        role:(form.querySelector('[name="role"]')||{}).value||"Viewer",
        team:(form.querySelector('[name="team"]')||{}).value||""
      });
      write("contacts", contacts);
      form.reset();
      note("Contact added");
      paintOrganisation();
    }
    if(kind==="support-ticket"){
      var tickets=read("supportTickets", []);
      tickets.unshift({
        id:"T-"+Date.now(),
        at:new Date().toISOString(),
        subject:(form.querySelector('[name="subject"]')||{}).value||"",
        category:(form.querySelector('[name="category"]')||{}).value||"Other",
        status:"Open",
        body:(form.querySelector('[name="body"]')||{}).value||""
      });
      write("supportTickets", tickets);
      form.reset();
      note("Support request submitted (local)");
      paintOrganisation();
    }
    if(kind==="cint-import"){
      var provider=(form.querySelector('[name="provider"]')||{}).value||"github";
      var source=(form.querySelector('[name="source"]')||{}).value||"";
      var branch=(form.querySelector('[name="branch"]')||{}).value||"main";
      var flow=form.getAttribute("data-cint-ihs-flow")||("import."+provider);
      if(provider==="gitlab"||provider==="azure_devops"||provider==="bitbucket"){
        note(provider+" import is deferred — use Local snapshot, ZIP upload, or GitHub");
        return;
      }
      note("Importing "+provider+" "+source+"…");
      fetch(cintPath("import"),{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          provider:provider,
          source:source,
          repository:source,
          repositoryId:source,
          filename:source,
          branch:branch
        })
      }).then(function(r){ return r.json(); }).then(function(body){
        var ing=read("integrationIngress", []);
        ing.push({
          at:new Date().toISOString(),
          kind:"import:"+provider,
          flow:flow,
          source:source+" @"+branch,
          status:(body&&body.ok)?"COMPLETED_LIVE":"FAILED",
          approval:"EXECUTED",
          repo:(body&&body.repository)||source||repo(),
          fileCount:body&&body.fileCount,
          commitSha:body&&body.commitSha
        });
        write("integrationIngress", ing);
        if(!body||!body.ok){
          var failMsg=(body&&body.error)||"Import failed";
          if(body&&body.code==="cint_github_not_connected") failMsg="Connect GitHub OAuth first (or use Local snapshot)";
          if(body&&body.readiness&&body.readiness.blockers&&body.readiness.blockers[0]) failMsg=failMsg+" — "+body.readiness.blockers[0];
          note(failMsg);
          paintIntegrationHosts();
          return;
        }
        if(body.repository){
          var access=body.provider==="local_snapshot"||body.provider==="zip_upload"?"local_extract":"github_live";
          var reposI=read("repos", {});
          reposI[body.repository]={stack:body.provider||provider,branch:branch,commit:body.commitSha||"",access:access,analysis:"imported",fileCount:body.fileCount||0};
          write("repos", reposI);
          try{ localStorage.setItem(NS+"activeRepo", JSON.stringify(body.repository)); }catch(e){}
        }
        if(body.liveIndex&&body.liveIndex.synced){
          try{ localStorage.setItem(NS+"liveIndex", JSON.stringify(body.liveIndex)); }catch(e){}
        }
        note("Imported "+(body.repository||source)+" · "+(body.fileCount||0)+" files"+(body.metadataPersisted?" · liveIndex stamped":""));
        audit("integration import live "+provider+" "+(body.repository||source));
        paintIntegrationHosts();
        refreshGitHubStatus();
        var host=form.closest("[data-cint-integration-host]");
        if(host){
          var log=host.querySelector("[data-cint-ihs-log]");
          if(log) log.textContent="Imported "+(body.repository||source)+" ("+(body.fileCount||0)+" files)"+(body.metadataPersisted?" — liveIndex persisted.":".");
          var okMsg=host.querySelector("[data-cint-ihs-import-success]");
          if(okMsg) okMsg.hidden=false;
        }
        if(typeof paint==="function") paint();
      }).catch(function(){ note("Import network error"); });
    }
    if(kind==="cint-upload"){
      var ukind=(form.querySelector('[name="kind"]')||{}).value||"zip";
      var fileInput=form.querySelector('[name="file"]');
      var file=(fileInput&&fileInput.files&&fileInput.files[0])||null;
      var fname=(form.querySelector('[name="filename"]')||{}).value||(file&&file.name)||"asset.bin";
      var uflow=form.getAttribute("data-cint-ihs-flow")||("upload."+ukind);
      note(file?"Uploading "+fname+"…":"Registering upload "+fname+"…");
      var uploadReq;
      if(file){
        var fd=new FormData();
        fd.append("kind", ukind);
        fd.append("filename", fname);
        fd.append("file", file, fname);
        uploadReq=fetch(cintPath("upload"),{method:"POST",body:fd});
      } else {
        uploadReq=fetch(cintPath("upload"),{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({kind:ukind,filename:fname})
        });
      }
      uploadReq.then(function(r){ return r.json(); }).then(function(body){
        var uing=read("integrationIngress", []);
        uing.push({
          at:new Date().toISOString(),
          kind:"upload:"+ukind,
          flow:uflow,
          source:fname,
          status:(body&&body.ok)?(body.extracted?"EXTRACTED_LIVE":"REGISTERED_LIVE"):"FAILED",
          approval:body&&body.extracted?"EXECUTED":"LEDGER_ONLY",
          repo:(body&&body.repository)||repo(),
          uploadId:body&&body.upload&&body.upload.id,
          fileCount:body&&body.fileCount
        });
        write("integrationIngress", uing);
        if(!body||!body.ok){
          note((body&&body.error)||"Upload failed");
          paintIntegrationHosts();
          return;
        }
        if(body.extracted&&body.repository){
          var reposU=read("repos", {});
          reposU[body.repository]={stack:"zip_upload",branch:"local",commit:body.commitSha||"",access:"zip_extract",analysis:"imported",fileCount:body.fileCount||0};
          write("repos", reposU);
          try{ localStorage.setItem(NS+"activeRepo", JSON.stringify(body.repository)); }catch(e){}
          if(body.liveIndex&&body.liveIndex.synced){
            try{ localStorage.setItem(NS+"liveIndex", JSON.stringify(body.liveIndex)); }catch(e){}
          }
          note("ZIP extracted: "+body.repository+" · "+(body.fileCount||0)+" files");
          audit("integration zip extract "+body.repository);
        } else {
          note("Upload registered on durable ledger: "+fname);
          audit("integration upload register "+ukind+" "+fname);
        }
        paintIntegrationHosts();
        var uhost=form.closest("[data-cint-integration-host]");
        if(uhost){
          var ulog=uhost.querySelector("[data-cint-ihs-log]");
          if(ulog) ulog.textContent=body.extracted
            ?("Extracted "+(body.repository||fname)+" ("+(body.fileCount||0)+" files).")
            :("Upload registered: "+fname+" (durable ledger).");
        }
        var usuccess=form.querySelector(".state-success");
        if(usuccess) usuccess.hidden=false;
        if(body.extracted&&typeof paint==="function") paint();
      }).catch(function(){ note("Upload network error"); });
    }
    if(kind==="login"||kind==="signup"||kind==="forgot"){
      runGatewayAuthForm(form, kind);
      return;
    }
    var ok=form.querySelector(".state-success");
    if(ok){ ok.hidden=false; }
    paint();
  }, true);
})();
${CINT_RUNTIME_END}`;
}

/**
 * Drop host APP_VIEW_NAV / GATEWAY_AUTH / P75 nav that race CI showView + cint.session.
 * Paint must leave one runtime authority (FOC-style quarantine for this product).
 */
export function stripCompetingHostScriptsForCodeIntelligence(js: string | null | undefined): string {
  if (!js?.trim()) return "";
  let next = js;
  next = next.replace(
    /document\.addEventListener\s*\(\s*["']DOMContentLoaded["']\s*,\s*function\s*\(\s*\)\s*\{[\s\S]*?\n\}\s*\)\s*;/g,
    (block) =>
      /completeAuthFormSuccess|PREVIEW_SESSION_KEY\s*=\s*["']replica\.previewSession\.v1["']|function\s+enterAuthenticatedMode/.test(
        block,
      )
        ? ""
        : block,
  );
  next = next.replace(
    /\(function\s*\(\s*\)\s*\{[\s\S]*?function\s+syncWorkspaceChrome[\s\S]*?\}\s*\)\s*\(\s*\)\s*;?/g,
    (block) =>
      /app-user-menu-trigger|P75_SHELL_NAV|data-workspace-chrome/.test(block) &&
      !/replica-cint-runtime-start/.test(block)
        ? ""
        : block,
  );
  if (
    /completeAuthFormSuccess/.test(next) ||
    /PREVIEW_SESSION_KEY\s*=\s*["']replica\.previewSession\.v1["']/.test(next)
  ) {
    // Fail closed: leftover host auth after targeted strip must not ship beside CI.
    next = next
      .split("\n")
      .filter(
        (line) =>
          !/completeAuthFormSuccess|PREVIEW_SESSION_KEY|enterAuthenticatedMode|hasPreviewSession/.test(
            line,
          ),
      )
      .join("\n");
  }
  return next.trim();
}

export function mergeCodeIntelligenceRuntime(js: string | null | undefined, html: string): string {
  if (!htmlHasCodeIntelligenceSurface(html)) {
    return stripCompetingHostScriptsForCodeIntelligence(stripCodeIntelligenceRuntime(js));
  }
  const raw = js ?? "";
  // Fast path: current engine already sealed — do not regenerate ~135KB on every preview paint.
  // earlyWorkspaceRail is mandatory — older 1.31 stamps shared the version string without it.
  if (
    raw.includes(CINT_RUNTIME_START) &&
    raw.includes(CINT_RUNTIME_ENGINE_VERSION) &&
    raw.includes("function ensureRail") &&
    raw.includes("syncShellLayout") &&
    raw.includes("earlyWorkspaceRail") &&
    // B1 IdP: refuse fast-path on pre-1.45 runtimes (nested auth URL or demo-only forgot).
    raw.includes('action:"login"') &&
    raw.includes('action:"forgot"') &&
    raw.includes('cintPath("auth")') &&
    !raw.includes('auth/"+kind') &&
    !raw.includes("Demo reset — continue to sign in")
  ) {
    const cleaned = stripCompetingHostScriptsForCodeIntelligence(raw).trim();
    if (
      cleaned.includes(CINT_RUNTIME_ENGINE_VERSION) &&
      cleaned.includes("__replicaCintShowView") &&
      cleaned.includes("earlyWorkspaceRail") &&
      cleaned.includes('action:"login"') &&
      cleaned.includes('action:"forgot"') &&
      cleaned.includes('cintPath("auth")') &&
      !/completeAuthFormSuccess|replica\.previewSession\.v1|auth\/"\+kind|Demo reset — continue/.test(
        cleaned,
      )
    ) {
      return cleaned;
    }
  }
  // FOC-style quarantine: never concatenate host APP_VIEW_NAV / enforcement into the same
  // script tag as CI. One syntax error in leftover host JS prevents __replicaCintShowView
  // from installing and leaves Sign in stuck on the gateway.
  return generateCodeIntelligenceRuntimeScript().trim();
}
