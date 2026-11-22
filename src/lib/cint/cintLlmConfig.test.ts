import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CINT_ANTHROPIC_MODEL_FALLBACKS,
  cintAnthropicKeyLooksLikeUserToken,
  resolveCintAnthropicModelCandidates,
  resolveCintLlmModel,
} from "@/lib/cint/cintLlmConfig";

describe("cintLlmConfig anthropic models", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to sonnet 5.5 and lists unique fallbacks", () => {
    vi.stubEnv("CINT_LLM_MODEL", "");
    vi.stubEnv("CINT_ANTHROPIC_MODEL", "");
    expect(resolveCintLlmModel("anthropic")).toBe("claude-sonnet-5-5");
    const candidates = resolveCintAnthropicModelCandidates();
    expect(candidates[0]).toBe("claude-sonnet-5-5");
    expect(candidates.length).toBe(CINT_ANTHROPIC_MODEL_FALLBACKS.length);
    expect(new Set(candidates).size).toBe(candidates.length);
  });

  it("puts env override first in candidates", () => {
    vi.stubEnv("CINT_ANTHROPIC_MODEL", "claude-haiku-4-5-20251001");
    const candidates = resolveCintAnthropicModelCandidates();
    expect(candidates[0]).toBe("claude-haiku-4-5-20251001");
    expect(candidates.filter((m) => m === "claude-haiku-4-5-20251001")).toHaveLength(1);
  });

  it("detects sk-ant-usr user tokens", () => {
    expect(cintAnthropicKeyLooksLikeUserToken("sk-ant-usr-abc")).toBe(true);
    expect(cintAnthropicKeyLooksLikeUserToken("sk-ant-api03-abc")).toBe(false);
  });
});
