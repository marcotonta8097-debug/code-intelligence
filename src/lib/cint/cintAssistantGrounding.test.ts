import { describe, expect, it } from "vitest";
import {
  extractCitedIdsFromAnswer,
  formatCintAssistantGroundingBlock,
  hasCintAssistantGrounding,
} from "@/lib/cint/cintAssistantGrounding";

describe("cintAssistantGrounding", () => {
  it("detects empty vs populated grounding", () => {
    expect(hasCintAssistantGrounding({})).toBe(false);
    expect(hasCintAssistantGrounding({ findings: [{ id: "F-1" }] })).toBe(true);
  });

  it("formats findings and refuses inventing when empty", () => {
    const block = formatCintAssistantGroundingBlock({
      repository: "acme/app",
      commitSha: "abc1234",
      live: true,
      findings: [{ id: "F-DEAD-1", title: "Dead file", severity: "SEV-3", file: "x.ts" }],
      evidence: [{ id: "E-1", findingId: "F-DEAD-1", summary: "path hit" }],
      dependencies: [{ name: "react", version: "19", kind: "direct" }],
    });
    expect(block).toContain("F-DEAD-1");
    expect(block).toContain("react@19");
    expect(block).toContain("do not fabricate file contents");
  });

  it("extracts cited ids from answer text", () => {
    const { cited, uncitedKnown } = extractCitedIdsFromAnswer(
      "Finding F-A is real; see E-1.",
      ["F-A", "F-B", "E-1"],
    );
    expect(cited).toEqual(["F-A", "E-1"]);
    expect(uncitedKnown).toEqual(["F-B"]);
  });
});
