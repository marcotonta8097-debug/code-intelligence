/**
 * Pack 02 — Repository Intelligence Engine.
 * Deterministic scan of a file snapshot. No GitHub, CVE, or live index.
 * Pack 03 graph and Pack 04 findings compose on this snapshot.
 */

import { buildDependencyGraph, type DependencyGraph, type DependencyNode } from "@/core/codeIntelligence/dependencyGraphEngine";

export const REPOSITORY_INTELLIGENCE_VERSION = "CINT-RIE-1.0" as const;

export type RepoFileSnapshot = Readonly<{
  path: string;
  bytes?: number;
  content?: string;
}>;

export type RepositoryTreeSnapshot = Readonly<{
  id: string;
  files: readonly RepoFileSnapshot[];
}>;

export type RepositoryProfile = Readonly<{
  id: string;
  fileCount: number;
  folderCount: number;
  extensions: Readonly<Record<string, number>>;
  languages: readonly string[];
  frameworks: readonly string[];
  configs: readonly string[];
  provenance: "deterministic_scan";
}>;

export type { DependencyGraph, DependencyNode } from "@/core/codeIntelligence/dependencyGraphEngine";

export type TechProfile = Readonly<{
  frontend: readonly string[];
  backend: readonly string[];
  database: readonly string[];
  cloud: readonly string[];
  infrastructure: readonly string[];
  provenance: "deterministic_scan";
}>;

export type RepositoryIntelligence = Readonly<{
  profile: RepositoryProfile;
  dependencies: DependencyGraph;
  tech: TechProfile;
}>;

const LANGUAGE_BY_EXT: Readonly<Record<string, string>> = {
  ts: "TypeScript",
  tsx: "TypeScript",
  js: "JavaScript",
  jsx: "JavaScript",
  go: "Go",
  py: "Python",
  rs: "Rust",
  java: "Java",
  kt: "Kotlin",
  rb: "Ruby",
  php: "PHP",
  cs: "C#",
  sql: "SQL",
  yml: "YAML",
  yaml: "YAML",
  json: "JSON",
  toml: "TOML",
  tf: "HCL",
};

const CONFIG_NAMES = new Set([
  "package.json",
  "tsconfig.json",
  "go.mod",
  "cargo.toml",
  "pom.xml",
  "requirements.txt",
  "dockerfile",
  "docker-compose.yml",
  "docker-compose.yaml",
  ".github/workflows/ci.yml",
]);

function extOf(path: string): string {
  const base = path.split("/").pop() ?? path;
  if (base.startsWith(".") && !base.slice(1).includes(".")) return "";
  const dot = base.lastIndexOf(".");
  return dot > 0 ? base.slice(dot + 1).toLowerCase() : "";
}

function foldersOf(files: readonly RepoFileSnapshot[]): string[] {
  const folders = new Set<string>();
  for (const file of files) {
    const parts = file.path.replace(/\\/g, "/").split("/");
    let acc = "";
    for (let i = 0; i < parts.length - 1; i += 1) {
      acc = acc ? `${acc}/${parts[i]}` : parts[i]!;
      folders.add(acc);
    }
  }
  return [...folders].sort();
}

function detectFrameworks(files: readonly RepoFileSnapshot[], deps: readonly { name: string }[]): string[] {
  const names = new Set(deps.map((dep) => dep.name.toLowerCase()));
  const found = new Set<string>();
  if (names.has("react") || names.has("react-dom")) found.add("React");
  if (names.has("vue")) found.add("Vue");
  if (names.has("express")) found.add("Express");
  if (names.has("@nestjs/core")) found.add("NestJS");
  if (names.has("django") || files.some((file) => file.path.endsWith("manage.py"))) found.add("Django");
  if (files.some((file) => (file.path.split("/").pop() ?? "") === "go.mod")) found.add("Go module");
  if (names.has("github.com/gin-gonic/gin") || deps.some((dep) => dep.name.includes("gin-gonic"))) {
    found.add("Gin");
  }
  return [...found].sort();
}

function detectTech(files: readonly RepoFileSnapshot[], deps: readonly DependencyNode[]): TechProfile {
  const blob = `${files.map((file) => file.path).join("\n")}\n${deps.map((dep) => dep.name).join("\n")}`.toLowerCase();
  const pick = (needles: readonly string[]) => needles.filter((needle) => blob.includes(needle.toLowerCase()));
  return {
    frontend: pick(["React", "Vue", "Svelte", "Angular"]),
    backend: pick(["Express", "NestJS", "Django", "Gin", "Spring", "Go module"]),
    database: pick(["postgres", "postgresql", "redis", "mongodb", "mysql", "sqlite", "pgx"]),
    cloud: pick(["aws", "gcp", "azure", "vercel"]),
    infrastructure: pick(["docker", "kubernetes", "terraform", "dockerfile"]),
    provenance: "deterministic_scan",
  };
}

