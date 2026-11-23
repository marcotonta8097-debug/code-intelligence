import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cintSupabaseNotConfiguredMessage,
  getCintSupabaseConfig,
  isCintSupabaseConfigured,
} from "@/lib/cint/cintSupabaseConfig";
import {
  isCintLlmConfigured,
  resolveCintLlmApiKey,
  resolveCintLlmModel,
  resolveCintLlmProvider,
} from "@/lib/cint/cintLlmConfig";
import { cintStoreMode } from "@/lib/cint/cintEntityStore";

describe("CINT product config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("stays unconfigured without CINT_SUPABASE_* (does not use Replica SUPABASE_URL)", () => {
    vi.stubEnv("SUPABASE_URL", "https://replica.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "replica-service");
    vi.stubEnv("CINT_SUPABASE_URL", "");
    vi.stubEnv("CINT_SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("CINT_SUPABASE_ANON_KEY", "");
    expect(isCintSupabaseConfigured()).toBe(false);
    expect(getCintSupabaseConfig()).toBeNull();
    expect(cintStoreMode()).toBe("memory");
    expect(cintSupabaseNotConfiguredMessage()).toMatch(/CINT_SUPABASE_URL/);
  });

  it("prefers CINT service role when URL + service key set", () => {
    vi.stubEnv("CINT_SUPABASE_URL", "https://ci.supabase.co");
    vi.stubEnv("CINT_SUPABASE_SERVICE_ROLE_KEY", "ci-service");
    vi.stubEnv("CINT_SUPABASE_ANON_KEY", "ci-anon");
    const cfg = getCintSupabaseConfig();
    expect(cfg).toEqual({
      url: "https://ci.supabase.co",
      key: "ci-service",
      mode: "service_role",
    });
    expect(cintStoreMode()).toBe("supabase");
  });

  it("defaults LLM provider to anthropic when Claude key present", () => {
    vi.stubEnv("CINT_ANTHROPIC_API_KEY", "claude-key");
    vi.stubEnv("CINT_LLM_API_KEY", "openai-key");
    vi.stubEnv("CINT_LLM_PROVIDER", "");
    expect(resolveCintLlmProvider()).toBe("anthropic");
    expect(resolveCintLlmApiKey()).toEqual({ provider: "anthropic", apiKey: "claude-key" });
    expect(resolveCintLlmModel("anthropic")).toMatch(/claude/i);
    expect(isCintLlmConfigured()).toBe(true);
  });
});
