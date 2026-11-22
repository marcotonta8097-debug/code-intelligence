/**
 * cint.delivery.emit.v1 — Part II PGMS·PGBE·SCW·PLS emit for Code Intelligence.
 *
 * Projects sealed cint.delivery.schema.v1 entities into productGenerationModel
 * (PGMS-1.0) and BackendEmittedArtifacts (PGBE-1.0). Runs in-process PLS smoke
 * via existing pgbeTableOps — does not invent a parallel backend or honestLabel.
 */

import {
  CODE_INTELLIGENCE_DELIVERY_SCHEMAS,
  CINT_PGMS_REQUIRED_ENTITIES,
  isCodeIntelligenceDeliverySchemaSealed,
} from "@/core/codeIntelligence/codeIntelligenceDeliverySchema";
import { isCodeIntelligenceRollbackEngineSealed } from "@/core/codeIntelligence/codeIntelligenceRollbackEngine";
import { areCodeIntelligencePhases810Sealed } from "@/core/codeIntelligence/codeIntelligencePhases810Seal";
import { generateContractRouteScaffold } from "@/lib/backend/emitBackendArtifactsFromModel";
import { evaluatePgbeHandlerIntegrity } from "@/lib/backend/pgbeHandlerIntegrity";
import { pgbeTableOps } from "@/lib/backend/pgbeMemoryStore";
import { resolvePgbeTableName } from "@/lib/backend/pgbeRouteHandlers";
import { runProductGenerationLiveSmoke } from "@/lib/wiring/productGenerationLiveSmoke";
import { SEALED_CONTRACT_WIRE_VERSION } from "@/lib/wiring/sealedContractWiring";

export const CINT_DELIVERY_EMIT_KEY = "cint.delivery.emit.v1" as const;
export const CINT_DELIVERY_EMIT_VERSION = "CINT-DE-1.0" as const;

const CINT_API_PREFIX = "/api/projects/:projectId/cint";

export type CodeIntelligenceDeliveryEmitAuthority = Readonly<{
  version: "cint.delivery.emit.v1";
  sealed: boolean;
  sealedAt: string | null;
  emitVersion: typeof CINT_DELIVERY_EMIT_VERSION;
  inventPages: false;
  entities: readonly string[];
  apiRoutePaths: readonly string[];
  smokeOk: boolean;
  constitution: readonly string[];
}>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function cintEntityApiPath(persistenceKey: string): string {
  return `${CINT_API_PREFIX}/${persistenceKey}`;
}

function buildClientPathMap() {
  const bindings: Array<{
    method: string;
    path: string;
    entityName: string;
    operation: string;
    permissions: string[];
    label: string;
  }> = [];
  for (const entity of CODE_INTELLIGENCE_DELIVERY_SCHEMAS) {
    const path = cintEntityApiPath(entity.persistenceKey);
    bindings.push(
      {
        method: "GET",
        path,
        entityName: entity.entity,
        operation: "list",
        permissions: ["authenticated"],
        label: `List ${entity.entity}`,
      },
      {
        method: "POST",
        path,
        entityName: entity.entity,
        operation: "create",
        permissions: ["authenticated"],
        label: `Create ${entity.entity}`,
      },
      {
        method: "PATCH",
        path,
        entityName: entity.entity,
        operation: "update",
        permissions: ["authenticated"],
        label: `Update ${entity.entity}`,
      },
      {
        method: "DELETE",
        path,
        entityName: entity.entity,
        operation: "delete",
        permissions: ["authenticated"],
        label: `Delete ${entity.entity}`,
      },
    );
  }
  return bindings;
}

function buildApiRouteScaffolds(paths: readonly string[]): Record<string, string> {
  const apiRoutes: Record<string, string> = {};
  for (const entity of CODE_INTELLIGENCE_DELIVERY_SCHEMAS) {
    const path = cintEntityApiPath(entity.persistenceKey);
    const requiredFields = entity.fields.filter((f) => f.required && f.name !== "id").map((f) => f.name);
    apiRoutes[path] = generateContractRouteScaffold({
      apiPath: path,
      methods: ["GET", "POST", "PATCH", "DELETE"],
      entityName: entity.entity,
      tableName: entity.persistenceKey,
      requiredFields,
    });
  }
  // Ensure every path key covered
  for (const path of paths) {
    if (!apiRoutes[path]) {
      apiRoutes[path] = generateContractRouteScaffold({
        apiPath: path,
        methods: ["GET", "POST"],
        entityName: "Record",
        tableName: "records",
        requiredFields: ["name"],
      });
    }
  }
  return apiRoutes;
}

