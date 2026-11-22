/**
 * Phases 13–20 cascade seal —
 * Seal Validation → Trust → Memory → Impact → Predictive → Architecture → Repair Guard → Ops Centre.
 *
 * One Repair intent (“start next phases” after Phase 12 / “phases 13 to 20”) seals missing
 * authorities in order. Does not invent pages. Does not lift connector freeze.
 */

import {
  isCodeIntelligenceRollbackEngineSealed,
  sealCodeIntelligenceRollbackEngine,
} from "@/core/codeIntelligence/codeIntelligenceRollbackEngine";
import {
  isCodeIntelligenceSealValidationSealed,
  sealCodeIntelligenceSealValidation,
} from "@/core/codeIntelligence/codeIntelligenceSealValidation";
import {
  isCodeIntelligenceTrustEngineSealed,
  sealCodeIntelligenceTrustEngine,
} from "@/core/codeIntelligence/codeIntelligenceTrustEngine";
import {
  isCodeIntelligenceMemoryEngineSealed,
  sealCodeIntelligenceMemoryEngine,
} from "@/core/codeIntelligence/codeIntelligenceMemoryEngine";
import {
  isCodeIntelligenceImpactAnalysisSealed,
  sealCodeIntelligenceImpactAnalysis,
} from "@/core/codeIntelligence/codeIntelligenceImpactAnalysis";
import {
  isCodeIntelligencePredictiveRiskSealed,
  sealCodeIntelligencePredictiveRisk,
} from "@/core/codeIntelligence/codeIntelligencePredictiveRisk";
import {
  isCodeIntelligenceArchitectureIntelligenceSealed,
  sealCodeIntelligenceArchitectureIntelligence,
} from "@/core/codeIntelligence/codeIntelligenceArchitectureIntelligence";
import {
  isCodeIntelligenceGovernanceRepairGuardSealed,
  sealCodeIntelligenceGovernanceRepairGuard,
} from "@/core/codeIntelligence/codeIntelligenceGovernanceRepairGuard";
import {
  isCodeIntelligenceOperationsCenterSealed,
  sealCodeIntelligenceOperationsCenter,
} from "@/core/codeIntelligence/codeIntelligenceOperationsCenter";
import { isCodeIntelligenceDeliverySchemaSealed } from "@/core/codeIntelligence/codeIntelligenceDeliverySchema";

