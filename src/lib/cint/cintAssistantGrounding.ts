/**
 * CI Assistant grounding — format live analyze artifacts into prompt context.
 * Keeps the LLM from answering with only "Active CI workspace" boilerplate.
 */

export type CintAssistantGroundingFinding = {
  id?: string;
  title?: string;
  severity?: string;
  category?: string;
  location?: string;
  file?: string;
};

export type CintAssistantGroundingEvidence = {
  id?: string;
  findingId?: string;
  summary?: string;
  location?: string;
};

export type CintAssistantGroundingDep = {
  name?: string;
  version?: string;
  kind?: string;
};

export type CintAssistantGroundingInput = {
  repository?: string | null;
  commitSha?: string | null;
  contextNotes?: string | null;
  findings?: CintAssistantGroundingFinding[] | null;
  evidence?: CintAssistantGroundingEvidence[] | null;
  dependencies?: CintAssistantGroundingDep[] | null;
  analysisId?: string | null;
  live?: boolean | null;
};

export function hasCintAssistantGrounding(input: CintAssistantGroundingInput): boolean {
  return (
    (Array.isArray(input.findings) && input.findings.length > 0) ||
    (Array.isArray(input.evidence) && input.evidence.length > 0) ||
    (Array.isArray(input.dependencies) && input.dependencies.length > 0)
  );
}

/** Compact prompt block — capped so assistant latency stays bounded. */
export function formatCintAssistantGroundingBlock(input: CintAssistantGroundingInput): string {
  const lines: string[] = ["## Live workspace grounding (deterministic analyze — trust these IDs)"];
  if (input.live != null) lines.push(`Live analysis: ${input.live ? "yes" : "no"}`);
  if (input.analysisId) lines.push(`Analysis / run: ${input.analysisId}`);
  if (input.repository) lines.push(`Repository: ${input.repository}`);
  if (input.commitSha) lines.push(`Commit: ${input.commitSha}`);

  const findings = (input.findings || []).slice(0, 12);
  if (findings.length) {
    lines.push("Findings:");
    for (const f of findings) {
      lines.push(
        `- ${f.id || "?"} · ${f.severity || "?"} · ${f.category || "?"} · ${f.title || ""} @ ${f.file || f.location || "—"}`,
      );
    }
  } else {
    lines.push("Findings: (none provided — say so; do not invent finding IDs)");
  }

  const evidence = (input.evidence || []).slice(0, 10);
  if (evidence.length) {
    lines.push("Evidence IDs:");
    for (const e of evidence) {
      lines.push(
        `- ${e.id || "?"} (finding ${e.findingId || "?"}) · ${e.summary || ""} @ ${e.location || "—"}`,
      );
    }
  } else {
    lines.push("Evidence: (none provided)");
  }

  const deps = (input.dependencies || []).slice(0, 15);
  if (deps.length) {
    lines.push("Dependencies (sample):");
    for (const d of deps) {
      lines.push(`- ${d.name || "?"}@${d.version || "?"} (${d.kind || "direct"})`);
    }
  }

  if (input.contextNotes?.trim()) {
    lines.push(`Operator notes: ${input.contextNotes.trim()}`);
  }

  lines.push(
    "Rules: Prefer citing IDs from this block. If the question is about a finding not listed, say evidence is incomplete and ask for Sync/Analyze — do not fabricate file contents.",
  );
  return lines.join("\n");
}

/** Pull evidence/finding IDs that appear in the model answer (citation honesty). */
export function extractCitedIdsFromAnswer(
  answer: string,
  knownIds: string[],
): { cited: string[]; uncitedKnown: string[] } {
  const text = String(answer || "");
  const cited: string[] = [];
  const uncitedKnown: string[] = [];
  for (const id of knownIds) {
    if (!id) continue;
    if (text.includes(id)) cited.push(id);
    else uncitedKnown.push(id);
  }
  return { cited, uncitedKnown };
}
