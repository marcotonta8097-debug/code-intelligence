import { describe, expect, it } from "vitest";
import { generateCodeIntelligenceRuntimeScript } from "@/lib/interaction/codeIntelligenceRuntime";
import { GATEWAY_AUTH_FLOW_SCRIPT } from "@/lib/wiring/gatewayAuthFlowScript";
import { stripCompetingHostScriptsForCodeIntelligence } from "@/lib/interaction/codeIntelligenceRuntime";

describe("CI auth alignment (B1 audit)", () => {
  it("runtime posts only /cint/auth with action (no nested auth/login)", () => {
    const js = generateCodeIntelligenceRuntimeScript();
    expect(js).toContain('cintPath("auth")');
    expect(js).toContain('action:"login"');
    expect(js).toContain('action:"signup"');
    expect(js).toContain('action:"forgot"');
    expect(js).not.toContain('auth/"+kind');
    expect(js).not.toContain("auth/login");
    expect(js).not.toContain("auth/signup");
    expect(js).not.toContain("Demo reset — continue to sign in");
    expect(js).toContain("CINT-EE-1.60");
    expect(js).toContain("demo Admin is disabled");
    expect(js).toContain("function authHeaders");
    expect(js).toContain("function authBearerHeaders");
    expect(js).toContain("function authGateMessage");
    expect(js).toContain('cintPath("github/status"),{headers:authHeaders()}');
    expect(js).toContain("runLiveAnalysis");
    expect(js).toContain("runGithubConnectAction");
    expect(js).toContain("publish-product");
    expect(js).toContain("load-self");
    expect(js).toContain("github/publish-product");
    expect(js).toContain("data-cint-analysis-run");
    expect(js).toContain("data-cint-github-action");
    expect(js).toContain("paintKil");
    expect(js).toContain("data-cint-kil");
    expect(js).toContain("__cintAuthInlineInstalled");
    expect(js).toContain("data-cint-auth-inline");
    expect(js).toContain("setAuthBusy");
    expect(js).toContain("Signing in…");
    expect(js).toContain("recoverStuckAuthShell");
    expect(js).toContain("Never stamp workspace/authed before Overview is visible");
    expect(js).toContain("(?:projects|preview|deploy)");
    expect(js).toContain("syncProjectId");
    expect(js).toContain('cintPath("admin")');
    expect(js).toContain('action:"bootstrap"');
    expect(js).toContain('action:"set_role"');
    expect(js).toContain("data-cint-admin-promote");
    expect(js).toContain("Claiming workspace Admin");
  });

  it("gateway script does not invent or clear CI sessions", () => {
    expect(GATEWAY_AUTH_FLOW_SCRIPT).toContain("isCintProductShell");
    expect(GATEWAY_AUTH_FLOW_SCRIPT).toContain(
      "CI owns IdP/demo via codeIntelligenceRuntime",
    );
    expect(GATEWAY_AUTH_FLOW_SCRIPT).toContain(
      "Host gateway never owns or clears cint.session.v1",
    );
    expect(GATEWAY_AUTH_FLOW_SCRIPT).not.toContain(
      'sessionStorage.removeItem("cint.session.v1")',
    );
    expect(GATEWAY_AUTH_FLOW_SCRIPT).not.toMatch(
      /if\(isCintProductShell\(\)\)\{\s*persistCintProductSession\(\);\s*setAppAuthState\(true\)/,
    );
  });

  it("strips host gateway auth when mixed into CI js", () => {
    const dirty = `${GATEWAY_AUTH_FLOW_SCRIPT}\n/* replica-cint-runtime-start */\nvoid 0;\n/* replica-cint-runtime-end */`;
    const cleaned = stripCompetingHostScriptsForCodeIntelligence(dirty);
    expect(cleaned).not.toContain("completeAuthFormSuccess");
  });
});
