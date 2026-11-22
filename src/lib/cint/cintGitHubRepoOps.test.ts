import { describe, expect, it } from "vitest";
import {
  isLowValueContentPath,
  normalizeCintGitHubFullName,
  rankCintSyncBlobs,
} from "@/lib/cint/cintGitHubRepoOps";

describe("normalizeCintGitHubFullName", () => {
  it("accepts bare owner/repo", () => {
    expect(normalizeCintGitHubFullName("acme/payments-api")).toBe("acme/payments-api");
  });

  it("normalizes https github URLs used by IHS import form", () => {
    expect(normalizeCintGitHubFullName("https://github.com/acme/payments-api")).toBe(
      "acme/payments-api",
    );
    expect(normalizeCintGitHubFullName("https://github.com/acme/payments-api.git")).toBe(
      "acme/payments-api",
    );
    expect(normalizeCintGitHubFullName("https://github.com/acme/payments-api/tree/main")).toBe(
      "acme/payments-api",
    );
  });

  it("rejects empty or non-github paths", () => {
    expect(normalizeCintGitHubFullName("")).toBeNull();
    expect(normalizeCintGitHubFullName("payments-api")).toBeNull();
  });
});

describe("rankCintSyncBlobs / content priority", () => {
  it("puts package.json ahead of .cursor plan markdown", () => {
    const ranked = rankCintSyncBlobs([
      { path: ".cursor/plans/sprint.plan.md" },
      { path: "src/index.ts" },
      { path: "package.json" },
      { path: "README.md" },
    ]);
    expect(ranked[0]?.path).toBe("package.json");
    expect(isLowValueContentPath(".cursor/plans/sprint.plan.md")).toBe(true);
    expect(isLowValueContentPath("package.json")).toBe(false);
  });
});
