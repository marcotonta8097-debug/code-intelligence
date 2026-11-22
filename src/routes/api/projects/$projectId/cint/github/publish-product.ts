import { createFileRoute } from "@tanstack/react-router";
import { withSentryApiRoute } from "@/lib/monitoring/withSentryApiRoute";
import {
  publishCintProductToGitHub,
  selfLoadCintProductSource,
} from "@/lib/cint/cintProductPublish";
import { buildCintProductSourcePack } from "@/lib/cint/cintProductSourcePack";
import { assessCintIngressEgressReadiness } from "@/lib/cint/cintIngressEgressPipeline";

const PATH = "/api/projects/$projectId/cint/github/publish-product";

export const Route = createFileRoute("/api/projects/$projectId/cint/github/publish-product")({
  server: {
    handlers: {
      GET: withSentryApiRoute(PATH, async ({ params }) => {
        const projectId = params?.projectId?.trim();
        if (!projectId) {
          return Response.json({ ok: false, error: "missing_project" }, { status: 400 });
        }
        const pack = buildCintProductSourcePack({ maxFiles: 8 });
        return Response.json({
          ok: true,
          product: "code_intelligence",
          packVersion: pack.packVersion,
          defaultRepoSlug: pack.defaultRepoSlug,
          sampleFileCount: pack.fileCount,
          readiness: assessCintIngressEgressReadiness(),
          actions: ["self_load", "publish_github"],
        });
      }),
      POST: withSentryApiRoute(PATH, async ({ request, params }) => {
        const projectId = params?.projectId?.trim();
        if (!projectId) {
          return Response.json({ ok: false, error: "missing_project" }, { status: 400 });
        }
        const body = (await request.json().catch(() => ({}))) as {
          mode?: string;
          action?: string;
          repoName?: string;
          private?: boolean;
        };
        const mode = String(body.mode || body.action || "publish_github")
          .toLowerCase()
          .trim();

        try {
          if (mode === "self_load" || mode === "load-self" || mode === "self") {
            const result = await selfLoadCintProductSource(projectId);
            return Response.json({
              ...result,
              readiness: assessCintIngressEgressReadiness(),
            });
          }

          if (
            mode === "publish_github" ||
            mode === "publish-product" ||
            mode === "publish" ||
            mode === "github"
          ) {
            const result = await publishCintProductToGitHub(projectId, {
              repoName: body.repoName,
              private: body.private,
            });
            return Response.json({
              ...result,
              readiness: assessCintIngressEgressReadiness(),
            });
          }

          return Response.json(
            {
              ok: false,
              error: "unsupported_mode",
              detail: "Use mode=self_load | publish_github",
            },
            { status: 400 },
          );
        } catch (e) {
          const err = e as Error & { code?: string; status?: number };
          const status = typeof err.status === "number" ? err.status : 500;
          return Response.json(
            {
              ok: false,
              error: err.message || "publish_product_failed",
              code: err.code,
            },
            { status },
          );
        }
      }),
    },
  },
});
