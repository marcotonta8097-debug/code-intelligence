/**
 * Leaf connector status readers — no imports from agent runtime / audit
 * (breaks ESM cycles: runtime → wire → lift → runtime).
 */

export const CINT_CONNECTOR_WIRE_KEY = "cint.connector.wire.v1" as const;
export const CINT_CONNECTOR_LIFT_KEY = "cint.connector.lift.v1" as const;
export const CINT_LIVE_INDEX_KEY = "cint.connector.liveIndex.v1" as const;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** True when cint.connector.wire.v1 sealed or lift status advanced to wired. */
export function isCodeIntelligenceConnectorsWired(metadata?: unknown): boolean {
  const wire = asRecord(asRecord(metadata)?.[CINT_CONNECTOR_WIRE_KEY]);
  if (wire?.sealed === true && wire.connectorStatus === "wired" && wire.sealedAt) {
    return true;
  }
  const lift = asRecord(asRecord(metadata)?.[CINT_CONNECTOR_LIFT_KEY]);
  return lift?.connectorStatus === "wired";
}

/**
 * PDS honesty: wire seal alone is not a live index.
 * Requires cint.connector.liveIndex.v1 with synced=true after real GitHub sync
 * (or explicit seal helper in tests).
 */
export function isCodeIntelligenceLiveIndexSynced(metadata?: unknown): boolean {
  const block = asRecord(asRecord(metadata)?.[CINT_LIVE_INDEX_KEY]);
  if (!block || block.version !== "cint.connector.liveIndex.v1") return false;
  return Boolean(block.synced === true && block.syncedAt && block.repository);
}
