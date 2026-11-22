import { describe, expect, it } from "vitest";
import {
  buildCintProductSourcePack,
  cintProductPackToRepositoryTree,
  isCintProductAllowlistedPath,
  CINT_PRODUCT_PACK_VERSION,
  CINT_PRODUCT_REPOSITORY_ID,
} from "@/lib/cint/cintProductSourcePack";

describe("CINT product source pack (standalone subject)", () => {
  it("allowlists only CINT product paths — not Replica factory chrome", () => {
    expect(isCintProductAllowlistedPath("src/lib/cint/cintAuthService.ts")).toBe(true);
    expect(isCintProductAllowlistedPath("src/core/codeIntelligence/repositoryIntelligenceEngine.ts")).toBe(
      true,
    );
    expect(isCintProductAllowlistedPath("src/lib/interaction/codeIntelligenceRuntime.ts")).toBe(true);
    expect(isCintProductAllowlistedPath("package.json")).toBe(true);
    expect(isCintProductAllowlistedPath("src/routes/index.tsx")).toBe(false);
    expect(isCintProductAllowlistedPath("src/lib/foc/focClientStorage.ts")).toBe(false);
    expect(isCintProductAllowlistedPath("src/core/lab/voiceGateLab.ts")).toBe(false);
    expect(isCintProductAllowlistedPath("../secret")).toBe(false);
  });

  it("builds a real CINT-only pack with identity files and product sources", () => {
    const pack = buildCintProductSourcePack();
    expect(pack.product).toBe("code_intelligence");
    expect(pack.packVersion).toBe(CINT_PRODUCT_PACK_VERSION);
    expect(pack.repositoryId).toBe(CINT_PRODUCT_REPOSITORY_ID);
    expect(pack.fileCount).toBeGreaterThan(20);
    const paths = pack.files.map((f) => f.path);
    expect(paths).toContain("package.json");
    expect(paths).toContain("README.md");
    expect(paths).toContain("cint.product.json");
    expect(paths.some((p) => p.startsWith("src/lib/cint/"))).toBe(true);
    expect(paths.some((p) => p.startsWith("src/core/codeIntelligence/"))).toBe(true);
    expect(paths.every((p) => isCintProductAllowlistedPath(p))).toBe(true);
    expect(paths.some((p) => p.includes("focClientStorage"))).toBe(false);
    const readme = pack.files.find((f) => f.path === "README.md")?.content || "";
    expect(readme).toMatch(/standalone/i);
    expect(readme).not.toMatch(/Replica factory monorepo as the product/i);
  });

  it("converts pack to analyzable repository tree", () => {
    const pack = buildCintProductSourcePack({ maxFiles: 40 });
    const tree = cintProductPackToRepositoryTree(pack);
    expect(tree.id).toBe(CINT_PRODUCT_REPOSITORY_ID);
    expect(tree.files.length).toBe(pack.fileCount);
    expect(tree.files.some((f) => f.path === "package.json" && f.content)).toBe(true);
  });
});
