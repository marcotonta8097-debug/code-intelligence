import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cintAuthNotConfiguredMessage,
  cintAuthRequestPasswordReset,
  isCintAuthConfigured,
  cintAuthSignIn,
  normalizeCintExpiresAtMs,
} from "@/lib/cint/cintAuthService";

describe("cintAuthService config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not treat Replica SUPABASE_* as CI IdP", () => {
    vi.stubEnv("SUPABASE_URL", "https://replica.supabase.co");
    vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "replica-anon");
    vi.stubEnv("CINT_SUPABASE_URL", "");
    vi.stubEnv("CINT_SUPABASE_ANON_KEY", "");
    expect(isCintAuthConfigured()).toBe(false);
    expect(cintAuthNotConfiguredMessage()).toMatch(/CINT_SUPABASE/);
  });

  it("requires CINT URL + anon/publishable for IdP client", () => {
    vi.stubEnv("CINT_SUPABASE_URL", "https://ci.supabase.co");
    vi.stubEnv("CINT_SUPABASE_SERVICE_ROLE_KEY", "ci-service");
    vi.stubEnv("CINT_SUPABASE_ANON_KEY", "");
    expect(isCintAuthConfigured()).toBe(false);
    vi.stubEnv("CINT_SUPABASE_ANON_KEY", "ci-anon");
    expect(isCintAuthConfigured()).toBe(true);
  });

  it("sign-in fails closed when IdP not configured", async () => {
    vi.stubEnv("CINT_SUPABASE_URL", "");
    vi.stubEnv("CINT_SUPABASE_ANON_KEY", "");
    const result = await cintAuthSignIn("a@b.co", "password1");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("cint_auth_not_configured");
      expect(result.status).toBe(503);
    }
  });

  it("password reset fails closed when IdP not configured", async () => {
    vi.stubEnv("CINT_SUPABASE_URL", "");
    vi.stubEnv("CINT_SUPABASE_ANON_KEY", "");
    const result = await cintAuthRequestPasswordReset({ email: "a@b.co" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("cint_auth_not_configured");
      expect(result.status).toBe(503);
    }
  });

  it("normalizes Supabase expires_at seconds to ms", () => {
    const at = 1_700_000_000_000;
    expect(normalizeCintExpiresAtMs(1_700_000_100, at)).toBe(1_700_000_100_000);
    expect(normalizeCintExpiresAtMs(1_700_000_100_000, at)).toBe(1_700_000_100_000);
    expect(normalizeCintExpiresAtMs(1_600_000_000, at)).toBeUndefined();
  });
});