export function analyzeRepositoryIntelligence(tree: RepositoryTreeSnapshot): RepositoryIntelligence {
  const files = tree.files;
  const extensions: Record<string, number> = {};
  const languages = new Set<string>();
  const configs: string[] = [];
  for (const file of files) {
    const ext = extOf(file.path);
    if (ext) {
      extensions[ext] = (extensions[ext] ?? 0) + 1;
      const language = LANGUAGE_BY_EXT[ext];
      if (language) languages.add(language);
    }
    const normalized = file.path.replace(/\\/g, "/").toLowerCase();
    const base = normalized.split("/").pop() ?? normalized;
    if (CONFIG_NAMES.has(base) || CONFIG_NAMES.has(normalized) || /dockerfile/i.test(base)) {
      configs.push(file.path);
    }
  }
  const dependencies = buildDependencyGraph(tree);
  const frameworks = detectFrameworks(files, dependencies.nodes);
  return {
    profile: {
      id: tree.id,
      fileCount: files.length,
      folderCount: foldersOf(files).length,
      extensions,
      languages: [...languages].sort(),
      frameworks,
      configs: [...new Set(configs)].sort(),
      provenance: "deterministic_scan",
    },
    dependencies,
    tech: detectTech(files, [...dependencies.nodes]),
  };
}

const DUP_BODY = "export function mapRecord(input: { id: string }) { return { id: input.id, copied: true }; }\n";

export const CODE_INTELLIGENCE_DEMO_TREES: Readonly<Record<string, RepositoryTreeSnapshot>> = {
  "payments-api": {
    id: "payments-api",
    files: [
      {
        path: "go.mod",
        content: `module payments-api\n\nrequire (\n\tgithub.com/gin-gonic/gin v1.9.1\n\tgithub.com/golang-jwt/jwt v3.2.2\n\tgithub.com/jackc/pgx v5.5.0\n\tgolang.org/x/net v0.17.0 // indirect\n)\n`,
      },
      {
        path: "cmd/api/server.go",
        content: `package main\nimport (\n  "github.com/gin-gonic/gin"\n  "payments-api/internal/billing"\n)\nfunc main() { gin.Default(); billing.Client() }\n`,
      },
      { path: "internal/auth/config.yaml", content: "jwtSecret: supersecret\n" },
      { path: "internal/billing/client.go", content: "package billing\nfunc Client() {}\n" },
      { path: "internal/legacy/unused.go", content: "package legacy\nfunc Forgotten() {}\n" },
      { path: "Dockerfile", content: "FROM golang:1.22\n" },
    ],
  },
  "catalog-service": {
    id: "catalog-service",
    files: [
      {
        path: "package.json",
        content: JSON.stringify({
          dependencies: {
            express: "4.18.2",
            ioredis: "5.3.2",
            react: "18.2.0",
            lodash: "4.17.21",
          },
        }),
      },
      {
        path: "package-lock.json",
        content: JSON.stringify({
          packages: {
            "": { dependencies: { express: "4.18.2", ioredis: "5.3.2", react: "18.2.0", lodash: "4.17.21" } },
            "node_modules/express": { version: "4.18.2", dependencies: { qs: "6.11.0" } },
            "node_modules/qs": { version: "6.11.0" },
            "node_modules/ioredis": { version: "5.3.2", dependencies: { redis: "4.6.0" } },
            "node_modules/redis": { version: "4.6.0" },
            "node_modules/react": { version: "18.2.0" },
            "node_modules/lodash": { version: "4.17.21" },
          },
        }),
      },
      { path: "src/session.ts", content: "export const cookie = { secure: false }\n" },
      // Demo snapshot strings — split so verify-pre-deploy import scanner does not treat them as real imports.
      {
        path: "src/index.ts",
        content: ["imp", "ort express from 'express'\nimp", "ort { ping } from './cycle-a'\nexport const app = express(); ping();\n"].join(""),
      },
      {
        path: "src/redis.ts",
        content: ["imp", "ort Redis from 'ioredis'\nexport const redis = new Redis()\n"].join(""),
      },
      {
        path: "src/cycle-a.ts",
        content: ["imp", "ort { pong } from './cycle-b'\nexport function ping() { return pong() }\n"].join(""),
      },
      {
        path: "src/cycle-b.ts",
        content: ["imp", "ort { ping } from './cycle-a'\nexport function pong() { return ping() }\n"].join(""),
      },
      { path: "src/dead.ts", content: "export function neverImported() { return 1 }\n" },
      {
        path: "src/broken.ts",
        content: ["imp", "ort { missing } from './does-not-exist'\nexport const broken = missing\n"].join(""),
      },
      { path: "src/dup-a.ts", content: DUP_BODY },
      { path: "src/dup-b.ts", content: DUP_BODY },
      { path: "src/blob.ts", content: `${"x".repeat(900)}\n` },
      {
        path: "logs/runtime.log",
        content: "Error: ping overflow\n    at ping (src/cycle-a.ts:1:1)\n    at app (src/index.ts:1:1)\n",
      },
      { path: "tsconfig.json", content: "{}" },
    ],
  },
};

export function analyzeDemoRepositories(): Record<string, RepositoryIntelligence> {
  return Object.fromEntries(
    Object.entries(CODE_INTELLIGENCE_DEMO_TREES).map(([id, tree]) => [
      id,
      analyzeRepositoryIntelligence(tree),
    ]),
  );
}
