/**
 * CI IdP form bridge — same reliability pattern as host loginPreHydrationScript.
 * Binds login / signup / forgot in the preview document even when the large
 * CINT runtime fails to install. Posts to /api/projects/:id/cint/auth.
 * Does not use Replica host Auth or FOC session keys.
 */

export const CINT_AUTH_INLINE_MARK = "data-cint-auth-inline" as const;

export function cintAuthInlineScriptSource(): string {
  return `(()=>{
  if(window.__cintAuthInlineInstalled) return;
  window.__cintAuthInlineInstalled=true;
  var SESSION_KEY="cint.session.v1";
  function apiOrigin(){
    try{
      if(window.top&&window.top.location&&window.top.location.origin&&window.top.location.origin!=="null"){
        return window.top.location.origin;
      }
    }catch(e){}
    try{ if(location.origin&&location.origin!=="null") return location.origin; }catch(e2){}
    return "";
  }
  function projectId(){
    var shell=document.querySelector("[data-cint-app-shell],[data-product-surface='code_intelligence'],[data-cint-shell]");
    var fromShell=shell&&(shell.getAttribute("data-cint-project-id")||shell.getAttribute("data-replica-project-id")||shell.getAttribute("data-project-id"));
    if(fromShell&&fromShell!=="local"&&fromShell!=="oauth") return fromShell;
    try{
      var fromHtml=document.documentElement.getAttribute("data-cint-project-id")||document.documentElement.getAttribute("data-replica-project-id");
      if(fromHtml&&fromHtml!=="local"&&fromHtml!=="oauth") return fromHtml;
    }catch(e){}
    var path="";
    try{ if(window.top&&window.top.location) path=window.top.location.pathname||""; }catch(e2){}
    if(!path) try{ path=location.pathname||""; }catch(e3){}
    var m=path.match(/\\/(?:projects|preview|deploy)\\/([^/]+)/);
    if(m&&m[1]&&m[1]!=="local"&&m[1]!=="oauth") return m[1];
    return "local";
  }
  function authUrl(){
    return apiOrigin()+"/api/projects/"+encodeURIComponent(projectId())+"/cint/auth";
  }
  function status(form, msg, bad){
    if(!form) return;
    var el=form.querySelector("[data-cint-auth-status]");
    if(!el){
      el=document.createElement("p");
      el.setAttribute("data-cint-auth-status","1");
      el.setAttribute("aria-live","polite");
      el.className="cint-purpose";
      var btn=form.querySelector("[data-cint-auth-submit],button[type='submit']");
      if(btn&&btn.parentNode===form) form.insertBefore(el, btn);
      else form.appendChild(el);
    }
    el.textContent=msg||"";
    el.style.display=msg?"block":"";
    el.style.fontWeight=msg?"600":"";
    el.style.color=bad?"#b45309":"#0f766e";
  }
  function setBusy(btn, on, idle){
    if(!btn) return;
    if(on){
      if(!btn.getAttribute("data-cint-auth-idle-label")) btn.setAttribute("data-cint-auth-idle-label", (btn.textContent||"").trim()||idle||"Continue");
      btn.disabled=true;
      btn.setAttribute("aria-busy","true");
      var lab=btn.getAttribute("data-cint-auth-idle-label")||"";
      btn.textContent=/reset|send/i.test(lab)?"Sending…":(/create/i.test(lab)?"Creating…":"Signing in…");
    } else {
      btn.disabled=false;
      btn.removeAttribute("aria-busy");
      var prev=btn.getAttribute("data-cint-auth-idle-label");
      if(prev) btn.textContent=prev;
    }
  }
  function writeSession(session){
    try{ sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)); }catch(e){}
    try{ localStorage.removeItem(SESSION_KEY); }catch(e2){}
  }
  function openOverview(){
    var shell=document.querySelector("[data-cint-app-shell]");
    if(shell){
      shell.setAttribute("data-cint-authed","1");
      shell.setAttribute("data-cint-zone","workspace");
      shell.setAttribute("data-cint-rail-on","1");
    }
    try{
      if(typeof window.__replicaCintShowView==="function"){
        if(window.__replicaCintShowView("overview")) return;
      }
    }catch(e){}
    try{ location.hash="#overview"; }catch(e2){}
    document.querySelectorAll("[data-view]").forEach(function(p){
      var v=(p.getAttribute("data-view")||"").toLowerCase();
      if(v==="overview"||v==="dashboard"||v==="command-centre"){
        p.removeAttribute("hidden"); p.hidden=false;
      } else if(v==="login"||v==="signup"||v==="forgot-password"||v==="landing"){
        p.setAttribute("hidden",""); p.hidden=true;
      }
    });
  }
  function postAuth(body){
    return fetch(authUrl(),{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      credentials:"same-origin",
      body:JSON.stringify(body)
    }).then(function(r){
      return r.text().then(function(txt){
        var j={};
        try{ j=txt?JSON.parse(txt):{}; }catch(e){ j={ ok:false, error:"Auth API returned non-JSON ("+r.status+")" }; }
        return { http:r.status, body:j };
      });
    });
  }
  function bindForm(form){
    if(!form||form.getAttribute("data-cint-auth-inline-bound")==="1") return;
    form.setAttribute("data-cint-auth-inline-bound","1");
    try{ form.setAttribute("onsubmit","return false;"); }catch(e){}
    function run(ev){
      if(ev){ try{ ev.preventDefault(); ev.stopPropagation(); }catch(e){} }
      var kind=(form.getAttribute("data-cint-form")||form.getAttribute("data-cint-auth-action")||"login").toLowerCase();
      if(kind==="forgot-password") kind="forgot";
      var btn=form.querySelector("[data-cint-auth-submit],button[type='submit']");
      if(btn&&btn.disabled) return;
      var email=((form.querySelector("[name='email']")||{}).value||"").trim();
      var password=((form.querySelector("[name='password']")||{}).value||"");
      var displayName=((form.querySelector("[name='name'],[name='displayName']")||{}).value||"");
      if(kind==="forgot"){
        if(!email){ status(form,"Email required",true); return; }
        status(form,"Sending reset link… · "+authUrl(),false);
        setBusy(btn,true,"Send reset link");
        var redirectTo="";
        try{ redirectTo=String((window.top&&window.top.location&&window.top.location.href)||location.href||"").split("#")[0]; }catch(e){}
        postAuth({action:"forgot",email:email,redirectTo:redirectTo||undefined}).then(function(res){
          setBusy(btn,false);
          var b=res.body||{};
          if(b.ok){ status(form,b.message||"Reset email sent — check inbox, then sign in",false); return; }
          status(form,b.error||("Reset failed ("+res.http+")"),true);
        }).catch(function(){
          setBusy(btn,false);
          status(form,"Reset network error — "+authUrl(),true);
        });
        return;
      }
      if(kind!=="login"&&kind!=="signup") return;
      if(!email||!password){ status(form,"Email and password required",true); return; }
      if(kind==="signup"&&String(password).length<8){ status(form,"Password must be at least 8 characters",true); return; }
      status(form,(kind==="signup"?"Creating account…":"Signing in…")+" · "+authUrl(),false);
      setBusy(btn,true,kind==="signup"?"Create":"Continue");
      var payload=kind==="signup"
        ?{action:"signup",email:email,password:password,displayName:displayName||undefined}
        :{action:"login",email:email,password:password};
      postAuth(payload).then(function(res){
        var b=res.body||{};
        if(b.ok&&b.session&&b.session.authed){
          writeSession(b.session);
          status(form,(b.session.authMode==="idp"?"IdP":"Signed in")+" — opening Overview",false);
          openOverview();
          setBusy(btn,false);
          return;
        }
        if(b.code==="cint_auth_not_configured"||res.http===503){
          var at=Date.now();
          writeSession({
            authed:true,authMode:"demo",demo:true,at:at,
            expiresAt:at+(1000*60*60*24),
            userId:"demo:"+(email||"anonymous").toLowerCase(),
            email:(email||"demo@eng-platform.local").toLowerCase(),
            displayName:displayName||"Demo Engineer",
            role:"Admin"
          });
          status(form,"Demo sign-in (IdP not configured) — opening Overview",false);
          openOverview();
          setBusy(btn,false);
          return;
        }
        setBusy(btn,false);
        status(form,b.error||("Sign-in failed ("+res.http+")"),true);
      }).catch(function(){
        setBusy(btn,false);
        status(form,"Auth network error — "+authUrl(),true);
      });
    }
    form.addEventListener("submit", run, true);
    form.addEventListener("click", function(ev){
      var t=ev.target;
      if(!t||!t.closest) return;
      var btn=t.closest("[data-cint-auth-submit],button[type='submit']");
      if(!btn||!form.contains(btn)) return;
      run(ev);
    }, true);
  }
  function bindAll(){
    document.querySelectorAll("form[data-cint-form='login'],form[data-cint-form='signup'],form[data-cint-form='forgot'],form[data-cint-auth-action]").forEach(bindForm);
  }
  bindAll();
  try{
    var mo=new MutationObserver(function(){ bindAll(); });
    mo.observe(document.documentElement,{childList:true,subtree:true});
  }catch(e){}
})();`;
}

/** Inject host-style inline auth bridge into CI HTML (idempotent). */
export function injectCintAuthInlineScript(html: string): string {
  if (!html || !/\bdata-cint-(?:form|auth-action|app-shell)\b/i.test(html)) return html;
  // Exact attribute on script tag — do not match data-cint-auth-inline-bound inside source.
  if (html.includes(`${CINT_AUTH_INLINE_MARK}=`)) return html;
  const script = `<script ${CINT_AUTH_INLINE_MARK}="1">${cintAuthInlineScriptSource()}</script>`;
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${script}</body>`);
  }
  if (/<\/html>/i.test(html)) {
    return html.replace(/<\/html>/i, `${script}</html>`);
  }
  return `${html}\n${script}`;
}