export type CodeIntelligencePhases1320SealResult = Readonly<{
  metadata: Record<string, unknown>;
  complete: boolean;
  progressLines: readonly string[];
}>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** True for start-next (post-12) / phases 13–20 intents. */
export function detectCodeIntelligencePhases1320SealIntent(
  userPrompt?: string | null,
): boolean {
  const text = String(userPrompt || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return false;
  return (
    /\bstart\b.{0,40}\bnext\s+phases?\b/.test(text) ||
    /\bphases?\s*13\s*(to|through|-|–|—|and|&|\/)\s*20\b/.test(text) ||
    /\bphases?\s*12\s*(to|through|-|–|—|and|&|\/)\s*20\b/.test(text) ||
    /\bseal\b.{0,40}\bphases?\s*1[3-9]\b/.test(text) ||
    /\bcomplete\b.{0,40}\bphases?\s*1[3-9]\b/.test(text) ||
    /\bharden\b.{0,20}\b(platform|seals?|phases?)\b/.test(text)
  );
}

/**
 * Ensure Phase 12 then seal 13→20 in order. Idempotent.
 * Connector freeze remains ON.
 */
export function sealCodeIntelligencePhases1320Cascade(
  metadata: unknown,
  options?: { html?: string },
): CodeIntelligencePhases1320SealResult {
  let working = asRecord(metadata) ? { ...asRecord(metadata)! } : {};
  const progressLines: string[] = [];

  if (!isCodeIntelligenceDeliverySchemaSealed(working)) {
    return {
      metadata: working,
      complete: false,
      progressLines: [
        "○ Phases 13–20 blocked — Phase 11 Delivery Schema must be sealed first.",
      ],
    };
  }

  if (!isCodeIntelligenceRollbackEngineSealed(working)) {
    const rb = sealCodeIntelligenceRollbackEngine(working);
    if (rb.blockedReason) {
      return {
        metadata: working,
        complete: false,
        progressLines: [`○ Phase 12 blocked — ${rb.blockedReason}`],
      };
    }
    working = rb.metadata;
    progressLines.push(
      "✓ cint.rollback.engine.v1 SEALED (Phase 12) — No AI mutate without recovery capability.",
    );
  }

  if (!isCodeIntelligenceSealValidationSealed(working)) {
    const sealed = sealCodeIntelligenceSealValidation(working);
    if (sealed.blockedReason) {
      progressLines.push(`○ Phase 13 blocked — ${sealed.blockedReason}`);
    } else {
      working = sealed.metadata;
      progressLines.push(
        `✓ cint.seal.validation.v1 SEALED (Phase 13) — Integrity ${sealed.validation.integrityScore}%.`,
      );
    }
  } else {
    progressLines.push("○ cint.seal.validation.v1 already sealed — Seal Validation holds.");
  }

  if (!isCodeIntelligenceTrustEngineSealed(working)) {
    const sealed = sealCodeIntelligenceTrustEngine(working, { html: options?.html });
    if (sealed.blockedReason) {
      progressLines.push(`○ Phase 14 blocked — ${sealed.blockedReason}`);
    } else {
      working = sealed.metadata;
      progressLines.push(
        `✓ cint.trust.engine.v1 SEALED (Phase 14) — Overall Project Trust ${sealed.trust.overallProjectTrust}%.`,
      );
    }
  } else {
    progressLines.push("○ cint.trust.engine.v1 already sealed — Trust Engine holds.");
  }

  if (!isCodeIntelligenceMemoryEngineSealed(working)) {
    const sealed = sealCodeIntelligenceMemoryEngine(working);
    if (sealed.blockedReason) {
      progressLines.push(`○ Phase 15 blocked — ${sealed.blockedReason}`);
    } else {
      working = sealed.metadata;
      progressLines.push("✓ cint.memory.engine.v1 SEALED (Phase 15) — Repository Memory online.");
    }
  } else {
    progressLines.push("○ cint.memory.engine.v1 already sealed — Memory Engine holds.");
  }

  if (!isCodeIntelligenceImpactAnalysisSealed(working)) {
    const sealed = sealCodeIntelligenceImpactAnalysis(working);
    if (sealed.blockedReason) {
      progressLines.push(`○ Phase 16 blocked — ${sealed.blockedReason}`);
    } else {
      working = sealed.metadata;
      progressLines.push("✓ cint.impact.analysis.v1 SEALED (Phase 16) — Change Impact prepare-only.");
    }
  } else {
    progressLines.push("○ cint.impact.analysis.v1 already sealed — Impact Analysis holds.");
  }

  if (!isCodeIntelligencePredictiveRiskSealed(working)) {
    const sealed = sealCodeIntelligencePredictiveRisk(working);
    if (sealed.blockedReason) {
      progressLines.push(`○ Phase 17 blocked — ${sealed.blockedReason}`);
    } else {
      working = sealed.metadata;
      progressLines.push("✓ cint.predictive.risk.v1 SEALED (Phase 17) — Advisory predictive signals.");
    }
  } else {
    progressLines.push("○ cint.predictive.risk.v1 already sealed — Predictive Risk holds.");
  }

  if (!isCodeIntelligenceArchitectureIntelligenceSealed(working)) {
    const sealed = sealCodeIntelligenceArchitectureIntelligence(working);
    if (sealed.blockedReason) {
      progressLines.push(`○ Phase 18 blocked — ${sealed.blockedReason}`);
    } else {
      working = sealed.metadata;
      progressLines.push(
        "✓ cint.architecture.intelligence.v1 SEALED (Phase 18) — Maps via existing AKE owner.",
      );
    }
  } else {
    progressLines.push(
      "○ cint.architecture.intelligence.v1 already sealed — Architecture Intelligence holds.",
    );
  }

  if (!isCodeIntelligenceGovernanceRepairGuardSealed(working)) {
    const sealed = sealCodeIntelligenceGovernanceRepairGuard(working);
    if (sealed.blockedReason) {
      progressLines.push(`○ Phase 19 blocked — ${sealed.blockedReason}`);
    } else {
      working = sealed.metadata;
      progressLines.push(
        "✓ cint.governance.repair.guard.v1 SEALED (Phase 19) — No repair without all gates.",
      );
    }
  } else {
    progressLines.push(
      "○ cint.governance.repair.guard.v1 already sealed — Repair Guard holds.",
    );
  }

  if (!isCodeIntelligenceOperationsCenterSealed(working)) {
    const sealed = sealCodeIntelligenceOperationsCenter(working);
    if (sealed.blockedReason) {
      progressLines.push(`○ Phase 20 blocked — ${sealed.blockedReason}`);
    } else {
      working = sealed.metadata;
      progressLines.push(
        `✓ cint.operations.center.v1 SEALED (Phase 20) — Status ${sealed.ops.executive.platformStatus}.`,
      );
    }
  } else {
    progressLines.push("○ cint.operations.center.v1 already sealed — Operations Centre holds.");
  }

  const complete = areCodeIntelligencePhases1320Sealed(working);
  if (complete) {
    progressLines.push(
      "✓ Phases 12–20 hardening seals COMPLETE — connector freeze still ON until explicit human lift.",
    );
  }

  return { metadata: working, complete, progressLines };
}

export function areCodeIntelligencePhases1320Sealed(metadata?: unknown): boolean {
  return (
    isCodeIntelligenceRollbackEngineSealed(metadata) &&
    isCodeIntelligenceSealValidationSealed(metadata) &&
    isCodeIntelligenceTrustEngineSealed(metadata) &&
    isCodeIntelligenceMemoryEngineSealed(metadata) &&
    isCodeIntelligenceImpactAnalysisSealed(metadata) &&
    isCodeIntelligencePredictiveRiskSealed(metadata) &&
    isCodeIntelligenceArchitectureIntelligenceSealed(metadata) &&
    isCodeIntelligenceGovernanceRepairGuardSealed(metadata) &&
    isCodeIntelligenceOperationsCenterSealed(metadata)
  );
}
