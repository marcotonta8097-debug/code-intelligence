import { afterEach, describe, expect, it } from "vitest";
import { cintDurableDelete, cintDurableGet, cintDurablePut } from "@/lib/cint/cintDurableFileStore";
import {
  clearCintGitHubConnection,
  getCintGitHubConnection,
  getCintGitHubTokenDurability,
  upsertCintGitHubConnection,
  type CintGitHubConnection,
  CINT_GITHUB_CONN_DURABLE_NS,
} from "@/lib/cint/cintGitHubConnectionStore";

describe("cintGitHubConnectionStore durability", () => {
  const projectId = `cint_oauth_dur_${Date.now()}`;

  afterEach(async () => {
    await clearCintGitHubConnection(projectId);
    cintDurableDelete(CINT_GITHUB_CONN_DURABLE_NS, projectId);
  });

  it("writes OAuth token to durable file layer on upsert", async () => {
    process.env.CINT_OAUTH_STATE_SECRET =
      process.env.CINT_OAUTH_STATE_SECRET || "test-cint-oauth-state-secret-32b";

    await upsertCintGitHubConnection({
      projectId,
      accessToken: "gho_test_token_not_real",
      accountLogin: "ci-tester",
      scope: "repo",
      selectedRepo: null,
      defaultBranch: null,
      lastSyncedAt: null,
      syncCommitSha: null,
      syncFileCount: 0,
    });

    const live = await getCintGitHubConnection(projectId);
    expect(live?.accessToken).toBe("gho_test_token_not_real");
    expect(["supabase", "file_encrypted", "file_plaintext"]).toContain(getCintGitHubTokenDurability());

    const onDisk = cintDurableGet<CintGitHubConnection>(CINT_GITHUB_CONN_DURABLE_NS, projectId);
    expect(onDisk?.accessToken).toBe("gho_test_token_not_real");
    expect(onDisk?.accountLogin).toBe("ci-tester");
  });

  it("rehydrates connection from durable file when memory is cold", async () => {
    process.env.CINT_OAUTH_STATE_SECRET =
      process.env.CINT_OAUTH_STATE_SECRET || "test-cint-oauth-state-secret-32b";

    const seed: CintGitHubConnection = {
      projectId,
      accessToken: "gho_cold_start_token",
      accountLogin: "cold-user",
      scope: "repo",
      selectedRepo: "acme/payments-api",
      defaultBranch: "main",
      lastSyncedAt: new Date().toISOString(),
      syncCommitSha: "deadbeef",
      syncFileCount: 4,
      updatedAt: new Date().toISOString(),
    };
    // Ensure memory empty for this id, then only file has the record.
    await clearCintGitHubConnection(projectId);
    cintDurablePut(CINT_GITHUB_CONN_DURABLE_NS, projectId, seed);

    const restored = await getCintGitHubConnection(projectId);
    expect(restored?.accessToken).toBe("gho_cold_start_token");
    expect(restored?.selectedRepo).toBe("acme/payments-api");
    expect(restored?.accountLogin).toBe("cold-user");
  });
});
