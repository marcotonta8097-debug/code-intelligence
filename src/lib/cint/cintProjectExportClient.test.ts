import { describe, expect, it } from "vitest";
import {
  buildCintClientExportSurface,
  isCintExportProject,
} from "@/lib/cint/cintProjectExportClient";

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
  pageContract: { pages: ["landing", "overview", "repositories"] },
};

describe("CINT client export surface", () => {
  it("detects CINT export projects", () => {
    expect(isCintExportProject(CINT_FILES, CINT_META)).toBe(true);
    expect(
      isCintExportProject(
        { preview: { html: "<main>hello</main>", css: "", js: "" } },
        { productFamily: "public_website" },
      ),
    ).toBe(false);
  });

  it("exposes frontend, backend, and json trees like peer apps", () => {
    const files = buildCintClientExportSurface({
      projectName: "Code Intelligence",
      description: "Standalone CI",
      files: CINT_FILES,
      metadata: CINT_META,
    });
    const paths = files.map((f) => f.path);
    expect(paths).toContain("frontend/index.html");
    expect(paths).toContain("frontend/body.html");
    expect(paths).toContain("frontend/styles.css");
    expect(paths).toContain("frontend/app.js");
    expect(paths).toContain("backend/routes.json");
    expect(paths).toContain("json/cint.product.json");
    expect(paths).toContain("json/page-contract.json");
    expect(paths).toContain("package.json");
    expect(paths).toContain("README.md");
    expect(files.length).toBeGreaterThan(3);
  });
});
