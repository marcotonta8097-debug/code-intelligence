import { describe, expect, it } from "vitest";
import { sealCodeIntelligencePhases810Cascade } from "@/core/codeIntelligence/codeIntelligencePhases810Seal";
import { sealCodeIntelligenceDeliverySchema } from "@/core/codeIntelligence/codeIntelligenceDeliverySchema";
import { sealCodeIntelligencePhases1320Cascade } from "@/core/codeIntelligence/codeIntelligencePhases1320Seal";
import { sealCodeIntelligenceAgentGovernment } from "@/core/codeIntelligence/codeIntelligenceAgentGovernment";
import { sealCodeIntelligenceAgentRuntime } from "@/core/codeIntelligence/codeIntelligenceAgentRuntime";
import { sealCodeIntelligenceAgentInteraction } from "@/core/codeIntelligence/codeIntelligenceAgentInteraction";
import { sealCodeIntelligenceAgentArchitectureAudit } from "@/core/codeIntelligence/codeIntelligenceAgentArchitectureAudit";
import { sealCodeIntelligenceConnectorLift } from "@/core/codeIntelligence/codeIntelligenceConnectorLift";
import {
  sealCodeIntelligenceDeliveryEmit,
  stampCodeIntelligencePartIIHtml,
} from "@/core/codeIntelligence/codeIntelligenceDeliveryEmit";
import { sealCodeIntelligenceConnectorWire } from "@/core/codeIntelligence/codeIntelligenceConnectorWire";
import { evaluateCodeIntelligenceHonestyPath } from "@/core/codeIntelligence/codeIntelligenceHonestyPath";
import { dispatchCodeIntelligenceAgent } from "@/core/codeIntelligence/codeIntelligenceAgentRuntime";
import { createRecoverySnapshot } from "@/core/codeIntelligence/codeIntelligenceRollbackEngine";
import { buildGoldenPathStatus } from "@/lib/generation/delivery/buildGoldenPathStatus";
import {
  applyCodeIntelligenceHonestyToInteractionScore,
} from "@/core/codeIntelligence/codeIntelligenceHonestyPath";
import { readWireStatusFromMetadata, readSmokeResultFromMetadata } from "@/lib/generation/delivery/gatherGoldenPathStatus";
import { sealCodeIntelligenceIdentity } from "@/core/codeIntelligence/codeIntelligenceIdentityConstitution";
import {
  acceptCodeIntelligenceTruthMap,
  advanceCodeIntelligenceEntityAuthority,
  advanceCodeIntelligenceRegistryAuthority,
  advanceCodeIntelligenceWorkflowAuthority,
  lockCodeIntelligenceTruthRebase,
} from "@/core/codeIntelligence/codeIntelligenceTruthMap";
import { sealCodeIntelligenceLiveIndexEvidence } from "@/lib/cint/cintGitHubConnectionStore";

function sealToWire() {
  let meta: Record<string, unknown> = lockCodeIntelligenceTruthRebase({}).metadata;
  meta = acceptCodeIntelligenceTruthMap(meta).metadata;
  meta = sealCodeIntelligenceIdentity(meta).metadata;
  meta = advanceCodeIntelligenceRegistryAuthority(meta).metadata;
  meta = advanceCodeIntelligenceEntityAuthority(meta).metadata;
  meta = advanceCodeIntelligenceWorkflowAuthority(meta).metadata;
  meta = sealCodeIntelligenceAgentGovernment(meta).metadata;
  meta = sealCodeIntelligencePhases810Cascade(meta).metadata;
  meta = sealCodeIntelligenceDeliverySchema(meta).metadata;
  meta = sealCodeIntelligencePhases1320Cascade(meta).metadata;
  meta = sealCodeIntelligenceAgentRuntime(meta).metadata;
  meta = sealCodeIntelligenceAgentInteraction(meta).metadata;
  meta = sealCodeIntelligenceAgentArchitectureAudit(meta).metadata;
  meta = sealCodeIntelligenceConnectorLift(meta, { approvedBy: "human_operator" }).metadata;
  meta = sealCodeIntelligenceDeliveryEmit(meta).metadata;
  meta = sealCodeIntelligenceConnectorWire(meta, { approvedBy: "human_operator" }).metadata;
  return meta;
}

function sealToLiveIndex() {
  return sealCodeIntelligenceLiveIndexEvidence(sealToWire()).metadata;
}

