/**
 * CINT product source pack — standalone Code Intelligence app files only.
 * Not the Replica factory tree. Used to publish / self-ingest a subject repo
 * that CINT can Sync + Analyze independently.
 */

import fs from "node:fs";
import path from "node:path";
import type { RepositoryTreeSnapshot } from "@/core/codeIntelligence/repositoryIntelligenceEngine";
import {
  CINT_PRODUCT_PACK_VERSION,
  CINT_PRODUCT_REPO_SLUG,
  CINT_PRODUCT_REPOSITORY_ID,
  CINT_PRODUCT_SOURCE_FILES,
  CINT_PRODUCT_SOURCE_ROOTS,
} from "@/lib/cint/cintProductSourcePack.constants";

export {
  CINT_PRODUCT_PACK_VERSION,
  CINT_PRODUCT_REPO_SLUG,
  CINT_PRODUCT_REPOSITORY_ID,
  CINT_PRODUCT_SOURCE_FILES,
  CINT_PRODUCT_SOURCE_ROOTS,
} from "@/lib/cint/cintProductSourcePack.constants";

const SKIP_DIR = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  "tmp",
  "agent-transcripts",
  ".cursor",
]);

const TEXT_RE =
  /\.(ts|tsx|js|jsx|mjs|cjs|json|md|css|html|yml|yaml|toml|sql|svg|txt)$/i;

export type CintProductSourceFile = {
  path: string;
  content: string;
  bytes: number;
};

export type CintProductSourcePack = {
  product: "code_intelligence";
  packVersion: typeof CINT_PRODUCT_PACK_VERSION;
  repositoryId: typeof CINT_PRODUCT_REPOSITORY_ID;
  defaultRepoSlug: typeof CINT_PRODUCT_REPO_SLUG;
  root: string;
  files: CintProductSourceFile[];
  fileCount: number;
  skippedOutsideAllowlist: number;
};

function resolvePackRoot(explicit?: string): string {
  if (explicit?.trim()) return path.resolve(explicit.trim());
  return process.cwd();
}

function walkDir(absDir: string, relBase: string, out: Array<{ abs: string; rel: string }>): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(absDir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    if (SKIP_DIR.has(ent.name)) continue;
    if (ent.name.startsWith(".") && ent.name !== ".env.example") continue;
    const abs = path.join(absDir, ent.name);
    const rel = relBase ? `${relBase}/${ent.name}` : ent.name;
    if (ent.isDirectory()) {
      walkDir(abs, rel.replace(/\\/g, "/"), out);
      continue;
    }
    if (!ent.isFile()) continue;
    out.push({ abs, rel: rel.replace(/\\/g, "/") });
  }
}

function readTextFile(abs: string, maxBytes: number): string | null {
  try {
    const st = fs.statSync(abs);
    if (!st.isFile() || st.size <= 0 || st.size > maxBytes) return null;
    if (!TEXT_RE.test(abs) && !abs.endsWith(".env.example")) return null;
    return fs.readFileSync(abs, "utf8");
  } catch {
    return null;
  }
}

function buildIdentityFiles(): CintProductSourceFile[] {
  const packageJson = JSON.stringify(
    {
      name: "@replica/code-intelligence",
      private: true,
      version: "1.0.0",
      description:
        "Code Intelligence (CINT) — standalone product source pack. Not the Replica factory.",
      type: "module",
      engines: { node: ">=22" },
    },
    null,
    2,
  );
  const readme = [
    "# Code Intelligence (CINT)",
    "",
    "Standalone **Code Intelligence** product source pack.",
    "",
    "This repository is the **CINT app** subject surface — not Replica builder chrome,",
    "not FOC, and not the full Replica factory monorepo.",
    "",
    "## What this is for",
    "",
    "- Publish CINT as its own GitHub repo",
    "- Connect → Sync → Analyze **this** tree inside the live CINT platform",
    "- Test CINT individually and separately from Replica host",
    "",
    `Pack version: \`${CINT_PRODUCT_PACK_VERSION}\``,
    "",
  ].join("\n");
  const manifest = JSON.stringify(
    {
      product: "code_intelligence",
      packVersion: CINT_PRODUCT_PACK_VERSION,
      repositoryId: CINT_PRODUCT_REPOSITORY_ID,
      roots: [...CINT_PRODUCT_SOURCE_ROOTS],
      files: [...CINT_PRODUCT_SOURCE_FILES],
      note: "Allowlisted CINT product paths only — factory host trees are excluded.",
    },
    null,
    2,
  );
  return [
    { path: "package.json", content: `${packageJson}\n`, bytes: packageJson.length + 1 },
    { path: "README.md", content: readme, bytes: readme.length },
    { path: "cint.product.json", content: `${manifest}\n`, bytes: manifest.length + 1 },
  ];
}

