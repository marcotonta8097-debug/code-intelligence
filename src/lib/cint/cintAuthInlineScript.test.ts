import { describe, expect, it } from "vitest";
import {
  CINT_AUTH_INLINE_MARK,
  cintAuthInlineScriptSource,
  injectCintAuthInlineScript,
} from "@/lib/cint/cintAuthInlineScript";

describe("cintAuthInlineScript (host loginPreHydration pattern)", () => {
  it("emits login/signup/forgot posts to cint/auth and session key", () => {
    const src = cintAuthInlineScriptSource();
    expect(src).toContain('action:"login"');
    expect(src).toContain('action:"signup"');
    expect(src).toContain('action:"forgot"');
    expect(src).toContain("/cint/auth");
    expect(src).toContain("cint.session.v1");
    expect(src).toContain("data-cint-form");
    expect(src).not.toContain("replica.hostSession.v1");
    expect(src).not.toContain("/api/auth/login");
  });

  it("injects once into CI html", () => {
    const html =
      '<div data-cint-app-shell="1"><form data-cint-form="login"></form></div></body></html>';
    const once = injectCintAuthInlineScript(html);
    expect(once).toContain(`${CINT_AUTH_INLINE_MARK}="1"`);
    expect(once).toContain("cint.session.v1");
    const twice = injectCintAuthInlineScript(once);
    expect(twice.match(new RegExp(`${CINT_AUTH_INLINE_MARK}="1"`, "g"))).toHaveLength(1);
    expect(twice).toBe(once);
  });
});