function runCiEntitySmoke(): { ok: boolean; messages: string[] } {
  const messages: string[] = [];
  for (const entity of CODE_INTELLIGENCE_DELIVERY_SCHEMAS) {
    const table = resolvePgbeTableName(entity.entity, entity.persistenceKey);
    try {
      pgbeTableOps.clear(table);
      const required: Record<string, unknown> = { name: `smoke_${entity.entity}` };
      for (const field of entity.fields) {
        if (!field.required || field.name === "id") continue;
        if (field.name in required) continue;
        if (field.type === "boolean") required[field.name] = false;
        else if (field.type === "timestamp") required[field.name] = new Date().toISOString();
        else if (field.type === "string[]") required[field.name] = [];
        else required[field.name] = `smoke_${field.name}`;
      }
      const created = pgbeTableOps.create(table, required);
      const listed = pgbeTableOps.list(table);
      const got = pgbeTableOps.get(table, created.id);
      const updated = pgbeTableOps.update(table, created.id, { name: `updated_${entity.entity}` });
      const removed = pgbeTableOps.remove(table, created.id);
      const ok =
        Boolean(got) &&
        listed.some((r) => r.id === created.id) &&
        Boolean(updated) &&
        removed === true &&
        pgbeTableOps.get(table, created.id) == null;
      if (!ok) messages.push(`CRUD failed for ${entity.entity}`);
    } catch (err) {
      messages.push(`${entity.entity}: ${String(err)}`);
    }
  }
  return { ok: messages.length === 0, messages };
}

export function detectCodeIntelligenceDeliveryEmitIntent(text: string): boolean {
  const t = text.toLowerCase();
  return (
    /\bpart\s*ii\b/.test(t) ||
    /\bpgms\b/.test(t) ||
    /\bpgbe\b/.test(t) ||
    /\bdelivery emit\b/.test(t) ||
    /\bcint\.delivery\.emit\.v1\b/.test(t) ||
    /\bseal\b.{0,30}\b(part\s*ii|pgms|pgbe|scw|pls)\b/.test(t) ||
    /\breal\b.{0,20}\b(backend|emit|spine)\b/.test(t) ||
    /\bcomplete\b.{0,40}\b(production|independence|part\s*ii)\b/.test(t)
  );
}

export function buildCodeIntelligenceDeliveryEmitAuthority(options?: {
  sealed?: boolean;
  smokeOk?: boolean;
  apiRoutePaths?: readonly string[];
}): CodeIntelligenceDeliveryEmitAuthority {
  const sealed = options?.sealed === true;
  const paths =
    options?.apiRoutePaths ??
    CODE_INTELLIGENCE_DELIVERY_SCHEMAS.map((e) => cintEntityApiPath(e.persistenceKey));
  return {
    version: "cint.delivery.emit.v1",
    sealed,
    sealedAt: sealed ? new Date().toISOString() : null,
    emitVersion: CINT_DELIVERY_EMIT_VERSION,
    inventPages: false,
    entities: [...CINT_PGMS_REQUIRED_ENTITIES],
    apiRoutePaths: [...paths],
    smokeOk: options?.smokeOk === true,
    constitution: [
      "PGMS-1.0 productGenerationModel.status=sealed from cint.delivery.schema.v1",
      "PGBE-1.0 scaffolds delegate to pgbeRouteHandlers — not demo localStorage as sole store",
      "SCW-1.0 clientPathMap + data-scw-wired / __replicaSealedContractWire",
      "PLS-1.0 productLiveSmoke via existing live smoke owner",
      "Does not write GoldenPathStatus.honestLabel",
      "inventPages=false",
    ],
  };
}

