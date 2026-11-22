/**
 * cint.connector.lift.v1 — Human-authorized connector freeze lift.
 *
 * After Phases 8–11 (evidence · governance · audit · delivery schema), a human
 * may authorize lifting CINT_CONNECTOR_FREEZE. This does NOT wire live OAuth —
 * status stays authorized_not_wired until explicit connector implementation.
 */

import { areCodeIntelligencePhases810Sealed } from "@/core/codeIntelligence/codeIntelligencePhases810Seal";
import { isCodeIntelligenceDeliverySchemaSealed } from "@/core/codeIntelligence/codeIntelligenceDeliverySchema";
import { isCodeIntelligenceRollbackEngineSealed } from "@/core/codeIntelligence/codeIntelligenceRollbackEngine";
import { isCodeIntelligenceAgentRuntimeSealed } from "@/core/codeIntelligence/codeIntelligenceAgentRuntime";
import { isCodeIntelligenceAgentInteractionSealed } from "@/core/codeIntelligence/codeIntelligenceAgentInteraction";
import {
  evaluateCodeIntelligenceAgentArchitectureAudit,
  isCodeIntelligenceAgentArchitectureAuditSealed,
} from "@/core/codeIntelligence/codeIntelligenceAgentArchitectureAudit";

export const CINT_CONNECTOR_LIFT_KEY = "cint.connector.lift.v1" as const;
export const CINT_CONNECTOR_LIFT_VERSION = "CINT-CL-1.0" as const;

export type ConnectorLiftAuthorization = Readonly<{
  approved: true;
  approvedBy: string;
  approvedAt: string;
  phrase: string;
  scope: "freeze_lift_only";
}>;

export type CodeIntelligenceConnectorLiftAuthority = Readonly<{
  version: "cint.connector.lift.v1";
  sealed: boolean;
  sealedAt: string | null;
  liftVersion: typeof CINT_CONNECTOR_LIFT_VERSION;
  /** Freeze honesty blocker may clear when sealed. */
  freezeLifted: boolean;
  /** Live GitHub/OAuth deferred until cint.connector.wire.v1; then wired. */
  connectorStatus: "authorized_not_wired" | "frozen" | "wired";
  authorization: ConnectorLiftAuthorization | null;
  inventPages: false;
  constitution: readonly string[];
}>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function detectCodeIntelligenceConnectorLiftIntent(text: string): boolean {
  const t = text.toLowerCase();
  return (
    /\bauthorize connector freeze lift\b/.test(t) ||
    /\blift connector freeze\b/.test(t) ||
    /\bcint\.connector\.lift\.v1\b/.test(t) ||
    /\bhuman\b.{0,20}\blift\b.{0,20}\bconnector\b/.test(t) ||
    /\bseal\b.{0,20}\bconnector lift\b/.test(t)
  );
}

export function buildCodeIntelligenceConnectorLiftAuthority(options?: {
  sealed?: boolean;
  approvedBy?: string;
}): CodeIntelligenceConnectorLiftAuthority {
  const sealed = options?.sealed === true;
  const approvedBy = (options?.approvedBy ?? "").trim() || "human_operator";
  return {
    version: "cint.connector.lift.v1",
    sealed,
    sealedAt: sealed ? new Date().toISOString() : null,
    liftVersion: CINT_CONNECTOR_LIFT_VERSION,
    freezeLifted: sealed,
    connectorStatus: sealed ? "authorized_not_wired" : "frozen",
    authorization: sealed
      ? {
          approved: true,
          approvedBy,
          approvedAt: new Date().toISOString(),
          phrase: "authorize connector freeze lift",
          scope: "freeze_lift_only",
        }
      : null,
    inventPages: false,
    constitution: [
      "Requires Phases 8–12 + agent runtime + interaction + healthy architecture audit",
      "Human authorization required — notifications ≠ approval",
      "Lift clears honesty freeze only — does not enable live OAuth/connectors",
      "L4/L5 + audit still gate any future execute/source sync",
      "Remediation Engineer source writes remain deferred even after lift until explicit wire",
    ],
  };
}

