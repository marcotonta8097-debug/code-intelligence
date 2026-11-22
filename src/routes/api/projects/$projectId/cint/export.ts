import { createFileRoute } from "@tanstack/react-router";
import { withSentryApiRoute } from "@/lib/monitoring/withSentryApiRoute";
import {
  assessCintIngressEgressReadiness,
  collectCintExportBundle,
  listCintUploads,
  renderCintExport,
  type CintExportFormat,
} from "@/lib/cint/cintIngressEgressPipeline";
import {
  connectionToLiveIndexEvidence,
  getCintGitHubConnection,
} from "@/lib/cint/cintGitHubConnectionStore";

const PATH = "/api/projects/$projectId/cint/export";

function normalizeFormat(raw: string): CintExportFormat {
  const f = raw.toLowerCase().trim();
  if (f === "csv" || f === "markdown" || f === "md") return f === "md" ? "markdown" : f;
  if (f === "pdf") return "pdf";
  if (f === "download" || f === "file") return "download";
  return "json";
}

export const Route = createFileRoute("/api/projects/$projectId/cint/export")({
  server: {
    handlers: {
      GET: withSentryApiRoute(PATH, async ({ params, request }) => {
        const projectId = params?.projectId?.trim();
        if (!projectId) {
          return Response.json({ ok: false, error: "missing_project" }, { status: 400 });
        }
        const url = new URL(request.url);
        const format = normalizeFormat(url.searchParams.get("format") || "json");
        const asAttachment =
          format === "download" ||
          format === "file" ||
          format === "csv" ||
          format === "markdown" ||
          format === "pdf" ||
          url.searchParams.get("download") === "1";

        const conn = await getCintGitHubConnection(projectId);
        const bundle = await collectCintExportBundle(
          projectId,
          connectionToLiveIndexEvidence(conn),
        );
        const withUploads = {
          ...bundle,
          uploads: listCintUploads(projectId),
          readiness: assessCintIngressEgressReadiness(),
        };

        if (asAttachment || format !== "json") {
          const rendered = renderCintExport(
            withUploads,
            format === "download" || format === "file" ? "json" : format,
          );
          return new Response(rendered.body, {
            status: 200,
            headers: {
              "Content-Type": rendered.contentType,
              "Content-Disposition": `attachment; filename="${rendered.filename}"`,
            },
          });
        }

        const rendered = renderCintExport(withUploads, "json");
        return Response.json({
          ok: true,
          live: true,
          data: JSON.parse(rendered.body),
        });
      }),
    },
  },
});