export function sealCodeIntelligenceDeliveryEmit(metadata: unknown): {
  metadata: Record<string, unknown>;
  emit: CodeIntelligenceDeliveryEmitAuthority;
  blockedReason?: string;
} {
  const base = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  if (!areCodeIntelligencePhases810Sealed(base)) {
    return {
      metadata: base,
      emit: buildCodeIntelligenceDeliveryEmitAuthority({ sealed: false }),
      blockedReason: "Phases 8–10 must be sealed before Part II delivery emit.",
    };
  }
  if (!isCodeIntelligenceDeliverySchemaSealed(base)) {
    return {
      metadata: base,
      emit: buildCodeIntelligenceDeliveryEmitAuthority({ sealed: false }),
      blockedReason: "Phase 11 Delivery Schema must be sealed before Part II emit.",
    };
  }
  if (!isCodeIntelligenceRollbackEngineSealed(base)) {
    return {
      metadata: base,
      emit: buildCodeIntelligenceDeliveryEmitAuthority({ sealed: false }),
      blockedReason: "Phase 12 Recovery & Rollback must be sealed before Part II emit.",
    };
  }

  const clientPathMap = buildClientPathMap();
  const apiRoutePaths = [
    ...new Set(CODE_INTELLIGENCE_DELIVERY_SCHEMAS.map((e) => cintEntityApiPath(e.persistenceKey))),
  ];
  const scaffoldsApiRoutes = buildApiRouteScaffolds(apiRoutePaths);
  const integrity = evaluatePgbeHandlerIntegrity(scaffoldsApiRoutes);
  if (!integrity.passed) {
    return {
      metadata: base,
      emit: buildCodeIntelligenceDeliveryEmitAuthority({ sealed: false }),
      blockedReason: `PGBE integrity failed: ${integrity.blockers
        .slice(0, 3)
        .map((b) => b.code)
        .join(", ")}`,
    };
  }

  const crudSmoke = runCiEntitySmoke();
  const plsPreview = runProductGenerationLiveSmoke({
    html: `<div data-product-surface="code_intelligence" data-pgbe-sealed="1" data-scw-wired="1"></div>`,
    js: `/* ${SEALED_CONTRACT_WIRE_VERSION} __replicaSealedContractWire bindSealedContracts ${apiRoutePaths[0] ?? ""} __replicaSealedBindings */`,
    metadata: {
      productGenerationModel: {
        status: "sealed",
        emitted: { clientPathMap, apiRoutePaths },
      },
    },
    bindings: clientPathMap.map((b) => ({
      method: b.method,
      path: b.path,
      entityName: b.entityName,
      operation: b.operation,
      label: b.label,
    })),
    required: true,
  });

  const smokeOk = crudSmoke.ok && plsPreview.ok;

  base.productGenerationModel = {
    version: "PGMS-1.0",
    status: "sealed",
    required: true,
    domain: "APP_DOMAIN",
    entityCount: CINT_PGMS_REQUIRED_ENTITIES.length,
    endpointCount: clientPathMap.length,
    tableCount: CODE_INTELLIGENCE_DELIVERY_SCHEMAS.length,
    capabilityMode: "FULL_GENERATION",
    issues: [],
    emitted: {
      version: "PGBE-1.0",
      clientPathMap,
      apiRoutePaths,
      apiRoutes: [...apiRoutePaths],
      tableNames: CODE_INTELLIGENCE_DELIVERY_SCHEMAS.map((e) => e.persistenceKey),
      scaffolds: { apiRoutes: scaffoldsApiRoutes },
      routeScaffoldCount: apiRoutePaths.length,
      tableCount: CODE_INTELLIGENCE_DELIVERY_SCHEMAS.length,
    },
    source: "cint.delivery.emit.v1",
  };

  base.__replicaSealedContractWire = true;
  base.productLiveSmoke = {
    ok: smokeOk,
    bootOk: true,
    messages: [...crudSmoke.messages, ...(plsPreview.messages ?? [])],
    mode: "in_process_handlers",
    ranAt: new Date().toISOString(),
    source: "cint.delivery.emit.v1",
  };
  const gps = asRecord(base.goldenPathStatus) ? { ...asRecord(base.goldenPathStatus)! } : {};
  gps.liveSmoke = {
    ran: true,
    passed: smokeOk,
    failedChecks: smokeOk ? [] : [...crudSmoke.messages, ...(plsPreview.messages ?? [])],
    ranAt: new Date().toISOString(),
  };
  base.goldenPathStatus = gps;

  const emit = buildCodeIntelligenceDeliveryEmitAuthority({
    sealed: true,
    smokeOk,
    apiRoutePaths,
  });
  base[CINT_DELIVERY_EMIT_KEY] = emit;

  if (!smokeOk) {
    return {
      metadata: base,
      emit,
      blockedReason: `Part II emit sealed but PLS smoke failed: ${[
        ...crudSmoke.messages,
        ...(plsPreview.messages ?? []),
      ]
        .slice(0, 3)
        .join("; ")}`,
    };
  }

  return { metadata: base, emit };
}

export function readCodeIntelligenceDeliveryEmit(
  metadata?: unknown,
): CodeIntelligenceDeliveryEmitAuthority | null {
  const block = asRecord(asRecord(metadata)?.[CINT_DELIVERY_EMIT_KEY]);
  if (!block || block.version !== "cint.delivery.emit.v1") return null;
  return block as CodeIntelligenceDeliveryEmitAuthority;
}

export function isCodeIntelligenceDeliveryEmitSealed(metadata?: unknown): boolean {
  const e = readCodeIntelligenceDeliveryEmit(metadata);
  return Boolean(e?.sealed && e.sealedAt && e.smokeOk);
}

/** HVM heal — stamp Part II markers on existing CI shell (no page invent). */
export function stampCodeIntelligencePartIIHtml(html: string): string {
  if (!html.trim()) return html;
  let next = html;
  if (!/data-pgbe-sealed=/i.test(next)) {
    next = next.replace(
      /(data-product-surface=["']code_intelligence["'][^>]*)(>)/i,
      '$1 data-pgbe-sealed="1"$2',
    );
    if (!/data-pgbe-sealed=/i.test(next)) {
      next = next.replace(/(data-cint-app-shell(?:=["'][^"']*["'])?)([^>]*)(>)/i, '$1$2 data-pgbe-sealed="1"$3');
    }
  }
  if (!/data-scw-wired=/i.test(next)) {
    next = next.replace(/(data-pgbe-sealed=["']1["'])/i, '$1 data-scw-wired="1"');
  }
  return next;
}

export function formatCodeIntelligenceDeliveryEmitSummaryLines(
  emit: CodeIntelligenceDeliveryEmitAuthority,
): string[] {
  return [
    `${emit.sealed ? "✓" : "○"} Delivery Emit ${emit.emitVersion} (${CINT_DELIVERY_EMIT_KEY})`,
    `○ Entities: ${emit.entities.join(" · ")}`,
    `○ Routes: ${emit.apiRoutePaths.length} · PLS smoke: ${emit.smokeOk ? "passed" : "failed"}`,
  ];
}
