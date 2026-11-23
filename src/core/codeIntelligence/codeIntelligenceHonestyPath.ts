/**
 * Pack 10 — Honest interactive_prototype → production_candidate path (CI).
 *
 * Does NOT write GoldenPathStatus.honestLabel (PDS-1.0 / buildGoldenPathStatus only).
 * Evaluates demo trust blockers and feeds gatherGoldenPathStatus so CI cannot
 * silently become production_candidate on localStorage demo binding.
 * When Part II emit + connector wire clear, blockers drop and dataBindingReal may be true.
 */

import { CODE_INTELLIGENCE_PRODUCT_MANIFEST } from "@/core/domainPack/codeIntelligenceProductArtifacts";
import { isCodeIntelligenceIdentitySealed } from "@/core/codeIntelligence/codeIntelligenceIdentityConstitution";
import { isCodeIntelligenceRegistrySealed } from "@/core/codeIntelligence/codeIntelligenceRegistryAuthority";
import { isCodeIntelligenceEntitySealed } from "@/core/codeIntelligence/codeIntelligenceEntityAuthority";
import { isCodeIntelligenceWorkflowSealed } from "@/core/codeIntelligence/codeIntelligenceWorkflowAuthority";
import { isCodeIntelligenceEvidenceGateSealed } from "@/core/codeIntelligence/codeIntelligenceEvidenceEnforcement";
import { isCodeIntelligenceGovernanceGatesSealed } from "@/core/codeIntelligence/codeIntelligenceGovernanceGates";
import { isCodeIntelligenceAuditEmergencySealed } from "@/core/codeIntelligence/codeIntelligenceAuditEmergency";
import { isCodeIntelligenceDeliverySchemaSealed } from "@/core/codeIntelligence/codeIntelligenceDeliverySchema";
import { isCodeIntelligenceRollbackEngineSealed } from "@/core/codeIntelligence/codeIntelligenceRollbackEngine";
import { isCodeIntelligenceSealValidationSealed } from "@/core/codeIntelligence/codeIntelligenceSealValidation";
import { isCodeIntelligenceTrustEngineSealed } from "@/core/codeIntelligence/codeIntelligenceTrustEngine";
import { isCodeIntelligenceMemoryEngineSealed } from "@/core/codeIntelligence/codeIntelligenceMemoryEngine";
import { isCodeIntelligenceImpactAnalysisSealed } from "@/core/codeIntelligence/codeIntelligenceImpactAnalysis";
import { isCodeIntelligencePredictiveRiskSealed } from "@/core/codeIntelligence/codeIntelligencePredictiveRisk";
import { isCodeIntelligenceArchitectureIntelligenceSealed } from "@/core/codeIntelligence/codeIntelligenceArchitectureIntelligence";
import { isCodeIntelligenceGovernanceRepairGuardSealed } from "@/core/codeIntelligence/codeIntelligenceGovernanceRepairGuard";
import { isCodeIntelligenceOperationsCenterSealed } from "@/core/codeIntelligence/codeIntelligenceOperationsCenter";
import { evaluateCodeIntelligenceDeliverySpine } from "@/core/codeIntelligence/codeIntelligenceDeliverySpine";
import { isCodeIntelligenceConnectorFreezeLifted } from "@/core/codeIntelligence/codeIntelligenceConnectorLift";
import {
  isCodeIntelligenceConnectorsWired,
  isCodeIntelligenceLiveIndexSynced,
} from "@/core/codeIntelligence/codeIntelligenceConnectorStatus";
import { isCodeIntelligenceDeliveryEmitSealed } from "@/core/codeIntelligence/codeIntelligenceDeliveryEmit";
import { CINT_CONNECTOR_FREEZE_DIRECTIVE } from "@/core/codeIntelligence/codeIntelligenceAgentGovernment";
import type { HonestLabel } from "@/lib/generation/delivery/goldenPath.types";
import { htmlHasCodeIntelligenceSurface } from "@/lib/interaction/codeIntelligenceRuntime";

