/**
 * Phase C — Registry object governance (before KIL classify/relate).
 * Status · Provenance · Trust on durable intelligence objects.
 * Does not invent a second registry — stamps fields onto existing entities.
 * Never asserts GoldenPathStatus.honestLabel (PDS-1.0).
 */

export const CINT_OBJECT_GOVERNANCE_VERSION = "CINT-GOV-1.0" as const;

export const CINT_OBJECT_STATUSES = [
  "Active",
  "Archived",
  "Deprecated",
  "NeedsReview",
] as const;

export type CintObjectStatus = (typeof CINT_OBJECT_STATUSES)[number];

export const CINT_OBJECT_PROVENANCES = [
  "Engine",
  "Human",
  "Assistant-Proposed",
] as const;

export type CintObjectProvenance = (typeof CINT_OBJECT_PROVENANCES)[number];

export const CINT_OBJECT_TRUST_LEVELS = ["High", "Medium", "Low"] as const;

export type CintObjectTrust = (typeof CINT_OBJECT_TRUST_LEVELS)[number];

export type CintObjectGovernance = Readonly<{
  status: CintObjectStatus;
  provenance: CintObjectProvenance;
  trust: CintObjectTrust;
  governanceVersion: typeof CINT_OBJECT_GOVERNANCE_VERSION;
}>;

export function isCintObjectStatus(value: unknown): value is CintObjectStatus {
  return typeof value === "string" && (CINT_OBJECT_STATUSES as readonly string[]).includes(value);
}

export function isCintObjectProvenance(value: unknown): value is CintObjectProvenance {
  return typeof value === "string" && (CINT_OBJECT_PROVENANCES as readonly string[]).includes(value);
}

export function isCintObjectTrust(value: unknown): value is CintObjectTrust {
  return typeof value === "string" && (CINT_OBJECT_TRUST_LEVELS as readonly string[]).includes(value);
}

/** Map engine/confidence signals → governance trust (report field, not honestLabel). */
export function trustFromConfidence(confidence: unknown): CintObjectTrust {
  const c = String(confidence || "").toUpperCase();
  if (c === "CONFIRMED" || c === "HIGH_CONFIDENCE" || c === "HIGH") return "High";
  if (c === "LOW_CONFIDENCE" || c === "LOW" || c === "SUSPECTED") return "Low";
  return "Medium";
}

export function provenanceFromEngineSignal(signal: unknown): CintObjectProvenance {
  const s = String(signal || "").toLowerCase();
  if (s.includes("assistant") || s.includes("llm") || s.includes("proposed")) {
    return "Assistant-Proposed";
  }
  if (s.includes("human") || s.includes("manual") || s.includes("operator")) {
    return "Human";
  }
  return "Engine";
}

export function stampCintObjectGovernance(
  input: {
    status?: unknown;
    provenance?: unknown;
    trust?: unknown;
    confidence?: unknown;
    engineProvenance?: unknown;
  } = {},
): CintObjectGovernance {
  return {
    status: isCintObjectStatus(input.status) ? input.status : "Active",
    provenance: isCintObjectProvenance(input.provenance)
      ? input.provenance
      : provenanceFromEngineSignal(input.engineProvenance),
    trust: isCintObjectTrust(input.trust)
      ? input.trust
      : trustFromConfidence(input.confidence),
    governanceVersion: CINT_OBJECT_GOVERNANCE_VERSION,
  };
}