export function sealCodeIntelligenceConnectorLift(
  metadata: unknown,
  options?: { approvedBy?: string },
): {
  metadata: Record<string, unknown>;
  lift: CodeIntelligenceConnectorLiftAuthority;
  blockedReason?: string;
} {
  const base = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  if (!areCodeIntelligencePhases810Sealed(base)) {
    return {
      metadata: base,
      lift: buildCodeIntelligenceConnectorLiftAuthority({ sealed: false }),
      blockedReason: "Phases 8–10 must be sealed before connector freeze lift.",
    };
  }
  if (!isCodeIntelligenceDeliverySchemaSealed(base)) {
    return {
      metadata: base,
      lift: buildCodeIntelligenceConnectorLiftAuthority({ sealed: false }),
      blockedReason: "Phase 11 Delivery Schema must be sealed before connector freeze lift.",
    };
  }
  if (!isCodeIntelligenceRollbackEngineSealed(base)) {
    return {
      metadata: base,
      lift: buildCodeIntelligenceConnectorLiftAuthority({ sealed: false }),
      blockedReason:
        "Phase 12 Recovery & Rollback must be sealed before connector freeze lift (no AI action without recovery).",
    };
  }
  if (!isCodeIntelligenceAgentRuntimeSealed(base)) {
    return {
      metadata: base,
      lift: buildCodeIntelligenceConnectorLiftAuthority({ sealed: false }),
      blockedReason: "Phase 21 Agent Runtime must be sealed before connector freeze lift.",
    };
  }
  if (!isCodeIntelligenceAgentInteractionSealed(base)) {
    return {
      metadata: base,
      lift: buildCodeIntelligenceConnectorLiftAuthority({ sealed: false }),
      blockedReason: "Phase 22 Agent Interaction must be sealed before connector freeze lift.",
    };
  }
  if (!isCodeIntelligenceAgentArchitectureAuditSealed(base)) {
    return {
      metadata: base,
      lift: buildCodeIntelligenceConnectorLiftAuthority({ sealed: false }),
      blockedReason:
        "Agent architecture audit must be sealed (healthy) before connector freeze lift.",
    };
  }
  const audit = evaluateCodeIntelligenceAgentArchitectureAudit(base);
  if (!audit.healthy || !audit.connectorEnablementAllowed) {
    return {
      metadata: base,
      lift: buildCodeIntelligenceConnectorLiftAuthority({ sealed: false }),
      blockedReason:
        "Architecture audit unhealthy or connector enablement not allowed — fix overlaps before lift.",
    };
  }
  const lift = buildCodeIntelligenceConnectorLiftAuthority({
    sealed: true,
    approvedBy: options?.approvedBy,
  });
  base[CINT_CONNECTOR_LIFT_KEY] = lift;
  return { metadata: base, lift };
}

export function readCodeIntelligenceConnectorLift(
  metadata?: unknown,
): CodeIntelligenceConnectorLiftAuthority | null {
  const block = asRecord(asRecord(metadata)?.[CINT_CONNECTOR_LIFT_KEY]);
  if (!block || block.version !== "cint.connector.lift.v1") return null;
  return block as CodeIntelligenceConnectorLiftAuthority;
}

export function isCodeIntelligenceConnectorFreezeLifted(metadata?: unknown): boolean {
  const lift = readCodeIntelligenceConnectorLift(metadata);
  return Boolean(lift?.sealed && lift.freezeLifted && lift.sealedAt);
}

export function formatCodeIntelligenceConnectorLiftSummaryLines(
  lift: CodeIntelligenceConnectorLiftAuthority,
): string[] {
  return [
    `${lift.sealed ? "✓" : "○"} Connector Lift ${lift.liftVersion} (${CINT_CONNECTOR_LIFT_KEY})`,
    `○ Freeze lifted: ${lift.freezeLifted ? "yes" : "no"} · connectors: ${lift.connectorStatus}`,
    lift.authorization
      ? `○ Authorized by ${lift.authorization.approvedBy} (${lift.authorization.scope})`
      : "○ No human authorization recorded",
  ];
}
