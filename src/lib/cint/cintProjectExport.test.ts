import { describe, expect, it } from "vitest";
import { buildCintFullProductExportFiles } from "@/lib/cint/cintProjectExport";

const CINT_FILES = {
  preview: {
    html: `<div class="app-shell" data-cint-app-shell="1" data-product-surface="code_intelligence"><main>CI</main></div>`,
    css: ".app-shell{display:flex}",
    js: "window.__cint=1;",
  },
};

const CINT_META = {
  productFamily: "code_intelligence",
  fieldRegistryId: "field:code_intelligence",
};

describe("CINT full server export", () => {
  it("includes product source pack under src/ + backend/api", () => {
    const files = buildCintFullProductExportFiles({
      projectName: "Code Intelligence",
      files: CINT_FILES,
      metadata: CINT_META,
    });
    const paths = files.map((f) => f.path);
    expect(paths.some((p) => p.startsWith("src/lib/cint/"))).toBe(true);
    expect(paths.some((p) => p.startsWith("src/core/codeIntelligence/"))).toBe(true);
    expect(paths.some((p) => p.startsWith("backend/api/"))).toBe(true);
    expect(paths).toContain("frontend/index.html");
    expect(files.length).toBeGreaterThan(40);
  });
});
