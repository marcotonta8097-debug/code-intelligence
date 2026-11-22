/**
 * CI GitHub read (tree sync) + write (branch/commit/PR) using a project token.
 * Extends patterns from GitHubService.server without inventing a second OAuth stack.
 */

import type { RepositoryTreeSnapshot } from "@/core/codeIntelligence/repositoryIntelligenceEngine";
import { parseGitHubFullName } from "@/integrations/services/projectExport/slugifyExportName";

/** Normalize URL or bare slug → `owner/repo` for GitHub API paths. */
export function normalizeCintGitHubFullName(raw: string): string | null {
  const parsed = parseGitHubFullName(raw.trim());
  if (!parsed) return null;
  const [owner, repoRaw] = parsed.split("/");
  if (!owner || !repoRaw) return null;
  const repo = repoRaw.replace(/\.git$/i, "").split(/[?#]/)[0] ?? "";
  if (!repo) return null;
  return `${owner}/${repo}`;
}

function githubHeaders(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export type CintGitHubRepoSummary = {
  id: number;
  full_name: string;
  name: string;
  private: boolean;
  default_branch: string;
  html_url: string;
};

export async function listCintGitHubRepos(accessToken: string): Promise<CintGitHubRepoSummary[]> {
  const res = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
    headers: githubHeaders(accessToken),
  });
  if (!res.ok) throw new Error(`GitHub repos fetch failed (${res.status})`);
  return res.json() as Promise<CintGitHubRepoSummary[]>;
}

export async function fetchCintGitHubUser(accessToken: string): Promise<{
  login: string;
  id: number;
  avatar_url: string;
}> {
  const res = await fetch("https://api.github.com/user", {
    headers: githubHeaders(accessToken),
  });
  if (!res.ok) throw new Error(`GitHub user fetch failed (${res.status})`);
  return res.json() as Promise<{ login: string; id: number; avatar_url: string }>;
}

/**
 * Recursive tree listing for Sync.
 * Default is path inventory + a small content sample (fast, reliable).
 * Full-content crawl is optional — sequential blob fetch was hanging the UI.
 */
export async function syncCintGitHubRepositoryTree(
  accessToken: string,
  fullName: string,
  options?: {
    maxFiles?: number;
    maxBytesPerFile?: number;
    /** How many text blobs to hydrate with content (0 = paths only). */
    maxContentFiles?: number;
  },
): Promise<{
  tree: RepositoryTreeSnapshot;
  commitSha: string;
  defaultBranch: string;
  htmlUrl: string;
}> {
  const normalized = normalizeCintGitHubFullName(fullName) ?? fullName.trim();
  const [owner, repo] = normalized.split("/");
  if (!owner || !repo) throw new Error("Invalid repository full_name");
  fullName = `${owner}/${repo}`;
  const maxFiles = options?.maxFiles ?? 400;
  const maxBytes = options?.maxBytesPerFile ?? 80_000;
  const maxContentFiles = options?.maxContentFiles ?? 24;

  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: githubHeaders(accessToken),
  });
  if (!repoRes.ok) throw new Error(`GitHub repo lookup failed (${repoRes.status})`);
  const repoMeta = (await repoRes.json()) as {
    default_branch: string;
    html_url: string;
  };
  const branch = repoMeta.default_branch || "main";

  const refRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`,
    { headers: githubHeaders(accessToken) },
  );
  if (!refRes.ok) throw new Error(`GitHub ref lookup failed (${refRes.status})`);
  const ref = (await refRes.json()) as { object: { sha: string } };
  const commitSha = ref.object.sha;

  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${commitSha}?recursive=1`,
    { headers: githubHeaders(accessToken) },
  );
  if (!treeRes.ok) throw new Error(`GitHub tree fetch failed (${treeRes.status})`);
  const treeJson = (await treeRes.json()) as {
    tree: Array<{ path: string; type: string; size?: number; sha: string }>;
  };

  const allBlobs = treeJson.tree
    .filter((n) => n.type === "blob")
    .filter((n) => !n.path.includes("node_modules/") && !n.path.startsWith(".git/"));
  // Prefer root/near-root manifests early so Deps/tech survive the content sample budget.
  const MANIFEST_RE =
    /(^|\/)(package\.json|package-lock\.json|pnpm-lock\.yaml|yarn\.lock|go\.mod|cargo\.toml|pom\.xml|requirements\.txt|composer\.json|Gemfile)$/i;
  const ranked = rankCintSyncBlobs(allBlobs, MANIFEST_RE);
  const blobs = ranked.slice(0, maxFiles);

  const files: Array<{ path: string; bytes?: number; content?: string }> = [];
  const byPath = new Map<string, { path: string; bytes?: number; content?: string }>();
  for (const blob of blobs) {
    const entry = { path: blob.path, bytes: blob.size };
    byPath.set(blob.path, entry);
    files.push(entry);
  }

  // Phase 1: always hydrate manifests first (Deps empty when package.json is path-only).
  // Phase 2: fill remaining budget with source/text — skip IDE/plan noise that used to steal slots.
  const contentTargets = [
    ...blobs.filter((b) => MANIFEST_RE.test(b.path)),
    ...blobs.filter((b) => !MANIFEST_RE.test(b.path) && !isLowValueContentPath(b.path)),
  ];
  let contentFetched = 0;
  for (const blob of contentTargets) {
    if (contentFetched >= maxContentFiles) break;
    if ((blob.size ?? 0) <= 0 || (blob.size ?? 0) > maxBytes) continue;
    if (!MANIFEST_RE.test(blob.path) && !isLikelyTextPath(blob.path)) continue;
    const entry = byPath.get(blob.path);
    if (!entry) continue;
    try {
      const contentRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(blob.path).replace(/%2F/g, "/")}?ref=${encodeURIComponent(commitSha)}`,
        { headers: githubHeaders(accessToken) },
      );
      if (contentRes.ok) {
        const body = (await contentRes.json()) as { content?: string; encoding?: string };
        if (body.encoding === "base64" && body.content) {
          entry.content = Buffer.from(body.content.replace(/\n/g, ""), "base64").toString("utf8");
          contentFetched += 1;
        }
      }
    } catch {
      // path-only entry still useful for structure / liveIndex
    }
  }

  return {
    tree: { id: fullName, files },
    commitSha,
    defaultBranch: branch,
    htmlUrl: repoMeta.html_url,
  };
}

function isLikelyTextPath(path: string): boolean {
  return /\.(ts|tsx|js|jsx|mjs|cjs|json|md|yml|yaml|toml|css|scss|html|py|go|rs|java|kt|sql|env\.example|txt)$/i.test(
    path,
  );
}

/** Cursor/plan/docs noise used to consume the entire content sample before package.json. */
export function isLowValueContentPath(path: string): boolean {
  return /(^|\/)(\.cursor|\.vscode|\.idea|docs\/plans|agent-transcripts|node_modules)(\/|$)/i.test(
    path,
  );
}

export function rankCintSyncBlobs<T extends { path: string }>(
  blobs: T[],
  manifestRe: RegExp = /(^|\/)(package\.json|package-lock\.json|pnpm-lock\.yaml|yarn\.lock|go\.mod|cargo\.toml|pom\.xml|requirements\.txt|composer\.json|Gemfile)$/i,
): T[] {
  return [...blobs].sort((a, b) => {
    const am = manifestRe.test(a.path) ? 0 : 1;
    const bm = manifestRe.test(b.path) ? 0 : 1;
    if (am !== bm) return am - bm;
    const al = isLowValueContentPath(a.path) ? 1 : 0;
    const bl = isLowValueContentPath(b.path) ? 1 : 0;
    if (al !== bl) return al - bl;
    const ad = a.path.split("/").length;
    const bd = b.path.split("/").length;
    return ad - bd;
  });
}

export type CintGitHubPrResult = {
  prNumber: number;
  prUrl: string;
  branch: string;
  commitSha: string;
};

/** Create branch from default, commit file patches, open PR. */
export async function applyCintGitHubPullRequest(
  accessToken: string,
  fullName: string,
  input: {
    branchName: string;
    title: string;
    body: string;
    files: Array<{ path: string; content: string }>;
    commitMessage: string;
  },
): Promise<CintGitHubPrResult> {
  const [owner, repo] = fullName.split("/");
  if (!owner || !repo) throw new Error("Invalid repository full_name");
  if (!input.files.length) throw new Error("No files to apply");

  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: githubHeaders(accessToken),
  });
  if (!repoRes.ok) throw new Error(`GitHub repo lookup failed (${repoRes.status})`);
  const repoMeta = (await repoRes.json()) as { default_branch: string };
  const baseBranch = repoMeta.default_branch || "main";

  const baseRefRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(baseBranch)}`,
    { headers: githubHeaders(accessToken) },
  );
  if (!baseRefRes.ok) throw new Error(`GitHub base ref failed (${baseRefRes.status})`);
  const baseRef = (await baseRefRes.json()) as { object: { sha: string } };
  const baseSha = baseRef.object.sha;

  const createRefRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
    method: "POST",
    headers: { ...githubHeaders(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify({
      ref: `refs/heads/${input.branchName}`,
      sha: baseSha,
    }),
  });
  if (!createRefRes.ok && createRefRes.status !== 422) {
    throw new Error(`GitHub branch create failed (${createRefRes.status})`);
  }

  const commitRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/commits/${baseSha}`,
    { headers: githubHeaders(accessToken) },
  );
  if (!commitRes.ok) throw new Error(`GitHub commit lookup failed (${commitRes.status})`);
  const baseCommit = (await commitRes.json()) as { tree: { sha: string } };

  const treeItems: Array<{ path: string; mode: "100644"; type: "blob"; sha: string }> = [];
  for (const file of input.files) {
    const blobRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
      method: "POST",
      headers: { ...githubHeaders(accessToken), "Content-Type": "application/json" },
      body: JSON.stringify({ content: file.content, encoding: "utf-8" }),
    });
    if (!blobRes.ok) throw new Error(`GitHub blob create failed (${blobRes.status})`);
    const blob = (await blobRes.json()) as { sha: string };
    treeItems.push({ path: file.path, mode: "100644", type: "blob", sha: blob.sha });
  }

  const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
    method: "POST",
    headers: { ...githubHeaders(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify({ base_tree: baseCommit.tree.sha, tree: treeItems }),
  });
  if (!treeRes.ok) throw new Error(`GitHub tree create failed (${treeRes.status})`);
  const tree = (await treeRes.json()) as { sha: string };

  const newCommitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
    method: "POST",
    headers: { ...githubHeaders(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify({
      message: input.commitMessage,
      tree: tree.sha,
      parents: [baseSha],
    }),
  });
  if (!newCommitRes.ok) throw new Error(`GitHub commit create failed (${newCommitRes.status})`);
  const newCommit = (await newCommitRes.json()) as { sha: string };

  const updateRefRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(input.branchName)}`,
    {
      method: "PATCH",
      headers: { ...githubHeaders(accessToken), "Content-Type": "application/json" },
      body: JSON.stringify({ sha: newCommit.sha, force: false }),
    },
  );
  if (!updateRefRes.ok) throw new Error(`GitHub branch update failed (${updateRefRes.status})`);

  const prRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
    method: "POST",
    headers: { ...githubHeaders(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify({
      title: input.title,
      head: input.branchName,
      base: baseBranch,
      body: input.body,
    }),
  });
  if (!prRes.ok) {
    const errBody = (await prRes.json().catch(() => ({}))) as { message?: string };
    throw new Error(errBody.message ?? `GitHub PR create failed (${prRes.status})`);
  }
  const pr = (await prRes.json()) as { number: number; html_url: string };
  return {
    prNumber: pr.number,
    prUrl: pr.html_url,
    branch: input.branchName,
    commitSha: newCommit.sha,
  };
}
