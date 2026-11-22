import { describe, expect, it } from "vitest";
import { buildStoredZipFixture, extractZipToRepositoryTree } from "@/lib/cint/cintZipExtract";

describe("cintZipExtract", () => {
  it("extracts stored ZIP entries into a repository tree", () => {
    const zip = buildStoredZipFixture([
      { path: "README.md", content: "# hello\n" },
      { path: "src/main.go", content: "package main\nfunc main() {}\n" },
      { path: "__MACOSX/._junk", content: "skip" },
    ]);
    const result = extractZipToRepositoryTree(zip, { repositoryId: "demo-zip" });
    expect(result.tree.id).toBe("demo-zip");
    expect(result.tree.files.map((f) => f.path).sort()).toEqual(["README.md", "src/main.go"]);
    expect(result.tree.files.find((f) => f.path === "README.md")?.content).toContain("hello");
    expect(result.skipped).toBeGreaterThanOrEqual(1);
  });

  it("rejects empty / corrupt archives", () => {
    expect(() => extractZipToRepositoryTree(Buffer.from("not-a-zip"))).toThrow();
  });
});
