/**
 * CINT project export — server full tree (frontend/backend/json + source pack).
 * Client surface lives in cintProjectExportClient (no filesystem).
 */

import {
  buildCintClientExportSurface,
  isCintExportProject,
  type CintExportBuildInput,
  type CintStaticExportFile,
} from "@/lib/cint/cintProjectExportClient";
import {
  buildCintProductSourcePack,
  type CintProductSourceFile,
} from "@/lib/cint/cintProductSourcePack";

export {
  buildCintClientExportSurface,
  isCintExportProject,
  type CintExportBuildInput,
  type CintStaticExportFile,
} from "@/lib/cint/cintProjectExportClient";

function remapPackPathForExport(rel: string): string {
  const p = rel.replace(/\\/g, "/");
  if (p.startsWith("src/routes/api/projects/$projectId/cint/")) {
    const rest = p.slice("src/routes/api/projects/$projectId/cint/".length);
    return `backend/api/${rest}`;
  }
  if (p.startsWith("src/routes/api/cint/")) {
    const rest = p.slice("src/routes/api/cint/".length);
    return `backend/api/cint/${rest}`;
  }
  return p;
}

/**
 * Server-only: client surface + full CINT product source pack.
 * This is what GitHub / external deploy must push for CINT.
 */
export function buildCintFullProductExportFiles(input: CintExportBuildInput): CintStaticExportFile[] {
  const surface = buildCintClientExportSurface(input);
  const pack = buildCintProductSourcePack();
  const byPath = new Map<string, string>();
  for (const f of surface) byPath.set(f.path, f.content);

  for (const f of pack.files) {
    if (f.path === "README.md" || f.path === "package.json" || f.path === "cint.product.json") {
      continue;
    }
    byPath.set(f.path, f.content);
    const remapped = remapPackPathForExport(f.path);
    if (remapped !== f.path) {
      byPath.set(remapped, f.content);
    }
  }

  const product = surface.find((f) => f.path === "json/cint.product.json");
  if (product) byPath.set("cint.product.json", product.content);

  return [...byPath.entries()].map(([path, content]) => ({ path, content }));
}

export function cintFullExportToSourceFiles(
  files: CintStaticExportFile[],
): CintProductSourceFile[] {
  return files.map((f) => ({
    path: f.path,
    content: f.content,
    bytes: Buffer.byteLength(f.content, "utf8"),
  }));
}
