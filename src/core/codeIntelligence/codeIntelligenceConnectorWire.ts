/**
 * cint.connector.wire.v1 — Live connector wire after human freeze lift.
 *
 * Advances connectorStatus from authorized_not_wired → wired.
 * Enables local snapshot + GitHub-read providers under L4/L5 + audit.
 * Does not invent pages. Does not write GoldenPathStatus.honestLabel.
 */

import {
  isCodeIntelligenceConnectorFreezeLifted,
  readCodeIntelligenceConnectorLift,
  CINT_CONNECTOR_LIFT_KEY,
} from "@/core/codeIntelligence/codeIntelligenceConnectorLift";
import { isCodeIntelligenceDeliveryEmitSealed } from "@/core/codeIntelligence/codeIntelligenceDeliveryEmit";
import { isCodeIntelligenceRollbackEngineSealed } from "@/core/codeIntelligence/codeIntelligenceRollbackEngine";
import { isCodeIntelligenceGovernanceGatesSealed } from "@/core/codeIntelligence/codeIntelligenceGovernanceGates";
import { isCodeIntelligenceAuditEmergencySealed } from "@/core/codeIntelligence/codeIntelligenceAuditEmergency";
import {
  CINT_CONNECTOR_WIRE_KEY,
  isCodeIntelligenceConnectorsWired as connectorsWiredFromMetadata,
} from "@/core/codeIntelligence/codeIntelligenceConnectorStatus";

export { CINT_CONNECTOR_WIRE_KEY } from "@/core/codeIntelligence/codeIntelligenceConnectorStatus";
export const CINT_CONNECTOR_WIRE_VERSION = "CINT-CW-1.0" as const;

export type CodeIntelligenceConnectorProvider = "local_snapshot" | "github_read";

export type CodeIntelligenceConnectorWireAuthority = Readonly<{
  version: "cint.connector.wire.v1";
  sealed: boolean;
  sealedAt: string | null;
  wireVersion: typeof CINT_CONNECTOR_WIRE_VERSION;
  connectorStatus: "wired";
  providers: readonly CodeIntelligenceConnectorProvider[];
  inventPages: false;
  authorization: Readonly<{
    approved: true;
    approvedBy: string;
    approvedAt: string;
    phrase: string;
    scope: "live_connector_wire";
  }> | null;
  constitution: readonly string[];
}>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function detectCodeIntelligenceConnectorWireIntent(text: string): boolean {
  const t = text.toLowerCase();
  return (
    /\bwire connectors?\b/.test(t) ||
    /\blive connectors?\b/.test(t) ||
    /\bcint\.connector\.wire\.v1\b/.test(t) ||
    /\benable\b.{0,20}\b(github|gitlab|connector)\b/.test(t) ||
    /\bconnect\b.{0,20}\b(github|real repo|live repo)\b/.test(t) ||
    /\bseal\b.{0,20}\bconnector wire\b/.test(t)
  );
}

export function buildCodeIntelligenceConnectorWireAuthority(options?: {
  sealed?: boolean;
  approvedBy?: string;
}): CodeIntelligenceConnectorWireAuthority {
  const sealed = options?.sealed === true;
  const approvedBy = (options?.approvedBy ?? "").trim() || "human_operator";
  return {
    version: "cint.connector.wire.v1",
    sealed,
    sealedAt: sealed ? new Date().toISOString() : null,
    wireVersion: CINT_CONNECTOR_WIRE_VERSION,
    connectorStatus: "wired",
    providers: ["local_snapshot", "github_read"],
    inventPages: false,
    authorization: sealed
      ? {
          approved: true,
          approvedBy,
          approvedAt: new Date().toISOString(),
          phrase: "wire connectors",
          scope: "live_connector_wire",
        }
      : null,
    constitution: [
      "Requires connector freeze lift (cint.connector.lift.v1) + Part II delivery emit",
      "Requires governance gates + audit/emergency + rollback",
      "Providers: local_snapshot (live) · github_read (token-gated at runtime)",
      "Remediation Engineer source writes unlock only after this wire + L4/L5 human approval",
      "inventPages=false",
    ],
  };
}

export function sealCodeIntelligenceConnectorWire(
  metadata: unknown,
  options?: { approvedBy?: string },
): {
  metadata: Record<string, unknown>;
  wire: CodeIntelligenceConnectorWireAuthority;
  blockedReason?: string;
} {
  const base = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  if (!isCodeIntelligenceConnectorFreezeLifted(base)) {
    return {
      metadata: base,
      wire: buildCodeIntelligenceConnectorWireAuthority({ sealed: false }),
      blockedReason: "Connector freeze lift must be sealed before live wire.",
    };
  }
  if (!isCodeIntelligenceDeliveryEmitSealed(base)) {
    return {
      metadata: base,
      wire: buildCodeIntelligenceConnectorWireAuthority({ sealed: false }),
      blockedReason: "Part II delivery emit (PGMS·PGBE·SCW·PLS) must be sealed before live wire.",
    };
  }
  if (!isCodeIntelligenceGovernanceGatesSealed(base)) {
    return {
      metadata: base,
      wire: buildCodeIntelligenceConnectorWireAuthority({ sealed: false }),
      blockedReason: "Governance gates must be sealed before live connector wire.",
    };
  }
  if (!isCodeIntelligenceAuditEmergencySealed(base)) {
    return {
      metadata: base,
      wire: buildCodeIntelligenceConnectorWireAuthority({ sealed: false }),
      blockedReason: "Audit/Emergency must be sealed before live connector wire.",
    };
  }
  if (!isCodeIntelligenceRollbackEngineSealed(base)) {
    return {
      metadata: base,
      wire: buildCodeIntelligenceConnectorWireAuthority({ sealed: false }),
      blockedReason: "Rollback engine must be sealed before live connector wire.",
    };
  }

  const wire = buildCodeIntelligenceConnectorWireAuthority({
    sealed: true,
    approvedBy: options?.approvedBy,
  });
  base[CINT_CONNECTOR_WIRE_KEY] = wire;

  // Advance lift status for honesty / spine readers.
  const lift = readCodeIntelligenceConnectorLift(base);
  if (lift) {
    base[CINT_CONNECTOR_LIFT_KEY] = {
      ...lift,
      connectorStatus: "wired",
      constitution: [
        ...lift.constitution.filter((c) => !/authorized_not_wired|still deferred/i.test(c)),
        "Connector status advanced to wired via cint.connector.wire.v1",
      ],
    };
  }

  return { metadata: base, wire };
}

export function readCodeIntelligenceConnectorWire(
  metadata?: unknown,
): CodeIntelligenceConnectorWireAuthority | null {
  const block = asRecord(asRecord(metadata)?.[CINT_CONNECTOR_WIRE_KEY]);
  if (!block || block.version !== "cint.connector.wire.v1") return null;
  return block as CodeIntelligenceConnectorWireAuthority;
}

export function isCodeIntelligenceConnectorsWired(metadata?: unknown): boolean {
  return connectorsWiredFromMetadata(metadata);
}

export function formatCodeIntelligenceConnectorWireSummaryLines(
  wire: CodeIntelligenceConnectorWireAuthority,
): string[] {
  return [
    `${wire.sealed ? "✓" : "○"} Connector Wire ${wire.wireVersion} (${CINT_CONNECTOR_WIRE_KEY})`,
    `○ Status: ${wire.connectorStatus} · providers: ${wire.providers.join(" · ")}`,
    wire.authorization
      ? `○ Authorized by ${wire.authorization.approvedBy} (${wire.authorization.scope})`
      : "○ No human authorization recorded",
  ];
}
