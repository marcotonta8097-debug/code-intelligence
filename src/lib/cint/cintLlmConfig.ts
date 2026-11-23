/**
 * Code Intelligence LLM keys — product-owned, separate from Replica OPENAI_API_KEY
 * and FOC_VOICE_API_KEY.
 *
 * Prefer Claude for deep Assistant / analysis; OpenAI optional for routing/light tasks.
 */

export const CINT_LLM_NOT_CONFIGURED_CODE = "cint_llm_not_configured" as const;

export type CintLlmProvider = "anthropic" | "openai";

export function readCintAnthropicApiKey(): string | undefined {
  return (
    process.env.CINT_ANTHROPIC_API_KEY?.trim() ||
    process.env.CINT_CLAUDE_API_KEY?.trim() ||
    undefined
  );
}

export function readCintOpenAiApiKey(): string | undefined {
  return (
    process.env.CINT_LLM_API_KEY?.trim() ||
    process.env.CINT_OPENAI_API_KEY?.trim() ||
    undefined
  );
}

export function resolveCintLlmProvider(): CintLlmProvider | null {
  const forced = (process.env.CINT_LLM_PROVIDER?.trim() || "").toLowerCase();
  if (forced === "anthropic" || forced === "claude") {
    return readCintAnthropicApiKey() ? "anthropic" : null;
  }
  if (forced === "openai") {
    return readCintOpenAiApiKey() ? "openai" : null;
  }
  // Default: Claude when present (advanced CI reasoning), else OpenAI.
  if (readCintAnthropicApiKey()) return "anthropic";
  if (readCintOpenAiApiKey()) return "openai";
  return null;
}

export function resolveCintLlmApiKey(): { provider: CintLlmProvider; apiKey: string } | null {
  const provider = resolveCintLlmProvider();
  if (provider === "anthropic") {
    const apiKey = readCintAnthropicApiKey();
    return apiKey ? { provider, apiKey } : null;
  }
  if (provider === "openai") {
    const apiKey = readCintOpenAiApiKey();
    return apiKey ? { provider, apiKey } : null;
  }
  return null;
}

/** Default Anthropic Messages API models — tried in order on 404 not_found. */
export const CINT_ANTHROPIC_MODEL_FALLBACKS = [
  "claude-sonnet-5-5",
  "claude-sonnet-4-5-20250929",
  "claude-sonnet-4-5",
  "claude-haiku-4-5-20251001",
  "claude-3-5-sonnet-20241022",
] as const;

export function resolveCintLlmModel(provider: CintLlmProvider = resolveCintLlmProvider() ?? "anthropic"): string {
  if (provider === "anthropic") {
    return (
      process.env.CINT_ANTHROPIC_MODEL?.trim() ||
      process.env.CINT_LLM_MODEL?.trim() ||
      CINT_ANTHROPIC_MODEL_FALLBACKS[0]
    );
  }
  // Do not reuse CINT_LLM_MODEL when it holds a Claude id (common dual-key setups).
  return process.env.CINT_OPENAI_MODEL?.trim() || "gpt-4o";
}

/** Primary + unique fallbacks for Anthropic 404 model not_found recovery. */
export function resolveCintAnthropicModelCandidates(): string[] {
  const primary = resolveCintLlmModel("anthropic");
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of [primary, ...CINT_ANTHROPIC_MODEL_FALLBACKS]) {
    const m = id.trim();
    if (!m || seen.has(m)) continue;
    seen.add(m);
    out.push(m);
  }
  return out;
}

export function cintAnthropicKeyLooksLikeUserToken(apiKey: string): boolean {
  return /^sk-ant-usr-/i.test(apiKey.trim());
}

export function isCintLlmConfigured(): boolean {
  return resolveCintLlmApiKey() != null;
}

export function cintLlmNotConfiguredMessage(): string {
  return "Code Intelligence LLM is not configured (set CINT_ANTHROPIC_API_KEY and/or CINT_LLM_API_KEY).";
}
