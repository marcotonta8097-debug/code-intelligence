/**
 * Publish / self-load the CINT product source pack so Code Intelligence can
 * Sync + Analyze itself as a standalone subject (not Replica-app-2026 factory).
 */

import {
  createGitHubRepository,
  fetchGitHubUser,
  getGitHubRepository,
  pushFilesToGitHubRepository,
} from "@/integrations/providers/github/GitHubService.server";
import { slugifyExportName } from "@/integrations/services/projectExport/slugifyExportName";
import { cintEntityStore } from "@/lib/cint/cintEntityStore";
import {
  CINT_LIVE_INDEX_KEY,
  connectionToLiveIndexEvidence,
  getCintGitHubConnection,
  persistCintProjectLiveIndexMetadata,
  sealCodeIntelligenceLiveIndexEvidence,
  upsertCintGitHubConnection,
  type CintGitHubConnection,
  type CodeIntelligenceLiveIndexEvidence,
} from "@/lib/cint/cintGitHubConnectionStore";
import { cintRepositoryStoreId } from "@/lib/cint/cintLiveWorkspace";
import {
  buildCintFullProductExportFiles,
  cintFullExportToSourceFiles,
} from "@/lib/cint/cintProjectExport";
import {
  buildCintProductSourcePack,
  cintProductPackToRepositoryTree,
  CINT_PRODUCT_PACK_VERSION,
  CINT_PRODUCT_REPOSITORY_ID,
  CINT_PRODUCT_REPO_SLUG,
  type CintProductSourcePack,
} from "@/lib/cint/cintProductSourcePack";
import { createServiceRoleSupabase } from "@/serverFns/security.server";

export type CintProductSelfLoadResult = {
  ok: true;
  mode: "self_load";
  repository: string;
  fileCount: number;
  commitSha: string;
  packVersion: string;
  liveIndex: CodeIntelligenceLiveIndexEvidence;
  metadataPersisted: boolean;
  metadataStamp: Record<string, unknown>;
};

export type CintProductPublishResult = {
  ok: true;
  mode: "publish_github";
  repository: string;
  htmlUrl: string;
  commitSha: string;
  fileCount: number;
  packVersion: string;
  created: boolean;
  liveIndex: CodeIntelligenceLiveIndexEvidence;
  metadataPersisted: boolean;
  metadataStamp: Record<string, unknown>;
};

function resolveRepoSlug(raw?: string): string {
  const cleaned = (raw || "").trim();
  if (!cleaned) return CINT_PRODUCT_REPO_SLUG;
  if (cleaned.includes("/")) {
    const [, repo] = cleaned.split("/");
    return slugifyExportName(repo || CINT_PRODUCT_REPO_SLUG) || CINT_PRODUCT_REPO_SLUG;
  }
  return slugifyExportName(cleaned) || CINT_PRODUCT_REPO_SLUG;
}

async function persistPackAsRepositoryRow(input: {
  projectId: string;
  repository: string;
  pack: CintProductSourcePack;
  provider: string;
  url: string;
  commitSha: string;
  defaultBranch: string;
}): Promise<void> {
  const tree = cintProductPackToRepositoryTree(input.pack, input.repository);
  await cintEntityStore.upsert(
    "repositories",
    {
      id: cintRepositoryStoreId(input.repository),
      name: input.repository,
      url: input.url,
      provider: input.provider,
      lastSyncedAt: new Date().toISOString(),
      defaultBranch: input.defaultBranch,
      commitSha: input.commitSha,
      fileCount: input.pack.fileCount,
      tree,
      product: "code_intelligence",
      packVersion: input.pack.packVersion,
    },
    input.projectId,
  );
}

/** Ingest CINT product pack locally — Analyze without waiting on GitHub. */
export async function selfLoadCintProductSource(projectId: string): Promise<CintProductSelfLoadResult> {
  const project = await loadCintProjectExportContext(projectId);
  let exportFiles = buildCintFullProductExportFiles({
    projectName: project.name || "Code Intelligence",
    description: project.description,
    files: project.files,
    metadata: project.metadata,
  });
  if (exportFiles.length < 8) {
    const fallback = buildCintProductSourcePack();
    if (fallback.fileCount < 4) {
      throw new Error("CINT product pack is empty — factory roots missing from workspace");
    }
    exportFiles = fallback.files.map((f) => ({ path: f.path, content: f.content }));
  }
  const packFiles = cintFullExportToSourceFiles(exportFiles);
  const pack: CintProductSourcePack = {
    product: "code_intelligence",
    packVersion: CINT_PRODUCT_PACK_VERSION,
    repositoryId: CINT_PRODUCT_REPOSITORY_ID,
    defaultRepoSlug: CINT_PRODUCT_REPO_SLUG,
    root: process.cwd(),
    files: packFiles,
    fileCount: packFiles.length,
    skippedOutsideAllowlist: 0,
  };
  const repository = CINT_PRODUCT_REPOSITORY_ID;
  const commitSha = `cint_product_${pack.packVersion}_${pack.fileCount}`;
  await persistPackAsRepositoryRow({
    projectId,
    repository,
    pack,
    provider: "cint_product_self",
    url: `cint-product://${repository}`,
    commitSha,
    defaultBranch: "product",
  });
  const { evidence } = sealCodeIntelligenceLiveIndexEvidence(
    {},
    {
      repository,
      commitSha,
      fileCount: pack.fileCount,
    },
  );
  const liveIndex: CodeIntelligenceLiveIndexEvidence = {
    ...evidence,
    provider: "local_snapshot",
  };
  const metadataPersisted = await persistCintProjectLiveIndexMetadata(projectId, liveIndex);
  return {
    ok: true,
    mode: "self_load",
    repository,
    fileCount: pack.fileCount,
    commitSha,
    packVersion: pack.packVersion,
    liveIndex,
    metadataPersisted,
    metadataStamp: { [CINT_LIVE_INDEX_KEY]: liveIndex },
  };
}