/**
 * Collect allowlisted CINT product files from the local workspace.
 * Hard-excludes Replica factory noise (host UI, FOC, lab, unrelated routes).
 */
export function buildCintProductSourcePack(options?: {
  root?: string;
  maxFiles?: number;
  maxBytesPerFile?: number;
}): CintProductSourcePack {
  const root = resolvePackRoot(options?.root);
  const maxFiles = options?.maxFiles ?? 400;
  const maxBytes = options?.maxBytesPerFile ?? 200_000;
  const collected: Array<{ abs: string; rel: string }> = [];

  for (const relRoot of CINT_PRODUCT_SOURCE_ROOTS) {
    const abs = path.join(root, relRoot);
    if (!fs.existsSync(abs)) continue;
    walkDir(abs, relRoot.replace(/\\/g, "/"), collected);
  }
  for (const relFile of CINT_PRODUCT_SOURCE_FILES) {
    const abs = path.join(root, relFile);
    if (!fs.existsSync(abs)) continue;
    collected.push({ abs, rel: relFile.replace(/\\/g, "/") });
  }

  const seen = new Set<string>();
  const files: CintProductSourceFile[] = [...buildIdentityFiles()];
  for (const id of files) seen.add(id.path);

  let skippedOutsideAllowlist = 0;
  for (const item of collected) {
    if (seen.has(item.rel)) continue;
    if (!isCintProductAllowlistedPath(item.rel)) {
      skippedOutsideAllowlist += 1;
      continue;
    }
    const content = readTextFile(item.abs, maxBytes);
    if (content == null) continue;
    seen.add(item.rel);
    files.push({ path: item.rel, content, bytes: Buffer.byteLength(content, "utf8") });
    if (files.length >= maxFiles) break;
  }

  return {
    product: "code_intelligence",
    packVersion: CINT_PRODUCT_PACK_VERSION,
    repositoryId: CINT_PRODUCT_REPOSITORY_ID,
    defaultRepoSlug: CINT_PRODUCT_REPO_SLUG,
    root,
    files,
    fileCount: files.length,
    skippedOutsideAllowlist,
  };
}

/** True when path is inside the CINT product allowlist (not Replica factory). */
export function isCintProductAllowlistedPath(relPath: string): boolean {
  const p = relPath.replace(/\\/g, "/").replace(/^\.\//, "");
  if (!p || p.includes("..")) return false;
  if (p === "package.json" || p === "README.md" || p === "cint.product.json") return true;
  for (const root of CINT_PRODUCT_SOURCE_ROOTS) {
    if (p === root || p.startsWith(`${root}/`)) return true;
  }
  return (CINT_PRODUCT_SOURCE_FILES as readonly string[]).includes(p);
}

/** Convert pack → CI repository tree for Sync/Analyze ingest. */
export function cintProductPackToRepositoryTree(
  pack: CintProductSourcePack,
  repositoryId: string = CINT_PRODUCT_REPOSITORY_ID,
): RepositoryTreeSnapshot {
  return {
    id: repositoryId,
    files: pack.files.map((f) => ({
      path: f.path,
      bytes: f.bytes,
      content: f.content,
    })),
  };
}

/** Push payload for GitHub (path + utf-8 content only). */
export function cintProductPackToGitHubFiles(
  pack: CintProductSourcePack,
): Array<{ path: string; content: string }> {
  return pack.files.map((f) => ({ path: f.path, content: f.content }));
}
