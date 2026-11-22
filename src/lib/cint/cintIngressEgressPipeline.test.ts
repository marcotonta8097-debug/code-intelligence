import { beforeEach, describe, expect, it } from "vitest";
import { cintEntityStore } from "@/lib/cint/cintEntityStore";
import {
  assertGithubSourceNormalizes,
  assessCintIngressEgressReadiness,
  buildCintExportBundle,
  collectCintExportBundle,
  slimCintExportBundle,
  ingestLocalSnapshotTree,
  listCintUploads,
  redactCintExportValue,
  registerCintUpload,
  renderCintExport,
} from "@/lib/cint/cintIngressEgressPipeline";

describe("cintIngressEgressPipeline", () => {
  const projectId = `cint_pipeline_proof_${Date.now()}`;

  beforeEach(async () => {
    // Memory store is process-global — create unique project-scoped rows; no wipe API.
  });

  it("normalizes GitHub owner/repo and URL forms", () => {
    expect(assertGithubSourceNormalizes("acme/payments-api")).toBe("acme/payments-api");
    expect(assertGithubSourceNormalizes("https://github.com/acme/payments-api")).toBe(
      "acme/payments-api",
    );
    expect(() => assertGithubSourceNormalizes("")).toThrow(/repository_required/);
  });

  it("reports readiness honestly when OAuth is missing", () => {
    const r = assessCintIngressEgressReadiness();
    expect(r.canLocalExtract).toBe(true);
    expect(r.canExport).toBe(true);
    expect(r.canUploadRegister).toBe(true);
    if (!r.oauthConfigured) {
      expect(r.canLiveGithub).toBe(false);
      expect(r.blockers.length).toBeGreaterThan(0);
      expect(r.blockers[0]).toMatch(/CINT_GITHUB/);
    }
  });

  it("proves local extract → store → export → upload ledger without OAuth", async () => {
    const extracted = await ingestLocalSnapshotTree({
      projectId,
      repositoryId: "payments-api",
    });
    expect(extracted.ok).toBe(true);
    expect(extracted.fileCount).toBeGreaterThan(0);
    expect(extracted.liveIndex.provider).toBe("local_snapshot");
    expect(extracted.liveIndex.synced).toBe(true);

    const repos = await cintEntityStore.list("repositories");
    expect(repos.some((r) => String(r.name || r.id).includes("payments-api"))).toBe(true);

    await cintEntityStore.create("findings", {
      id: `finding_${projectId}`,
      title: "Pipeline proof finding",
      severity: "high",
      status: "open",
      confidence: "high",
      repository_id: extracted.repository,
      location: "cmd/api/server.go",
    });

    const upload = registerCintUpload({
      projectId,
      kind: "zip",
      filename: "proof-pack.zip",
      bytesNoted: 128,
    });
    expect(upload.status).toBe("REGISTERED");
    expect(listCintUploads(projectId).some((u) => u.id === upload.id)).toBe(true);

    const bundle = await collectCintExportBundle(projectId, extracted.liveIndex);
    const withExtras = {
      ...bundle,
      uploads: listCintUploads(projectId),
      readiness: assessCintIngressEgressReadiness(),
    };

    const json = renderCintExport(withExtras, "json");
    expect(json.contentType).toMatch(/json/);
    expect(json.body).toContain("cint.export.v1");
    expect(json.body).toContain("payments-api");
    expect(json.body).toContain("proof-pack.zip");
    expect(json.body).not.toMatch(/"accessToken"/);

    const csv = renderCintExport(withExtras, "csv");
    expect(csv.contentType).toMatch(/csv/);
    expect(csv.body).toContain("Pipeline proof finding");

    const md = renderCintExport(withExtras, "markdown");
    expect(md.contentType).toMatch(/markdown/);
    expect(md.body).toContain("# Code Intelligence export");
  });

  it("slims tree file bodies and long evidence snippets for downloadable exports", () => {
    const fat = buildCintExportBundle({
      projectId: "p-slim",
      repositories: [
        {
          id: "r1",
          name: "demo",
          tree: { id: "demo", files: [{ path: "a.ts", bytes: 12, content: "x".repeat(5000) }] },
          payload: { huge: true },
        },
      ],
      findings: [{ id: "f1", title: "t", why: "y".repeat(2000) }],
      evidence: [{ id: "e1", snippet: "s".repeat(2000), content: "secret-body" }],
      investigations: [{ id: "i1", notes: "n".repeat(2000), transcript: "long" }],
      remediation: [],
    });
    const slim = slimCintExportBundle(fat);
    const rendered = renderCintExport(fat, "json");
    expect((slim.repositories[0] as { tree?: { files?: { content?: string }[] } }).tree?.files?.[0]?.content).toBeUndefined();
    expect((slim.repositories[0] as { payload?: unknown }).payload).toBeUndefined();
    expect(String((slim.evidence[0] as { snippet: string }).snippet).length).toBeLessThan(600);
    expect(rendered.body).not.toContain("secret-body");
    expect(rendered.body.length).toBeLessThan(JSON.stringify(fat).length);
  });

  it("strips secrets from export serialization", () => {
    expect(redactCintExportValue("accessToken", "secret")).toBeUndefined();
    expect(redactCintExportValue("title", "ok")).toBe("ok");
    const leaked = buildCintExportBundle({
      projectId: "p1",
      repositories: [{ name: "x", accessToken: "leak" }],
      findings: [],
      evidence: [],
      investigations: [],
      remediation: [],
    });
    const rendered = renderCintExport(leaked, "json");
    expect(rendered.body).not.toContain("leak");
  });
});
