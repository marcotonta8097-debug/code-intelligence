/**
 * cint.delivery.schema.v1 — Phase 11 Delivery Schema Contract (PGMS foothold).
 *
 * Seals field contracts for Finding · Evidence · Investigation · RemediationPlan · Repository
 * before real PGMS/PGBE emit. Does not invent a parallel PGMS spine — subordinate to Part II
 * productGenerationModel when BUILD runs. Does not lift connector freeze.
 */

import { areCodeIntelligencePhases810Sealed } from "@/core/codeIntelligence/codeIntelligencePhases810Seal";

export const CINT_DELIVERY_SCHEMA_KEY = "cint.delivery.schema.v1" as const;
export const CINT_DELIVERY_SCHEMA_VERSION = "CINT-DS-1.0" as const;

export type CodeIntelligenceDeliveryEntityId =
  | "Repository"
  | "Finding"
  | "Evidence"
  | "Investigation"
  | "RemediationPlan";

export type CodeIntelligenceSchemaField = Readonly<{
  name: string;
  type: string;
  required: boolean;
  notes?: string;
}>;

export type CodeIntelligenceEntitySchemaContract = Readonly<{
  entity: CodeIntelligenceDeliveryEntityId;
  persistenceKey: string;
  fields: readonly CodeIntelligenceSchemaField[];
  pgmsRequired: true;
}>;

export type CodeIntelligenceDeliverySchemaAuthority = Readonly<{
  version: "cint.delivery.schema.v1";
  sealed: boolean;
  sealedAt: string | null;
  schemaVersion: typeof CINT_DELIVERY_SCHEMA_VERSION;
  inventPages: false;
  requiresPhases810Sealed: true;
  entities: readonly CodeIntelligenceEntitySchemaContract[];
  rule: "No sealed schema — no PGMS claim for CI production_candidate";
  constitution: readonly string[];
}>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** Core entities honesty path names for PGMS-1.0. */
export const CINT_PGMS_REQUIRED_ENTITIES: readonly CodeIntelligenceDeliveryEntityId[] = [
  "Repository",
  "Finding",
  "Evidence",
  "Investigation",
  "RemediationPlan",
] as const;

export const CODE_INTELLIGENCE_DELIVERY_SCHEMAS: readonly CodeIntelligenceEntitySchemaContract[] =
  [
    {
      entity: "Repository",
      persistenceKey: "repositories",
      pgmsRequired: true,
      fields: [
        { name: "id", type: "string", required: true },
        { name: "name", type: "string", required: true },
        { name: "url", type: "string", required: false, notes: "Connector deferred" },
        { name: "provider", type: "enum", required: true, notes: "demo|github|gitlab|azure|bitbucket" },
        { name: "lastSyncedAt", type: "timestamp", required: false },
      ],
    },
    {
      entity: "Finding",
      persistenceKey: "findings",
      pgmsRequired: true,
      fields: [
        { name: "id", type: "string", required: true },
        { name: "title", type: "string", required: true },
        { name: "severity", type: "enum", required: true },
        { name: "status", type: "enum", required: true },
        { name: "confidence", type: "enum", required: true },
        { name: "repositoryId", type: "string", required: true },
        { name: "location", type: "string", required: false },
        { name: "criteria", type: "string", required: false },
        { name: "specialist", type: "string", required: false },
        { name: "evidenceIds", type: "string[]", required: false },
        { name: "verificationStatus", type: "enum", required: true, notes: "Evidence Gate" },
      ],
    },
    {
      entity: "Evidence",
      persistenceKey: "evidence",
      pgmsRequired: true,
      fields: [
        { name: "id", type: "string", required: true },
        { name: "findingId", type: "string", required: true },
        { name: "summary", type: "string", required: true },
        { name: "location", type: "string", required: false },
        { name: "capturedAt", type: "timestamp", required: true },
        { name: "source", type: "string", required: false },
        { name: "traceRef", type: "string", required: false },
      ],
    },
    {
      entity: "Investigation",
      persistenceKey: "investigations",
      pgmsRequired: true,
      fields: [
        { name: "id", type: "string", required: true },
        { name: "findingId", type: "string", required: true },
        { name: "status", type: "enum", required: true },
        { name: "hypothesis", type: "string", required: false },
        { name: "evidenceIds", type: "string[]", required: false },
        { name: "updatedAt", type: "timestamp", required: true },
      ],
    },
    {
      entity: "RemediationPlan",
      persistenceKey: "remediation",
      pgmsRequired: true,
      fields: [
        { name: "id", type: "string", required: true },
        { name: "findingId", type: "string", required: true },
        { name: "proposal", type: "string", required: true },
        { name: "risk", type: "enum", required: true },
        { name: "approvalLevel", type: "enum", required: true, notes: "L3 prepare · L4/L5 gated" },
        { name: "humanApprovalId", type: "string", required: false },
        { name: "executionStatus", type: "enum", required: true },
        { name: "writesSource", type: "boolean", required: true, notes: "Must stay false until L4+approval" },
      ],
    },
  ] as const;

