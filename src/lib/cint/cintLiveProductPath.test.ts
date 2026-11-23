import { describe, expect, it } from "vitest";
import { isCintLlmConfigured, resolveCintLlmProvider } from "@/lib/cint/cintLlmConfig";
import { isCintGitHubOAuthConfigured } from "@/lib/cint/cintGitHubConfig";
import {
  sealCodeIntelligenceLiveIndexEvidence,
  isCodeIntelligenceLiveIndexSynced,
} from "@/lib/cint/cintGitHubConnectionStore";
import { isCodeIntelligenceLiveIndexSynced as leafSynced } from "@/core/codeIntelligence/codeIntelligenceConnectorStatus";

describe("CI live product config owners", () => {
  it("exposes LLM + GitHub config gates without throwing", () => {
    expect(typeof isCintLlmConfigured()).toBe("boolean");
    expect(resolveCintLlmProvider() === null || typeof resolveCintLlmProvider() === "string").toBe(
      true,
    );
    expect(typeof isCintGitHubOAuthConfigured()).toBe("boolean");
  });

  it("stamps live index evidence readable by honesty leaf", () => {
    const { metadata, evidence } = sealCodeIntelligenceLiveIndexEvidence(
      {},
      { repository: "acme/ci", commitSha: "fff", fileCount: 3 },
    );
    expect(evidence.synced).toBe(true);
    expect(isCodeIntelligenceLiveIndexSynced(metadata)).toBe(true);
    expect(leafSynced(metadata)).toBe(true);
  });
});
