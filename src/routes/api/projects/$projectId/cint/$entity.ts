/**
 * CI Part II data surface — CRUD for sealed delivery-schema entities.
 * Uses cintEntityStore (CINT Supabase when configured, else pgbe memory).
 * Tier 1: requireCintProductAuth + project_id isolation on every store call.
 */

import { createFileRoute } from "@tanstack/react-router";
import { withSentryApiRoute } from "@/lib/monitoring/withSentryApiRoute";
import {
  CODE_INTELLIGENCE_DELIVERY_SCHEMAS,
  type CodeIntelligenceSchemaField,
} from "@/core/codeIntelligence/codeIntelligenceDeliverySchema";
import { handleCintAuthGet, handleCintAuthPost } from "@/lib/cint/cintAuthHttp";
import { cintEntityStore, cintStoreMode } from "@/lib/cint/cintEntityStore";
import { requireCintProductAuth } from "@/lib/cint/requireCintProductAuth";
import type { CintCapability } from "@/lib/cint/cintAuthRoles";
import {
  enforceRateLimitPlaceholder,
  isProduction,
  serverLogError,
} from "@/serverFns/security.server";

const PATH = "/api/projects/$projectId/cint/$entity";
const SOURCE = "cint.delivery.emit.v1";

const ENTITY_BY_KEY = new Map(
  CODE_INTELLIGENCE_DELIVERY_SCHEMAS.map((e) => [e.persistenceKey.toLowerCase(), e]),
);

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

const RESERVED_CINT_SEGMENTS = new Set([
  "github",
  "assistant",
  "remediation",
  "connect",
  "callback",
  "sync",
  "status",
  "repos",
  "apply",
  "analyze",
  "agents",
  "export",
  "import",
  "run",
  "admin",
  // "auth" is NOT reserved — $entity fallback serves product IdP when /cint/auth static route misses.
  "login",
  "logout",
  "signup",
  "session",
]);

/** B2 durability ledger — not one of the five PGMS honesty entities. */
const DURABILITY_LEDGER_KEYS = new Set(["analysis_runs"]);

function resolveEntity(raw: string | undefined): {
  entity: string;
  persistenceKey: string;
  pgmsRequired?: boolean;
  fields?: readonly CodeIntelligenceSchemaField[];
} | null {
  const key = (raw ?? "").trim().toLowerCase();
  if (RESERVED_CINT_SEGMENTS.has(key)) return null;
  const sealed = ENTITY_BY_KEY.get(key);
  if (sealed) return sealed;
  if (DURABILITY_LEDGER_KEYS.has(key)) {
    return { entity: "AnalysisRun", persistenceKey: key, pgmsRequired: false, fields: [] };
  }
  return null;
}

function apiPath(projectId: string, persistenceKey: string): string {
  return `/api/projects/${projectId}/cint/${persistenceKey}`;
}

function json(body: Record<string, unknown>, status = 200): Response {
  return Response.json(body, { status });
}

function capabilityForMethod(method: string): CintCapability {
  if (method === "GET") return "workspace.read";
  if (method === "DELETE") return "org.admin";
  return "findings.triage";
}

