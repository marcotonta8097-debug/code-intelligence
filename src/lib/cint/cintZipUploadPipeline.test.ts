import { describe, expect, it } from "vitest";
import { ingestZipUploadBytes, listCintUploads } from "@/lib/cint/cintIngressEgressPipeline";
import { buildStoredZipFixture } from "@/lib/cint/cintZipExtract";
import { cintEntityStore } from "@/lib/cint/cintEntityStore";

describe("ingestZipUploadBytes", () => {
  it("extracts real ZIP bytes into entity store + durable ledger", async () => {
    const projectId = `cint_zip_${Date.now()}`;
    const zip = buildStoredZipFixture([
      { path: "go.mod", content: "module zipdemo\n\nrequire github.com/gin-gonic/gin v1.9.1\n" },
      { path: "main.go", content: "package main\nfunc main() {}\n" },
    ]);

    const result = await ingestZipUploadBytes({
      projectId,
      filename: "zipdemo.zip",
      bytes: zip,
      repositoryId: "zipdemo",
    });

    expect(result.ok).toBe(true);
    expect(result.fileCount).toBe(2);
    expect(result.upload.status).toBe("EXTRACTED");
    expect(result.liveIndex.provider).toBe("local_snapshot");

    const repos = await cintEntityStore.list("repositories");
    expect(repos.some((r) => String(r.name || "").includes("zipdemo"))).toBe(true);
    expect(listCintUploads(projectId).some((u) => u.id === result.upload.id)).toBe(true);
  });
});