describe("CI near-production independence (4 blockers)", () => {
  it("keeps CINT_NO_LIVE_INDEX after wire seal alone (PDS honesty)", () => {
    const meta = sealToWire();
    const html = stampCodeIntelligencePartIIHtml(
      `<div data-product-surface="code_intelligence" data-cint-app-shell="1" data-cint-page="findings"></div>`,
    );
    const path = evaluateCodeIntelligenceHonestyPath({
      html,
      metadata: meta,
      fieldRegistryId: "field:code_intelligence",
    });
    expect(path).toBeTruthy();
    expect(path!.blockers.some((b) => b.code === "CINT_NO_LIVE_INDEX")).toBe(true);
    expect(path!.expectedGpsBand).not.toBe("production_candidate");
  });

  it("clears honesty production blockers after Part II emit + connector wire + live index", () => {
    const meta = sealToLiveIndex();
    const html = stampCodeIntelligencePartIIHtml(
      `<div data-product-surface="code_intelligence" data-cint-app-shell="1" data-cint-page="findings"></div>`,
    );
    const path = evaluateCodeIntelligenceHonestyPath({
      html,
      metadata: meta,
      fieldRegistryId: "field:code_intelligence",
    });
    expect(path).toBeTruthy();
    expect(path!.dataBindingReal).toBe(true);
    expect(path!.blockers.filter((b) => b.blocksProductionCandidate)).toEqual([]);
    expect(path!.expectedGpsBand).toBe("production_candidate");
  });

  it("allows GPS production_candidate when Part II + wire + live index + interaction gates pass", () => {
    const meta = sealToLiveIndex();
    const html = stampCodeIntelligencePartIIHtml(
      `<div data-product-surface="code_intelligence" data-cint-app-shell="1"></div>`,
    );
    const honesty = evaluateCodeIntelligenceHonestyPath({
      html,
      metadata: meta,
      fieldRegistryId: "field:code_intelligence",
    })!;
    const interaction = applyCodeIntelligenceHonestyToInteractionScore(
      {
        value: 5,
        formsPresent: true,
        filtersPresent: true,
        navigationComplete: true,
        actionsReachable: true,
        dataBindingReal: true,
      },
      { html, metadata: meta, fieldRegistryId: "field:code_intelligence" },
    );
    expect(interaction.dataBindingReal).toBe(true);
    const wire = readWireStatusFromMetadata(meta);
    const smoke = readSmokeResultFromMetadata(meta);
    const status = buildGoldenPathStatus(
      "gen-ci-prod",
      "field:code_intelligence",
      {
        isComplete: true,
        sealedPageCount: 16,
        totalContractPageCount: 16,
        incompleteSurfaces: [],
        lastCheckedAt: new Date().toISOString(),
      },
      interaction,
      {
        loginScreenPresent: true,
        sessionManagementPresent: true,
        roleEnforcementPresent: true,
        protectedRoutesPresent: true,
      },
      wire,
      smoke,
      { criticalFailureCount: 0, highFailureCount: 0, repairBriefCount: 0, passed: true },
      {
        allGatesClear: honesty.blockers.filter((b) => b.blocksProductionCandidate).length === 0,
        blockerCodes: [],
        summary: "CI Part II clear",
      },
    );
    expect(status.honestLabel).toBe("production_candidate");
  });

  it("enables Remediation Engineer source writes only with L4/L5 + recovery after wire", () => {
    let meta = sealToLiveIndex();
    const denied = dispatchCodeIntelligenceAgent({
      metadata: meta,
      agentId: "remediation_engineer",
      action: "apply patch",
      humanApproved: false,
    });
    expect(denied.ok).toBe(false);
    expect(denied.blockers.some((b) => /L4_L5|RECOVERY|HUMAN/i.test(b))).toBe(true);

    const snap = createRecoverySnapshot(meta, {
      operation: "repair",
      files: [{ path: "auth/middleware.ts", content: "// before" }],
      label: "pre-engineer",
    });
    meta = snap.metadata;
    expect(snap.snapshot?.id).toBeTruthy();

    const applied = dispatchCodeIntelligenceAgent({
      metadata: meta,
      agentId: "remediation_engineer",
      action: "apply authorized patch to auth middleware",
      humanApproved: true,
      recoverySnapshotId: snap.snapshot!.id,
      pullRequest: {
        prUrl: "https://github.com/acme/payments-api/pull/42",
        prNumber: 42,
        branch: "cint/remediation-test",
        commitSha: "abc123",
        repository: "acme/payments-api",
      },
    });
    expect(applied.ok).toBe(true);
    expect(applied.artifacts?.writesSource).toBe(true);
    expect(applied.artifacts?.neverWritesSource).toBe(false);
    expect(applied.artifacts?.prUrl).toBe("https://github.com/acme/payments-api/pull/42");
  });
});
