/**
 * Client-safe CINT export surface (frontend / backend / json).
 * No filesystem — safe for Code tab + static export UI.
 */

import { buildPreviewSrcDoc, getPreviewBundle } from "@/lib/projectPreview";
import { detectPublishedProductKind } from "@/lib/deploy/publishedProductDetect";
import { CINT_PRODUCT_PACK_VERSION, CINT_PRODUCT_REPO_SLUG } from "@/lib/cint/cintProductSourcePack.constants";

export type CintStaticExportFile = {
  path: string;
  content: string;
};

export type CintExportBuildInput = {
  projectName: string;
  description?: string | null;
  files: unknown;
  metadata?: unknown;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function isCintExportProject(files: unknown, metadata?: unknown): boolean {
  const bundle = getPreviewBundle(files);
  return detectPublishedProductKind(bundle.html || "", metadata) === "code_intelligence";
}

function safeJson(value: unknown): string {
  try {
    return `${JSON.stringify(value, null, 2)}\n`;
  } catch {
    return "{}\n";
  }
}

function sanitizeMetadataForExport(metadata: unknown): Record<string, unknown> {
  const meta = asRecord(metadata) ?? {};
  const out: Record<string, unknown> = {};
  const keep = [
    "productFamily",
    "productType",
    "fieldRegistryId",
    "honestLabel",
    "pageContract",
    "frozenProjectTruth",
    "cint",
    "codeIntelligence",
  ];
  for (const key of keep) {
    if (key in meta) out[key] = meta[key];
  }
  for (const [k, v] of Object.entries(meta)) {
    if (/token|secret|password|apiKey|accessToken/i.test(k)) continue;
    if (k.startsWith("cint.") || k.startsWith("codeIntelligence") || /pgms|pgbe|scw|fpt/i.test(k)) {
      out[k] = v;
    }
  }
  return out;
}

function cintReadme(projectName: string, description?: string | null): string {
  return [
    `# ${projectName.trim() || "Code Intelligence"}`,
    "",
    "Standalone **Code Intelligence (CINT)** product export.",
    "",
    "This repository is the CINT app — not Replica builder chrome, not FOC.",
    description?.trim() ? `\n${description.trim()}\n` : "",
    "## Layout",
    "",
    "- `frontend/` — published UI (HTML / CSS / JS)",
    "- `backend/` — CINT API route sources (`/api/projects/:id/cint/*`)",
    "- `json/` — product manifests and sealed project snapshots",
    "- `src/lib/cint`, `src/core/codeIntelligence` — product runtime owners",
    "",
    `Pack: \`${CINT_PRODUCT_PACK_VERSION}\``,
    "",
  ].join("\n");
}

function readStructuredLight(files: unknown): Record<string, unknown> | null {
  const root = asRecord(files);
  if (!root) return null;
  const structured = asRecord(root.structured) ?? asRecord(root.projectState);
  return structured;
}

/** Client-safe export surface — frontend / backend / json like peer apps. */
export function buildCintClientExportSurface(input: CintExportBuildInput): CintStaticExportFile[] {
  const bundle = getPreviewBundle(input.files);
  const indexHtml = buildPreviewSrcDoc(bundle.html, bundle.css, bundle.js, {
    metadata: input.metadata,
  });
  const structured = readStructuredLight(input.files);
  const metaSafe = sanitizeMetadataForExport(input.metadata);
  const pageContract =
    asRecord(metaSafe.pageContract) ??
    asRecord(asRecord(metaSafe.frozenProjectTruth)?.pageContract);

  const productJson = {
    product: "code_intelligence",
    packVersion: CINT_PRODUCT_PACK_VERSION,
    defaultRepoSlug: CINT_PRODUCT_REPO_SLUG,
    layout: ["frontend/", "backend/", "json/", "src/"],
    note: "Full backend route sources attach on server publish / external deploy.",
  };

  const backendIndex = {
    product: "code_intelligence",
    basePath: "/api/projects/:projectId/cint",
    routes: [
      "auth",
      "admin",
      "analyze",
      "assistant",
      "export",
      "import",
      "upload",
      "agents/run",
      "remediation/apply",
      "github/connect",
      "github/repos",
      "github/status",
      "github/sync",
      "github/publish-product",
      ":entity",
    ],
    sourceRoots: [
      "src/routes/api/projects/$projectId/cint",
      "src/routes/api/cint",
      "src/lib/cint",
    ],
  };

  const vercelJson = JSON.stringify(
    {
      version: 2,
      cleanUrls: true,
      trailingSlash: false,
      rewrites: [{ source: "/((?!.*\\.).*)", destination: "/frontend/index.html" }],
    },
    null,
    2,
  );

  const files: CintStaticExportFile[] = [
    { path: "README.md", content: cintReadme(input.projectName, input.description) },
    {
      path: "package.json",
      content: safeJson({
        name: "@replica/code-intelligence",
        private: true,
        version: "1.0.0",
        description: "Code Intelligence (CINT) — standalone product export",
        type: "module",
      }),
    },
    { path: "vercel.json", content: `${vercelJson}\n` },
    { path: "frontend/index.html", content: indexHtml },
    { path: "frontend/body.html", content: bundle.html || "" },
    { path: "frontend/styles.css", content: bundle.css || "" },
    { path: "frontend/app.js", content: bundle.js || "" },
    {
      path: "backend/README.md",
      content: [
        "# CINT backend",
        "",
        "HTTP surface for the sealed Code Intelligence product.",
        "",
        "Route sources ship under `src/routes/api/.../cint` when the full product pack is published.",
        "See `backend/routes.json` for the live path map.",
        "",
      ].join("\n"),
    },
    { path: "backend/routes.json", content: safeJson(backendIndex) },
    { path: "json/cint.product.json", content: safeJson(productJson) },
    { path: "json/project-metadata.json", content: safeJson(metaSafe) },
  ];

  if (pageContract) {
    files.push({ path: "json/page-contract.json", content: safeJson(pageContract) });
  }
  if (structured) {
    files.push({ path: "json/project-state.json", content: safeJson(structured) });
  }

  files.push({ path: "index.html", content: indexHtml });
  return files;
}
