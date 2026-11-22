/**
 * Live CI Assistant completion — uses cintLlmConfig (Claude preferred).
 */

import {
  formatCintAssistantGroundingBlock,
  hasCintAssistantGrounding,
  type CintAssistantGroundingInput,
} from "@/lib/cint/cintAssistantGrounding";
import {
  CINT_LLM_NOT_CONFIGURED_CODE,
  cintAnthropicKeyLooksLikeUserToken,
  cintLlmNotConfiguredMessage,
  readCintOpenAiApiKey,
  resolveCintAnthropicModelCandidates,
  resolveCintLlmApiKey,
  resolveCintLlmModel,
  type CintLlmProvider,
} from "@/lib/cint/cintLlmConfig";
import { tracedOpenAiChatCompletionsFetch } from "@/lib/observability/llmCallWrapper";

const ASSISTANT_FETCH_TIMEOUT_MS = 55_000;

export type CintAssistantChatResult =
  | {
      ok: true;
      text: string;
      provider: CintLlmProvider;
      model: string;
      grounded: boolean;
    }
  | {
      ok: false;
      code: typeof CINT_LLM_NOT_CONFIGURED_CODE | "cint_llm_failed";
      message: string;
      status?: number;
    };

export type CintAssistantChatInput = {
  question: string;
  repository?: string | null;
  commitSha?: string | null;
  contextNotes?: string | null;
  grounding?: CintAssistantGroundingInput | null;
};

function assistantAbortSignal(): AbortSignal | undefined {
  try {
    if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
      return AbortSignal.timeout(ASSISTANT_FETCH_TIMEOUT_MS);
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

async function readLlmErrorDetail(res: Response): Promise<string> {
  try {
    const raw = await res.text();
    if (!raw.trim()) return "";
    try {
      const json = JSON.parse(raw) as {
        error?: { message?: string; type?: string; code?: string };
        message?: string;
      };
      const msg =
        json.error?.message ||
        json.message ||
        [json.error?.type, json.error?.code].filter(Boolean).join(" ");
      return String(msg || raw).slice(0, 240);
    } catch {
      return raw.slice(0, 240);
    }
  } catch {
    return "";
  }
}

function isModelNotFoundError(status: number, detail: string): boolean {
  if (status !== 404) return false;
  return /model|not[_ ]found|not_found_error/i.test(detail || "model");
}

async function completeOpenAiAssistant(input: {
  apiKey: string;
  model: string;
  system: string;
  userContent: string;
  grounded: boolean;
  signal?: AbortSignal;
}): Promise<CintAssistantChatResult> {
  const res = await tracedOpenAiChatCompletionsFetch({
    label: "cint.assistant.openai",
    model: input.model,
    init: {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: input.model,
        max_tokens: 1200,
        messages: [
          { role: "system", content: input.system },
          { role: "user", content: input.userContent },
        ],
      }),
      signal: input.signal,
    },
  });
  if (!res.ok) {
    const detail = await readLlmErrorDetail(res);
    return {
      ok: false,
      code: "cint_llm_failed",
      message: `OpenAI error (${res.status})${detail ? `: ${detail}` : ""} [model=${input.model}]`,
      status: res.status,
    };
  }
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = json.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) {
    return { ok: false, code: "cint_llm_failed", message: "Empty OpenAI response" };
  }
  return {
    ok: true,
    text,
    provider: "openai",
    model: input.model,
    grounded: input.grounded,
  };
}

export async function completeCintAssistantChat(
  input: CintAssistantChatInput,
): Promise<CintAssistantChatResult> {
  const resolved = resolveCintLlmApiKey();
  if (!resolved) {
    return {
      ok: false,
      code: CINT_LLM_NOT_CONFIGURED_CODE,
      message: cintLlmNotConfiguredMessage(),
    };
  }
  const grounding = {
    ...(input.grounding || {}),
    repository: input.grounding?.repository ?? input.repository,
    commitSha: input.grounding?.commitSha ?? input.commitSha,
    contextNotes: input.grounding?.contextNotes ?? input.contextNotes,
  };
  const grounded = hasCintAssistantGrounding(grounding);
  const system = [
    "You are the Code Intelligence Assistant inside a sealed engineering co-pilot.",
    "Answer with concrete engineering guidance grounded in the Live workspace grounding block when present.",
    "Cite finding/evidence IDs from that block when relevant. Do not invent sealed authorities or file contents.",
    "If grounding is thin or missing, say the answer is ungrounded and ask for Sync/Analyze — do not fabricate.",
  ].join(" ");
  const userContent = [
    formatCintAssistantGroundingBlock(grounding),
    `Question: ${input.question}`,
  ].join("\n\n");
  const signal = assistantAbortSignal();

  try {
    if (resolved.provider === "anthropic") {
      const candidates = resolveCintAnthropicModelCandidates();
      const attempts: string[] = [];
      let lastFail: CintAssistantChatResult | null = null;

      for (const model of candidates) {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": resolved.apiKey,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            max_tokens: 1200,
            system,
            messages: [{ role: "user", content: userContent }],
          }),
          signal,
        });
        if (!res.ok) {
          const detail = await readLlmErrorDetail(res);
          attempts.push(`${model}→${res.status}`);
          lastFail = {
            ok: false,
            code: "cint_llm_failed",
            message: `Anthropic error (${res.status})${detail ? `: ${detail}` : ""} [model=${model}]`,
            status: res.status,
          };
          if (isModelNotFoundError(res.status, detail)) continue;
          break;
        }
        const json = (await res.json()) as {
          content?: Array<{ type: string; text?: string }>;
        };
        const text = json.content?.find((c) => c.type === "text")?.text?.trim() ?? "";
        if (!text) {
          return { ok: false, code: "cint_llm_failed", message: "Empty Claude response" };
        }
        return { ok: true, text, provider: "anthropic", model, grounded };
      }

      const openAiKey = readCintOpenAiApiKey();
      if (openAiKey) {
        const openAiModel = resolveCintLlmModel("openai");
        const fallback = await completeOpenAiAssistant({
          apiKey: openAiKey,
          model: openAiModel,
          system,
          userContent,
          grounded,
          signal,
        });
        if (fallback.ok) return fallback;
        lastFail = fallback;
      }

      const usrHint = cintAnthropicKeyLooksLikeUserToken(resolved.apiKey)
        ? " Hint: CINT_ANTHROPIC_API_KEY looks like sk-ant-usr-* — use a Console API key (sk-ant-api*) from Anthropic."
        : "";
      const tried = attempts.length ? ` Tried: ${attempts.join(", ")}.` : "";
      return {
        ok: false,
        code: "cint_llm_failed",
        message: `${lastFail && !lastFail.ok ? lastFail.message : "Anthropic failed"}.${tried}${usrHint}`,
        status: lastFail && !lastFail.ok ? lastFail.status : 404,
      };
    }

    return completeOpenAiAssistant({
      apiKey: resolved.apiKey,
      model: resolveCintLlmModel("openai"),
      system,
      userContent,
      grounded,
      signal,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const timedOut = /abort|timeout/i.test(msg);
    return {
      ok: false,
      code: "cint_llm_failed",
      message: timedOut ? `Assistant timed out after ${ASSISTANT_FETCH_TIMEOUT_MS}ms` : msg,
      status: timedOut ? 504 : undefined,
    };
  }
}