export const CINT_HONESTY_KEY = "cint.honesty.v1" as const;
export const CODE_INTELLIGENCE_HONESTY_VERSION = "CINT-HONEST-1.0" as const;

export type CodeIntelligenceHonestyBlocker = Readonly<{
  code: string;
  detail: string;
  blocksProductionCandidate: boolean;
}>;

export type CodeIntelligenceHonestyPath = Readonly<{
  version: "cint.honesty.v1";
  sealedAt: string;
  trustBand: typeof CODE_INTELLIGENCE_PRODUCT_MANIFEST.trust | "production_bound";
  neverClaims: readonly string[];
  /** Hint only — GPS honestLabel remains sole ship claim. */
  expectedGpsBand: Extract<HonestLabel, "interactive_prototype" | "not_ready" | "production_candidate">;
  foundationsSealed: {
    identity: boolean;
    registry: boolean;
    entity: boolean;
    workflow: boolean;
  };
  demoSurface: boolean;
  dataBindingReal: boolean;
  blockers: readonly CodeIntelligenceHonestyBlocker[];
  productionCandidateRequirements: readonly string[];
  constitution: readonly string[];
}>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function isCodeIntelligenceHonestyTarget(input: {
  html?: string | null;
  js?: string | null;
  fieldRegistryId?: string | null;
  metadata?: unknown;
}): boolean {
  if (input.fieldRegistryId === "field:code_intelligence") return true;
  if (input.html && htmlHasCodeIntelligenceSurface(input.html)) return true;
  const corpus = `${input.html ?? ""}\n${input.js ?? ""}`;
  if (/data-product-surface=["']code_intelligence["']/i.test(corpus)) return true;
  if (/\bcint\.v1\./i.test(corpus)) return true;
  const meta = asRecord(input.metadata);
  if (meta?.["cint.identity.v1"] || meta?.["cint.registry.v1"] || meta?.[CINT_HONESTY_KEY]) {
    return true;
  }
  return false;
}

function pushSealBlocker(
  blockers: CodeIntelligenceHonestyBlocker[],
  sealed: boolean,
  code: string,
  detail: string,
): void {
  if (!sealed) {
    blockers.push({ code, detail, blocksProductionCandidate: true });
  }
}

/** Pack 10 evaluation — demo-bound until Part II emit + connector wire. */
export function evaluateCodeIntelligenceHonestyPath(input: {
  html?: string | null;
  js?: string | null;
  metadata?: unknown;
  fieldRegistryId?: string | null;
}): CodeIntelligenceHonestyPath | null {
  if (!isCodeIntelligenceHonestyTarget(input)) return null;

  const foundationsSealed = {
    identity: isCodeIntelligenceIdentitySealed(input.metadata),
    registry: isCodeIntelligenceRegistrySealed(input.metadata),
    entity: isCodeIntelligenceEntitySealed(input.metadata),
    workflow: isCodeIntelligenceWorkflowSealed(input.metadata),
  };

  const spine = evaluateCodeIntelligenceDeliverySpine({
    metadata: input.metadata,
    html: input.html,
  });

  const partIIReady = spine.mayClaimPartIIReady || isCodeIntelligenceDeliveryEmitSealed(input.metadata);
  const connectorsWired = isCodeIntelligenceConnectorsWired(input.metadata);
  const hasPgbeMarker = /data-pgbe-sealed=["']1["']/i.test(input.html ?? "");
  const demoSoleStore =
    /\bcint\.v1\./i.test(`${input.html ?? ""}\n${input.js ?? ""}`) && !hasPgbeMarker && !partIIReady;

  const blockers: CodeIntelligenceHonestyBlocker[] = [];

  if (demoSoleStore || spine.gates.pgbe === "demo_only") {
    blockers.push({
      code: "CINT_DEMO_LOCALSTORAGE",
      detail: "Runtime binds cint.v1.* demo localStorage — not a sealed production backend.",
      blocksProductionCandidate: true,
    });
  }

  if (!connectorsWired) {
    blockers.push({
      code: "CINT_NO_CONNECTOR_WIRE",
      detail:
        "Connectors not wired — cint.connector.wire.v1 required after freeze lift (authorized_not_wired is not enough).",
      blocksProductionCandidate: true,
    });
  }

  // Wire seal ≠ live index (PDS-1.0): require successful github_read sync evidence.
  if (!isCodeIntelligenceLiveIndexSynced(input.metadata)) {
    blockers.push({
      code: "CINT_NO_LIVE_INDEX",
      detail:
        "No live repository sync evidence — cint.connector.liveIndex.v1 requires a successful GitHub sync (not wire metadata alone).",
      blocksProductionCandidate: true,
    });
  }

  if (spine.gates.pgbe !== "sealed") {
    blockers.push({
      code: "CINT_NO_PGBE_SPINE",
      detail: `PGBE gate=${spine.gates.pgbe} — need emitted non-stub handlers (demo localStorage is not sealed).`,
      blocksProductionCandidate: true,
    });
  }
  if (spine.gates.scw !== "sealed") {
    blockers.push({
      code: "CINT_NO_SCW_WIRING",
      detail: `SCW gate=${spine.gates.scw} — need real clientPathMap + data-scw-wired markers.`,
      blocksProductionCandidate: true,
    });
  }
  if (spine.gates.pls !== "sealed") {
    blockers.push({
      code: "CINT_NO_PLS_SMOKE",
      detail: `PLS gate=${spine.gates.pls} — liveSmoke ran+passed required on delivery evidence.`,
      blocksProductionCandidate: true,
    });
  }
  if (spine.gates.pgms !== "sealed") {
    blockers.push({
      code: "CINT_NO_PGMS_SEAL",
      detail: `PGMS gate=${spine.gates.pgms} — productGenerationModel.status must be sealed via Part II spine.`,
      blocksProductionCandidate: true,
    });
  }

  if (!foundationsSealed.identity || !foundationsSealed.registry) {
    blockers.push({
      code: "CINT_FOUNDATIONS_INCOMPLETE",
      detail: "Identity/registry authority not sealed — meaning path incomplete.",
      blocksProductionCandidate: true,
    });
  }

  pushSealBlocker(
    blockers,
    isCodeIntelligenceEvidenceGateSealed(input.metadata),
    "CINT_EVIDENCE_GATE_UNSEALED",
    "Phase 8 Evidence Enforcement not sealed — verified conclusions cannot be constitutionally claimed.",
  );
  pushSealBlocker(
    blockers,
    isCodeIntelligenceGovernanceGatesSealed(input.metadata),
    "CINT_GOVERNANCE_GATES_UNSEALED",
    "Phase 9 Governance Gates not sealed — L4/L5 execute cannot be constitutionally authorized.",
  );
  pushSealBlocker(
    blockers,
    isCodeIntelligenceAuditEmergencySealed(input.metadata),
    "CINT_AUDIT_EMERGENCY_UNSEALED",
    "Phase 10 Audit/Emergency not sealed — immutable ledger and emergency freeze are not operational.",
  );
  pushSealBlocker(
    blockers,
    isCodeIntelligenceDeliverySchemaSealed(input.metadata),
    "CINT_DELIVERY_SCHEMA_UNSEALED",
    "Phase 11 Delivery Schema not sealed — PGMS field contracts for core CI entities are not locked.",
  );
  pushSealBlocker(
    blockers,
    isCodeIntelligenceRollbackEngineSealed(input.metadata),
    "CINT_ROLLBACK_UNSEALED",
    "Phase 12 Recovery & Rollback not sealed — no AI mutate without recovery capability.",
  );
  pushSealBlocker(
    blockers,
    isCodeIntelligenceSealValidationSealed(input.metadata),
    "CINT_SEAL_VALIDATION_UNSEALED",
    "Phase 13 Seal Validation not sealed — seal integrity not proven.",
  );
  pushSealBlocker(
    blockers,
    isCodeIntelligenceTrustEngineSealed(input.metadata),
    "CINT_TRUST_ENGINE_UNSEALED",
    "Phase 14 Trust Engine not sealed — project trust dimensions unavailable.",
  );
  pushSealBlocker(
    blockers,
    isCodeIntelligenceMemoryEngineSealed(input.metadata),
    "CINT_MEMORY_ENGINE_UNSEALED",
    "Phase 15 Memory Engine not sealed — no durable audit/repair memory.",
  );
  pushSealBlocker(
    blockers,
    isCodeIntelligenceImpactAnalysisSealed(input.metadata),
    "CINT_IMPACT_ANALYSIS_UNSEALED",
    "Phase 16 Impact Analysis not sealed — blast radius unknown before mutate.",
  );
  pushSealBlocker(
    blockers,
    isCodeIntelligencePredictiveRiskSealed(input.metadata),
    "CINT_PREDICTIVE_RISK_UNSEALED",
    "Phase 17 Predictive Risk not sealed — advisory risk signals unavailable.",
  );
  pushSealBlocker(
    blockers,
    isCodeIntelligenceArchitectureIntelligenceSealed(input.metadata),
    "CINT_ARCHITECTURE_INTELLIGENCE_UNSEALED",
    "Phase 18 Architecture Intelligence not sealed — structure maps not authorized.",
  );
  pushSealBlocker(
    blockers,
    isCodeIntelligenceGovernanceRepairGuardSealed(input.metadata),
    "CINT_REPAIR_GUARD_UNSEALED",
    "Phase 19 Repair Guard not sealed — self-healing governance gate missing.",
  );
  pushSealBlocker(
    blockers,
    isCodeIntelligenceOperationsCenterSealed(input.metadata),
    "CINT_OPS_CENTER_UNSEALED",
    "Phase 20 Operations Centre not sealed — executive health rollup unavailable.",
  );

  if (!isCodeIntelligenceConnectorFreezeLifted(input.metadata)) {
    blockers.push({
      code: "CINT_CONNECTOR_FREEZE",
      detail: CINT_CONNECTOR_FREEZE_DIRECTIVE.join(" · "),
      blocksProductionCandidate: true,
    });
  }

  const productionBlockers = blockers.filter((b) => b.blocksProductionCandidate);
  const dataBindingReal =
    partIIReady &&
    spine.gates.pgms === "sealed" &&
    spine.gates.pgbe === "sealed" &&
    spine.gates.scw === "sealed" &&
    spine.gates.pls === "sealed" &&
    !demoSoleStore;

  const foundationsOk =
    foundationsSealed.identity &&
    foundationsSealed.registry &&
    foundationsSealed.entity &&
    foundationsSealed.workflow;

  const liveIndexSynced = isCodeIntelligenceLiveIndexSynced(input.metadata);
  const pathClear =
    productionBlockers.length === 0 && dataBindingReal && connectorsWired && liveIndexSynced;

  const productionCandidateRequirements = [
    "Phase 11 cint.delivery.schema.v1 sealed for Finding, Evidence, Investigation, RemediationPlan, Repository",
    "Phase 12 cint.rollback.engine.v1 sealed — snapshots · restore · safe delete · vault · disaster recovery",
    "Phase 13–20 hardening seals",
    "cint.delivery.emit.v1 — PGMS·PGBE·SCW·PLS (Part II spine)",
    "Phase 8–10 Evidence · Governance · Audit sealed",
    "Human authorize connector freeze lift then wire connectors (cint.connector.wire.v1)",
    "Live GitHub sync evidence (cint.connector.liveIndex.v1) — wire seal alone is not a live index",
    "Remediation Engineer writes only under L4/L5 + recovery after connectors wired (PR apply on connected repo)",
    "GoldenPathStatus.honestLabel computes production_candidate only via buildGoldenPathStatus",
  ];

  return {
    version: "cint.honesty.v1",
    sealedAt: new Date().toISOString(),
    trustBand: pathClear ? "production_bound" : CODE_INTELLIGENCE_PRODUCT_MANIFEST.trust,
    neverClaims: pathClear
      ? CODE_INTELLIGENCE_PRODUCT_MANIFEST.neverClaims.filter(
          (c) =>
            !/repository indexing|GitHub access|production systems/i.test(c),
        )
      : [...CODE_INTELLIGENCE_PRODUCT_MANIFEST.neverClaims],
    expectedGpsBand: pathClear
      ? "production_candidate"
      : foundationsOk
        ? "interactive_prototype"
        : "not_ready",
    foundationsSealed,
    demoSurface: !dataBindingReal,
    dataBindingReal,
    blockers,
    productionCandidateRequirements,
    constitution: [
      ...CODE_INTELLIGENCE_PRODUCT_MANIFEST.constitution,
      "Pack 10: demo trust cannot claim production_candidate until Part II + connector wire + live index sync.",
      "Wire seal alone does not clear CINT_NO_LIVE_INDEX (PDS-1.0).",
      "Ship label owner remains GoldenPathStatus.honestLabel only.",
    ],
  };
}

export function persistCodeIntelligenceHonestyPath(
  metadata: unknown,
  path: CodeIntelligenceHonestyPath,
): Record<string, unknown> {
  const base = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  base[CINT_HONESTY_KEY] = path;
  return base;
}

export function readCodeIntelligenceHonestyPath(
  metadata?: unknown,
): CodeIntelligenceHonestyPath | null {
  const block = asRecord(asRecord(metadata)?.[CINT_HONESTY_KEY]);
  if (!block || block.version !== "cint.honesty.v1") return null;
  return block as CodeIntelligenceHonestyPath;
}

export function formatCodeIntelligenceHonestySummaryLines(
  path: CodeIntelligenceHonestyPath,
): string[] {
  const prodBlockers = path.blockers.filter((b) => b.blocksProductionCandidate);
  return [
    `○ CI Honesty (Pack 10) — trust=${path.trustBand} · GPS band hint=${path.expectedGpsBand}`,
    path.dataBindingReal
      ? `✓ dataBindingReal=true — Part II binding eligible for production_candidate`
      : `✕ dataBindingReal=false — demo cint.v1 cannot become production_candidate`,
    `○ Blockers: ${path.blockers.map((b) => b.code).join(", ") || "none"}`,
    prodBlockers.length === 0
      ? `○ Production blockers cleared — GPS may compute production_candidate when other gates pass`
      : `○ Path to production_candidate: ${path.productionCandidateRequirements.length} requirements listed (PGMS·PGBE·SCW·PLS)`,
  ];
}

/**
 * Apply Pack 10 demotion to GPS interaction inputs for CI demo surfaces.
 * Does not set honestLabel — gatherAndBuildGoldenPathStatus → buildGoldenPathStatus does.
 * When Part II emit clears demo sole-store, preserves dataBindingReal.
 */
export function applyCodeIntelligenceHonestyToInteractionScore<T extends { dataBindingReal: boolean }>(
  score: T,
  input: {
    html?: string | null;
    js?: string | null;
    fieldRegistryId?: string | null;
    metadata?: unknown;
  },
): T {
  if (!isCodeIntelligenceHonestyTarget(input)) return score;
  const path = evaluateCodeIntelligenceHonestyPath(input);
  if (path?.dataBindingReal) {
    return { ...score, dataBindingReal: true };
  }
  return { ...score, dataBindingReal: false };
}