export const Route = createFileRoute("/api/projects/$projectId/cint/$entity")({
  server: {
    handlers: {
      GET: withSentryApiRoute(PATH, async ({ request, params }) => {
        const projectId = params?.projectId?.trim();
        const rawEntity = (params?.entity ?? "").trim().toLowerCase();
        if (projectId && rawEntity === "auth") {
          return handleCintAuthGet(request, projectId);
        }
        const entity = resolveEntity(params?.entity);
        if (!projectId || !entity) {
          return json({ success: false, error: "Unknown CI entity" }, 404);
        }
        const gate = await requireCintProductAuth(request, capabilityForMethod("GET"));
        if (!gate.ok) return gate.response;
        try {
          await enforceRateLimitPlaceholder(
            `cint-get:${clientIp(request)}:${projectId}:${entity.persistenceKey}`,
            "project:cint",
          );
          const path = apiPath(projectId, entity.persistenceKey);
          const url = new URL(request.url);
          const id = url.searchParams.get("id");
          if (id) {
            const row = await cintEntityStore.get(entity.persistenceKey, id, projectId);
            if (!row) {
              return json(
                { ok: false, error: "not_found", path, entity: entity.entity, source: SOURCE },
                404,
              );
            }
            return json({
              ok: true,
              path,
              entity: entity.entity,
              data: row,
              store: cintStoreMode(),
              source: SOURCE,
            });
          }
          const rows = await cintEntityStore.list(entity.persistenceKey, projectId);
          return json({
            ok: true,
            path,
            entity: entity.entity,
            data: rows,
            store: cintStoreMode(),
            source: SOURCE,
          });
        } catch (error) {
          if (!isProduction()) {
            serverLogError("projects/cint", error instanceof Error ? error.message : String(error));
          }
          return json({ success: false, error: "CI store error" }, 500);
        }
      }),
      POST: withSentryApiRoute(PATH, async ({ request, params }) => {
        const projectId = params?.projectId?.trim();
        const rawEntity = (params?.entity ?? "").trim().toLowerCase();
        // Fallback IdP path when static /cint/auth is not registered in the running server.
        if (projectId && rawEntity === "auth") {
          return handleCintAuthPost(request, projectId);
        }
        const entity = resolveEntity(params?.entity);
        if (!projectId || !entity) {
          return json({ success: false, error: "Unknown CI entity" }, 404);
        }
        const gate = await requireCintProductAuth(request, capabilityForMethod("POST"));
        if (!gate.ok) return gate.response;
        try {
          await enforceRateLimitPlaceholder(
            `cint-post:${clientIp(request)}:${projectId}:${entity.persistenceKey}`,
            "project:cint",
          );
          const path = apiPath(projectId, entity.persistenceKey);
          const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
          const required = (entity.fields ?? [])
            .filter((f) => f.required && f.name !== "id")
            .map((f) => f.name);
          for (const field of required) {
            if (body[field] == null || body[field] === "") {
              return json(
                {
                  ok: false,
                  error: "missing_field",
                  field,
                  path,
                  entity: entity.entity,
                  source: SOURCE,
                },
                400,
              );
            }
          }
          const created = await cintEntityStore.create(entity.persistenceKey, body, projectId);
          return json(
            {
              ok: true,
              path,
              entity: entity.entity,
              created,
              store: cintStoreMode(),
              source: SOURCE,
            },
            201,
          );
        } catch (error) {
          if (!isProduction()) {
            serverLogError("projects/cint", error instanceof Error ? error.message : String(error));
          }
          return json({ success: false, error: "CI store error" }, 500);
        }
      }),
      PATCH: withSentryApiRoute(PATH, async ({ request, params }) => {
        const projectId = params?.projectId?.trim();
        const entity = resolveEntity(params?.entity);
        if (!projectId || !entity) {
          return json({ success: false, error: "Unknown CI entity" }, 404);
        }
        const gate = await requireCintProductAuth(request, capabilityForMethod("PATCH"));
        if (!gate.ok) return gate.response;
        try {
          await enforceRateLimitPlaceholder(
            `cint-patch:${clientIp(request)}:${projectId}:${entity.persistenceKey}`,
            "project:cint",
          );
          const path = apiPath(projectId, entity.persistenceKey);
          const url = new URL(request.url);
          const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
          const id =
            url.searchParams.get("id") || (typeof body.id === "string" ? body.id : "");
          if (!id) {
            return json(
              { ok: false, error: "id_required", path, entity: entity.entity, source: SOURCE },
              400,
            );
          }
          const updated = await cintEntityStore.update(entity.persistenceKey, id, body, projectId);
          if (!updated) {
            return json(
              { ok: false, error: "not_found", path, entity: entity.entity, source: SOURCE },
              404,
            );
          }
          return json({
            ok: true,
            path,
            entity: entity.entity,
            updated,
            store: cintStoreMode(),
            source: SOURCE,
          });
        } catch (error) {
          if (!isProduction()) {
            serverLogError("projects/cint", error instanceof Error ? error.message : String(error));
          }
          return json({ success: false, error: "CI store error" }, 500);
        }
      }),
      DELETE: withSentryApiRoute(PATH, async ({ request, params }) => {
        const projectId = params?.projectId?.trim();
        const entity = resolveEntity(params?.entity);
        if (!projectId || !entity) {
          return json({ success: false, error: "Unknown CI entity" }, 404);
        }
        const gate = await requireCintProductAuth(request, capabilityForMethod("DELETE"));
        if (!gate.ok) return gate.response;
        try {
          await enforceRateLimitPlaceholder(
            `cint-del:${clientIp(request)}:${projectId}:${entity.persistenceKey}`,
            "project:cint",
          );
          const path = apiPath(projectId, entity.persistenceKey);
          const id = new URL(request.url).searchParams.get("id");
          if (!id) {
            return json(
              { ok: false, error: "id_required", path, entity: entity.entity, source: SOURCE },
              400,
            );
          }
          const deleted = await cintEntityStore.remove(entity.persistenceKey, id, projectId);
          if (!deleted) {
            return json(
              { ok: false, error: "not_found", path, entity: entity.entity, source: SOURCE },
              404,
            );
          }
          return json({
            ok: true,
            path,
            entity: entity.entity,
            deleted: true,
            store: cintStoreMode(),
            source: SOURCE,
          });
        } catch (error) {
          if (!isProduction()) {
            serverLogError("projects/cint", error instanceof Error ? error.message : String(error));
          }
          return json({ success: false, error: "CI store error" }, 500);
        }
      }),
    },
  },
});