/**
 * Create/update dedicated GitHub repo with CINT-only files, select it on the
 * CINT connection, and store the tree for Sync/Analyze.
 */
export async function publishCintProductToGitHub(
  projectId: string,
  options?: { repoName?: string; private?: boolean },
): Promise<CintProductPublishResult> {
  const conn = await getCintGitHubConnection(projectId);
  if (!conn?.accessToken) {
    throw Object.assign(new Error("Connect GitHub OAuth before publishing the CINT product repo"), {
      code: "cint_github_not_connected",
      status: 401,
    });
  }

  const project = await loadCintProjectExportContext(projectId);
  const exportFiles = buildCintFullProductExportFiles({
    projectName: project.name || "Code Intelligence",
    description: project.description,
    files: project.files,
    metadata: project.metadata,
  });
  if (exportFiles.length < 8) {
    throw new Error("CINT product export is empty — frontend/backend/json pack missing");
  }
  const packFiles = cintFullExportToSourceFiles(exportFiles);
  const pack: CintProductSourcePack = {
    product: "code_intelligence",
    packVersion: CINT_PRODUCT_PACK_VERSION,
    repositoryId: CINT_PRODUCT_REPOSITORY_ID,
    defaultRepoSlug: CINT_PRODUCT_REPO_SLUG,
    root: process.cwd(),
    files: packFiles,
    fileCount: packFiles.length,
    skippedOutsideAllowlist: 0,
  };

  const user = await fetchGitHubUser(conn.accessToken);
  const repoSlug = resolveRepoSlug(options?.repoName);
  const fullName = `${user.login}/${repoSlug}`;

  let created = false;
  let repo = await getGitHubRepository(conn.accessToken, user.login, repoSlug);
  if (!repo) {
    repo = await createGitHubRepository(conn.accessToken, {
      name: repoSlug,
      description: "Code Intelligence (CINT) — standalone product source (not Replica factory)",
      private: options?.private ?? false,
    });
    created = true;
  }

  const push = await pushFilesToGitHubRepository(
    conn.accessToken,
    repo.full_name || fullName,
    exportFiles,
    `Publish CINT product export ${pack.packVersion} (${exportFiles.length} files)`,
  );

  const repository = push.fullName || fullName;
  const updated: CintGitHubConnection = await upsertCintGitHubConnection({
    ...conn,
    selectedRepo: repository,
    defaultBranch: push.defaultBranch || "main",
    lastSyncedAt: new Date().toISOString(),
    syncCommitSha: push.commitSha,
    syncFileCount: pack.fileCount,
  });

  await persistPackAsRepositoryRow({
    projectId,
    repository,
    pack,
    provider: "github_cint_product",
    url: push.htmlUrl,
    commitSha: push.commitSha,
    defaultBranch: push.defaultBranch || "main",
  });

  const liveIndex = connectionToLiveIndexEvidence(updated);
  const metadataPersisted = await persistCintProjectLiveIndexMetadata(projectId, liveIndex);

  return {
    ok: true,
    mode: "publish_github",
    repository,
    htmlUrl: push.htmlUrl,
    commitSha: push.commitSha,
    fileCount: pack.fileCount,
    packVersion: pack.packVersion,
    created,
    liveIndex,
    metadataPersisted,
    metadataStamp: { [CINT_LIVE_INDEX_KEY]: liveIndex },
  };
}

async function loadCintProjectExportContext(projectId: string): Promise<{
  name: string;
  description: string | null;
  files: unknown;
  metadata: unknown;
}> {
  try {
    const sb = createServiceRoleSupabase();
    const { data } = await sb
      .from("projects")
      .select("name, description, files, metadata")
      .eq("id", projectId)
      .maybeSingle();
    if (data) {
      return {
        name: String(data.name || "Code Intelligence"),
        description: (data.description as string | null) ?? null,
        files: data.files,
        metadata: data.metadata,
      };
    }
  } catch {
    // Fall through to empty preview — pack sources still publish.
  }
  return {
    name: "Code Intelligence",
    description: null,
    files: {
      preview: {
        html: `<div data-product-surface="code_intelligence" data-cint-app-shell="1"></div>`,
        css: "",
        js: "",
      },
    },
    metadata: { productFamily: "code_intelligence", fieldRegistryId: "field:code_intelligence" },
  };
}
