import { createFileRoute } from "@tanstack/react-router";
import { withSentryApiRoute } from "@/lib/monitoring/withSentryApiRoute";
import {
  assessCintIngressEgressReadiness,
  ingestZipUploadBytes,
  listCintUploads,
  registerCintUpload,
} from "@/lib/cint/cintIngressEgressPipeline";
import {
  enforceRateLimitPlaceholder,
  isProduction,
  serverLogError,
} from "@/serverFns/security.server";

const PATH = "/api/projects/$projectId/cint/upload";
const MAX_ZIP_BYTES = 12_000_000;

async function readUploadPayload(request: Request): Promise<{
  kind: string;
  filename: string;
  bytes: Uint8Array | null;
  repositoryId?: string;
}> {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const kind = String(form.get("kind") || "zip");
    const repositoryId = String(form.get("repositoryId") || form.get("repository") || "").trim() || undefined;
    const file = form.get("file");
    if (file && typeof file === "object" && "arrayBuffer" in file) {
      const blob = file as File;
      const filename = String(form.get("filename") || blob.name || "archive.zip");
      const buf = new Uint8Array(await blob.arrayBuffer());
      return { kind, filename, bytes: buf, repositoryId };
    }
    return {
      kind,
      filename: String(form.get("filename") || "asset.bin"),
      bytes: null,
      repositoryId,
    };
  }

  const body = (await request.json().catch(() => ({}))) as {
    kind?: string;
    filename?: string;
    repositoryId?: string;
    repository?: string;
    contentBase64?: string;
    bytesNoted?: number;
  };
  const filename = (body.filename || "asset.bin").trim() || "asset.bin";
  const kind = (body.kind || "zip").trim() || "zip";
  const repositoryId = (body.repositoryId || body.repository || "").trim() || undefined;
  if (body.contentBase64?.trim()) {
    const raw = body.contentBase64.trim().replace(/^data:.*?;base64,/, "");
    const bytes = Uint8Array.from(Buffer.from(raw, "base64"));
    return { kind, filename, bytes, repositoryId };
  }
  return { kind, filename, bytes: null, repositoryId };
}

export const Route = createFileRoute("/api/projects/$projectId/cint/upload")({
  server: {
    handlers: {
      GET: withSentryApiRoute(PATH, async ({ params }) => {
        const projectId = params?.projectId?.trim();
        if (!projectId) {
          return Response.json({ ok: false, error: "missing_project" }, { status: 400 });
        }
        return Response.json({
          ok: true,
          live: true,
          readiness: assessCintIngressEgressReadiness(),
          uploads: listCintUploads(projectId),
        });
      }),
      POST: withSentryApiRoute(PATH, async ({ request, params }) => {
        const projectId = params?.projectId?.trim();
        if (!projectId) {
          return Response.json({ ok: false, error: "missing_project" }, { status: 400 });
        }
        try {
          await enforceRateLimitPlaceholder(`cint-upload:${projectId}`, "project:cint");
          const payload = await readUploadPayload(request);
          if (!payload.filename) {
            return Response.json(
              { ok: false, error: "filename_required", detail: "Provide filename for upload" },
              { status: 400 },
            );
          }

          if (payload.bytes && payload.bytes.byteLength > 0) {
            if (payload.bytes.byteLength > MAX_ZIP_BYTES) {
              return Response.json(
                { ok: false, error: "zip_too_large", detail: `Max ZIP size is ${MAX_ZIP_BYTES} bytes` },
                { status: 413 },
              );
            }
            const isZip =
              payload.kind === "zip" ||
              /\.zip$/i.test(payload.filename) ||
              (payload.bytes[0] === 0x50 && payload.bytes[1] === 0x4b);
            if (!isZip) {
              const record = registerCintUpload({
                projectId,
                kind: payload.kind,
                filename: payload.filename,
                bytesNoted: payload.bytes.byteLength,
                note: "Non-ZIP bytes accepted on ledger only — extract supports ZIP archives.",
              });
              return Response.json({
                ok: true,
                live: true,
                extracted: false,
                upload: record,
                readiness: assessCintIngressEgressReadiness(),
              });
            }
            const result = await ingestZipUploadBytes({
              projectId,
              filename: payload.filename,
              bytes: payload.bytes,
              kind: payload.kind,
              repositoryId: payload.repositoryId,
            });
            return Response.json({
              ...result,
              live: true,
              extracted: true,
              readiness: assessCintIngressEgressReadiness(),
            });
          }

          const record = registerCintUpload({
            projectId,
            kind: payload.kind,
            filename: payload.filename,
            bytesNoted: null,
          });
          return Response.json({
            ok: true,
            live: true,
            extracted: false,
            upload: record,
            readiness: assessCintIngressEgressReadiness(),
          });
        } catch (error) {
          if (!isProduction()) {
            serverLogError(
              "projects/cint/upload",
              error instanceof Error ? error.message : String(error),
            );
          }
          return Response.json(
            { ok: false, error: error instanceof Error ? error.message : "upload_failed" },
            { status: 500 },
          );
        }
      }),
    },
  },
});