export function buildCodeIntelligenceDeliverySchemaAuthority(options?: {
  sealed?: boolean;
}): CodeIntelligenceDeliverySchemaAuthority {
  const sealed = options?.sealed === true;
  return {
    version: "cint.delivery.schema.v1",
    sealed,
    sealedAt: sealed ? new Date().toISOString() : null,
    schemaVersion: CINT_DELIVERY_SCHEMA_VERSION,
    inventPages: false,
    requiresPhases810Sealed: true,
    entities: CODE_INTELLIGENCE_DELIVERY_SCHEMAS,
    rule: "No sealed schema — no PGMS claim for CI production_candidate",
    constitution: [
      "Part II PGMS-1.0 — schema before UI for APP/secured",
      "Honesty path requires Finding/Evidence/Investigation/RemediationPlan/Repository",
      "Does not assert productGenerationModel.status=sealed — that remains PGMS spine",
      "Connector freeze remains ON",
      "inventPages=false",
    ],
  };
}

export function sealCodeIntelligenceDeliverySchema(metadata: unknown): {
  metadata: Record<string, unknown>;
  schema: CodeIntelligenceDeliverySchemaAuthority;
  blockedReason?: string;
} {
  const base = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  if (!areCodeIntelligencePhases810Sealed(base)) {
    return {
      metadata: base,
      schema: buildCodeIntelligenceDeliverySchemaAuthority({ sealed: false }),
      blockedReason:
        "Phases 8–10 must be sealed before Phase 11 Delivery Schema (Evidence → Governance → Audit).",
    };
  }
  const schema = buildCodeIntelligenceDeliverySchemaAuthority({ sealed: true });
  base[CINT_DELIVERY_SCHEMA_KEY] = schema;
  return { metadata: base, schema };
}

export function readCodeIntelligenceDeliverySchema(
  metadata?: unknown,
): CodeIntelligenceDeliverySchemaAuthority | null {
  const block = asRecord(asRecord(metadata)?.[CINT_DELIVERY_SCHEMA_KEY]);
  if (!block || block.version !== "cint.delivery.schema.v1") return null;
  return block as CodeIntelligenceDeliverySchemaAuthority;
}

export function isCodeIntelligenceDeliverySchemaSealed(metadata?: unknown): boolean {
  const s = readCodeIntelligenceDeliverySchema(metadata);
  return Boolean(s?.sealed && s.sealedAt);
}

export function detectCodeIntelligenceDeliverySchemaSealIntent(text: string): boolean {
  const t = text.toLowerCase();
  return (
    /\bphase\s*11\b/.test(t) ||
    /\bphases?\s*8\s*(to|through|-|–|—|and|&|\/)\s*11\b/.test(t) ||
    /\bdelivery schema\b/.test(t) ||
    /\bcint\.delivery\.schema\.v1\b/.test(t) ||
    /\bpgms\b.{0,20}\bschema\b/.test(t) ||
    /\bschema contract\b/.test(t) ||
    /\bseal\b.{0,30}\b(pgms|delivery schema)\b/.test(t)
  );
}

export function formatCodeIntelligenceDeliverySchemaSummaryLines(
  schema: CodeIntelligenceDeliverySchemaAuthority,
): string[] {
  return [
    `${schema.sealed ? "✓" : "○"} Delivery Schema ${schema.schemaVersion} (${CINT_DELIVERY_SCHEMA_KEY})`,
    `○ Entities: ${schema.entities.map((e) => e.entity).join(" · ")}`,
    `○ Rule: ${schema.rule}`,
  ];
}
