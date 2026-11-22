/**
 * cint.memory.engine.v1 — Phase 15 Repository Memory Engine.
 *
 * Durable project memory: audits, repairs, known issues, failures, ADRs, governance exceptions.
 * Learn → Remember → Compare → Improve (vs Scan/Forget). Requires Phase 14 Trust sealed.
 */

import { isCodeIntelligenceTrustEngineSealed } from "@/core/codeIntelligence/codeIntelligenceTrustEngine";

export const CINT_MEMORY_ENGINE_KEY = "cint.memory.engine.v1" as const;
export const CINT_MEMORY_ENGINE_VERSION = "CINT-MEM-1.0" as const;

export type MemoryEntryKind =
  | "past_audit"
  | "past_repair"
  | "known_issue"
  | "previous_failure"
  | "architectural_decision"
  | "governance_exception";

export type MemoryEntry = Readonly<{
  id: string;
  kind: MemoryEntryKind;
  title: string;
  detail: string;
  recordedAt: string;
  relatedPaths?: readonly string[];
}>;

export type CodeIntelligenceMemoryEngineAuthority = Readonly<{
  version: "cint.memory.engine.v1";
  sealed: boolean;
  sealedAt: string | null;
  memoryVersion: typeof CINT_MEMORY_ENGINE_VERSION;
  inventPages: false;
  entries: readonly MemoryEntry[];
  rule: "Memory records facts — does not invent product meaning or pages";
  constitution: readonly string[];
}>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function buildCodeIntelligenceMemoryEngineAuthority(options?: {
  sealed?: boolean;
  entries?: readonly MemoryEntry[];
}): CodeIntelligenceMemoryEngineAuthority {
  const sealed = options?.sealed === true;
  return {
    version: "cint.memory.engine.v1",
    sealed,
    sealedAt: sealed ? new Date().toISOString() : null,
    memoryVersion: CINT_MEMORY_ENGINE_VERSION,
    inventPages: false,
    entries: options?.entries ? [...options.entries] : [],
    rule: "Memory records facts — does not invent product meaning or pages",
    constitution: [
      "Phase 15 — Repository Memory after Trust (Phase 14)",
      "Compare against prior repairs/audits before re-scanning blindly",
      "Connector freeze remains ON",
      "inventPages=false",
    ],
  };
}

export function sealCodeIntelligenceMemoryEngine(metadata: unknown): {
  metadata: Record<string, unknown>;
  memory: CodeIntelligenceMemoryEngineAuthority;
  blockedReason?: string;
} {
  const base = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  if (!isCodeIntelligenceTrustEngineSealed(base)) {
    return {
      metadata: base,
      memory: buildCodeIntelligenceMemoryEngineAuthority({ sealed: false }),
      blockedReason: "Phase 14 Trust Engine must be sealed before Phase 15 Memory Engine.",
    };
  }
  const existing = readCodeIntelligenceMemoryEngine(base);
  const memory = buildCodeIntelligenceMemoryEngineAuthority({
    sealed: true,
    entries: existing?.entries,
  });
  base[CINT_MEMORY_ENGINE_KEY] = memory;
  return { metadata: base, memory };
}

export function readCodeIntelligenceMemoryEngine(
  metadata?: unknown,
): CodeIntelligenceMemoryEngineAuthority | null {
  const block = asRecord(asRecord(metadata)?.[CINT_MEMORY_ENGINE_KEY]);
  if (!block || block.version !== "cint.memory.engine.v1") return null;
  return block as CodeIntelligenceMemoryEngineAuthority;
}

export function isCodeIntelligenceMemoryEngineSealed(metadata?: unknown): boolean {
  const m = readCodeIntelligenceMemoryEngine(metadata);
  return Boolean(m?.sealed && m.sealedAt);
}

export function rememberCodeIntelligenceEvent(
  metadata: unknown,
  entry: Omit<MemoryEntry, "id" | "recordedAt"> & { id?: string; recordedAt?: string },
): {
  metadata: Record<string, unknown>;
  memory: CodeIntelligenceMemoryEngineAuthority | null;
  blockedReason?: string;
} {
  const engine = readCodeIntelligenceMemoryEngine(metadata);
  if (!engine?.sealed) {
    return {
      metadata: asRecord(metadata) ? { ...asRecord(metadata)! } : {},
      memory: null,
      blockedReason: "Memory Engine not sealed",
    };
  }
  const nextEntry: MemoryEntry = {
    id: entry.id ?? `MEM-${engine.entries.length + 1}-${Date.now().toString(36)}`,
    kind: entry.kind,
    title: entry.title,
    detail: entry.detail,
    recordedAt: entry.recordedAt ?? new Date().toISOString(),
    relatedPaths: entry.relatedPaths,
  };
  const memory: CodeIntelligenceMemoryEngineAuthority = {
    ...engine,
    entries: [...engine.entries, nextEntry],
  };
  const base = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  base[CINT_MEMORY_ENGINE_KEY] = memory;
  return { metadata: base, memory };
}

export function detectCodeIntelligenceMemoryEngineSealIntent(text: string): boolean {
  const t = text.toLowerCase();
  return (
    /\bphase\s*15\b/.test(t) ||
    /\bmemory engine\b/.test(t) ||
    /\brepository memory\b/.test(t) ||
    /\bcint\.memory\.engine\.v1\b/.test(t) ||
    /\bseal\b.{0,20}\bmemory\b/.test(t)
  );
}

export function formatCodeIntelligenceMemoryEngineSummaryLines(
  memory: CodeIntelligenceMemoryEngineAuthority,
): string[] {
  return [
    `${memory.sealed ? "✓" : "○"} Memory Engine ${memory.memoryVersion} (${CINT_MEMORY_ENGINE_KEY})`,
    `○ Entries: ${memory.entries.length} (audits · repairs · issues · failures · ADRs · exceptions)`,
    `○ Rule: ${memory.rule}`,
  ];
}
