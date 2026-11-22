/**
 * Phase E / K1 — Object identity (prefixes + stable builders).
 * Single owner for CINT intelligence object IDs. Does not invent a registry
 * (that is K2) or classify/relate (K3/K4). Engines keep producing objects;
 * this module owns how IDs are shaped and validated.
 *
 * Taxonomy authority: docs/governance/CINT_KIL_DESIGN_ONLY.md
 */

export const CINT_OBJECT_IDENTITY_VERSION = "CINT-OID-1.0" as const;

export const CINT_OBJECT_KINDS = [
  "finding",
  "evidence",
  "remediation",
  "analysis_run",
  "dependency",
  "artifact",
  "knowledge_note",
] as const;

export type CintObjectKind = (typeof CINT_OBJECT_KINDS)[number];

/** Canonical short prefixes used in live engines today (F- / E- / R- / A-). */
export const CINT_OBJECT_PREFIX: Readonly<Record<CintObjectKind, string>> = {
  finding: "F",
  evidence: "E",
  remediation: "R",
  analysis_run: "A",
  dependency: "DEP",
  artifact: "ART",
  knowledge_note: "KNW",
};

const PREFIX_TO_KIND: Readonly<Record<string, CintObjectKind>> = {
  F: "finding",
  FND: "finding",
  E: "evidence",
  EVD: "evidence",
  R: "remediation",
  REM: "remediation",
  A: "analysis_run",
  RUN: "analysis_run",
  DEP: "dependency",
  ART: "artifact",
  KNW: "knowledge_note",
};

/** Path / label → stable uppercase slug for ID bodies. */
export function normalizeCintObjectToken(raw: string, max = 64): string {
  const slug = String(raw || "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase();
  if (!slug) return "UNKNOWN";
  return slug.length > max ? slug.slice(0, max) : slug;
}

export function parseCintObjectId(
  id: string,
): { kind: CintObjectKind; prefix: string; body: string } | null {
  const raw = String(id || "").trim();
  if (!raw) return null;
  const m = raw.match(/^([A-Za-z]+)-(.+)$/);
  if (!m) return null;
  const prefix = m[1]!.toUpperCase();
  const kind = PREFIX_TO_KIND[prefix];
  if (!kind) return null;
  return { kind, prefix, body: m[2]! };
}

export function isCintObjectId(id: string, kind?: CintObjectKind): boolean {
  const parsed = parseCintObjectId(id);
  if (!parsed) return false;
  return kind ? parsed.kind === kind : true;
}

export function buildFindingId(family: string, token: string): string {
  const fam = normalizeCintObjectToken(family, 24);
  const body = normalizeCintObjectToken(token, 64);
  return `${CINT_OBJECT_PREFIX.finding}-${fam}-${body}`;
}

export function buildEvidenceId(findingId: string, index: number): string {
  const n = Number.isFinite(index) && index >= 0 ? Math.floor(index) + 1 : 1;
  return `${CINT_OBJECT_PREFIX.evidence}-${findingId}-${n}`;
}

export function buildRemediationId(findingId: string): string {
  return `${CINT_OBJECT_PREFIX.remediation}-${findingId}`;
}

export function buildAnalysisRunId(seed?: string | number | null): string {
  const body =
    seed != null && String(seed).trim()
      ? normalizeCintObjectToken(String(seed), 48).toLowerCase().replace(/^-|-$/g, "")
      : Date.now().toString(36);
  return `${CINT_OBJECT_PREFIX.analysis_run}-${body || Date.now().toString(36)}`;
}

export function buildDependencyId(name: string): string {
  return `${CINT_OBJECT_PREFIX.dependency}-${normalizeCintObjectToken(name, 64)}`;
}

export function buildArtifactId(token: string): string {
  return `${CINT_OBJECT_PREFIX.artifact}-${normalizeCintObjectToken(token, 64)}`;
}

export function buildKnowledgeNoteId(token: string): string {
  return `${CINT_OBJECT_PREFIX.knowledge_note}-${normalizeCintObjectToken(token, 64)}`;
}
