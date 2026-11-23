/**
 * cint.delivery.spine.v1 — Phase 11+ delivery readiness (PGMS·PGBE·SCW·PLS honesty).
 *
 * Report-only evaluation against real Part II owners / evidence.
 * Never hand-sets GoldenPathStatus.honestLabel.
 */

import { isCodeIntelligenceDeliverySchemaSealed } from "@/core/codeIntelligence/codeIntelligenceDeliverySchema";
import { CINT_PGMS_REQUIRED_ENTITIES } from "@/core/codeIntelligence/codeIntelligenceDeliverySchema";

export const CINT_DELIVERY_SPINE_KEY = "cint.delivery.spine.v1" as const;
export const CINT_DELIVERY_SPINE_VERSION = "CINT-DSP-1.0" as const;

export type DeliverySpineGateStatus =
  | "sealed"
  | "absent"
  | "demo_only"
  | "incomplete";

export type CodeIntelligenceDeliverySpineReport = Readonly<{
  version: "cint.delivery.spine.v1";
  spineVersion: typeof CINT_DELIVERY_SPINE_VERSION;
  evaluatedAt: string;
  gates: Readonly<{
    deliverySchema: DeliverySpineGateStatus;
    pgms: DeliverySpineGateStatus;
    pgbe: DeliverySpineGateStatus;
    scw: DeliverySpineGateStatus;
    pls: DeliverySpineGateStatus;
  }>;
  requiredEntities: readonly string[];
  mayClaimPartIIReady: boolean;
  blockers: readonly string[];
  constitution: readonly string[];
}>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function evaluatePgms(metadata: unknown): DeliverySpineGateStatus {
  const pgms = asRecord(asRecord(metadata)?.productGenerationModel);
  if (!pgms) return "absent";
  if (pgms.status === "sealed") return "sealed";
  if (pgms.status === "incomplete") return "incomplete";
  return "absent";
}

function evaluatePgbe(metadata: unknown, html?: string | null): DeliverySpineGateStatus {
  const pgms = asRecord(asRecord(metadata)?.productGenerationModel);
  const emitted = asRecord(pgms?.emitted);
  const apiRoutePaths = Array.isArray(emitted?.apiRoutePaths) ? emitted!.apiRoutePaths : [];
  const apiPaths = Array.isArray(emitted?.apiRoutes) ? emitted!.apiRoutes : [];
  const scaffolds = asRecord(emitted?.scaffolds);
  const scaffoldMap = asRecord(scaffolds?.apiRoutes);
  const scaffoldKeys = scaffoldMap ? Object.keys(scaffoldMap) : [];
  const scaffoldApis = Array.isArray(scaffolds?.apiRoutes) ? scaffolds!.apiRoutes : [];
  const hasEmit =
    apiRoutePaths.length > 0 ||
    apiPaths.length > 0 ||
    scaffoldKeys.length > 0 ||
    scaffoldApis.length > 0;
  if (hasEmit) {
    // Demo localStorage alone is not sealed — Part II marker required when cint.v1 present
    if (html && /cint\.v1\./i.test(html) && !/data-pgbe-sealed=["']1["']/i.test(html)) {
      return "demo_only";
    }
    return "sealed";
  }
  if (html && /cint\.v1\./i.test(html) && !/data-pgbe-sealed=["']1["']/i.test(html)) {
    return "demo_only";
  }
  return "absent";
}

function evaluateScw(html?: string | null, metadata?: unknown): DeliverySpineGateStatus {
  const meta = asRecord(metadata);
  const sealedContractWire = meta?.__replicaSealedContractWire === true;
  const pgms = asRecord(meta?.productGenerationModel);
  const emitted = asRecord(pgms?.emitted);
  const clientMap = Array.isArray(emitted?.clientPathMap) ? emitted!.clientPathMap : [];
  if ((html && /data-scw-wired=["']1["']/i.test(html) && clientMap.length > 0) || (sealedContractWire && clientMap.length > 0)) {
    return "sealed";
  }
  if (html && /data-scw-wired=["']1["']/i.test(html) && clientMap.length === 0) return "incomplete";
  if (clientMap.length > 0) return "incomplete";
  if (html && /data-cint-|cint\.v1\./i.test(html) && !/data-scw-wired=["']1["']/i.test(html)) {
    return "demo_only";
  }
  return "absent";
}

function evaluatePls(metadata: unknown): DeliverySpineGateStatus {
  const meta = asRecord(metadata);
  const gps = asRecord(meta?.goldenPathStatus);
  const smoke = asRecord(gps?.liveSmoke) ?? asRecord(meta?.liveSmoke);
  if (smoke?.ran === true && smoke?.passed === true) return "sealed";
  const productSmoke = asRecord(meta?.productLiveSmoke);
  if (productSmoke?.ok === true && productSmoke?.bootOk !== false) return "sealed";
  if (smoke?.ran === true || productSmoke) return "incomplete";
  return "absent";
}

/** Evaluate Part II readiness for CI — does not mutate metadata. */
export function evaluateCodeIntelligenceDeliverySpine(input: {
  metadata?: unknown;
  html?: string | null;
}): CodeIntelligenceDeliverySpineReport {
  const deliverySchema = isCodeIntelligenceDeliverySchemaSealed(input.metadata)
    ? "sealed"
    : "absent";
  const pgms = evaluatePgms(input.metadata);
  const pgbe = evaluatePgbe(input.metadata, input.html);
  const scw = evaluateScw(input.html, input.metadata);
  const pls = evaluatePls(input.metadata);

  const blockers: string[] = [];
  if (deliverySchema !== "sealed") blockers.push("delivery_schema_unsealed");
  if (pgms !== "sealed") blockers.push(`pgms_${pgms}`);
  if (pgbe !== "sealed") blockers.push(`pgbe_${pgbe}`);
  if (scw !== "sealed") blockers.push(`scw_${scw}`);
  if (pls !== "sealed") blockers.push(`pls_${pls}`);

  return {
    version: "cint.delivery.spine.v1",
    spineVersion: CINT_DELIVERY_SPINE_VERSION,
    evaluatedAt: new Date().toISOString(),
    gates: { deliverySchema, pgms, pgbe, scw, pls },
    requiredEntities: [...CINT_PGMS_REQUIRED_ENTITIES],
    mayClaimPartIIReady: blockers.length === 0,
    blockers,
    constitution: [
      "PGMS-1.0 productGenerationModel.status=sealed is the only schema seal claim",
      "PGBE requires emitted non-stub handlers — cint.v1 localStorage is demo_only",
      "SCW wire markers only when real clientPathMap bindings exist",
      "PLS requires liveSmoke ran+passed on GoldenPathStatus evidence",
    ],
  };
}

export function persistCodeIntelligenceDeliverySpine(
  metadata: unknown,
  report: CodeIntelligenceDeliverySpineReport,
): Record<string, unknown> {
  const base = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  base[CINT_DELIVERY_SPINE_KEY] = report;
  return base;
}

export function formatCodeIntelligenceDeliverySpineSummaryLines(
  report: CodeIntelligenceDeliverySpineReport,
): string[] {
  const g = report.gates;
  return [
    `○ Delivery spine ${report.spineVersion} — Part II ready: ${report.mayClaimPartIIReady ? "yes" : "no"}`,
    `○ schema=${g.deliverySchema} · pgms=${g.pgms} · pgbe=${g.pgbe} · scw=${g.scw} · pls=${g.pls}`,
  ];
}
