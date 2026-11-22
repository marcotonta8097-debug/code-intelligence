import { describe, expect, it } from "vitest";
import { sealCodeIntelligencePhases810Cascade } from "@/core/codeIntelligence/codeIntelligencePhases810Seal";
import { sealCodeIntelligenceDeliverySchema } from "@/core/codeIntelligence/codeIntelligenceDeliverySchema";
import {
  archiveDeleteToVault,
  assertMutateAllowed,
  buildChangeDiffReport,
  createRecoverySnapshot,
  detectCodeIntelligenceRollbackEngineSealIntent,
  isCodeIntelligenceRollbackEngineSealed,
  restoreRecoverySnapshot,
  sealCodeIntelligenceRollbackEngine,
  triggerDisasterRecovery,
} from "@/core/codeIntelligence/codeIntelligenceRollbackEngine";

function sealThroughPhase11() {
  const p810 = sealCodeIntelligencePhases810Cascade({});
  return sealCodeIntelligenceDeliverySchema(p810.metadata);
}

describe("cint.rollback.engine.v1 Phase 12", () => {
  it("blocks seal until Phase 11 delivery schema is sealed", () => {
    const blocked = sealCodeIntelligenceRollbackEngine({});
    expect(blocked.rollback.sealed).toBe(false);
    expect(blocked.blockedReason).toMatch(/Phase 11/);
    expect(isCodeIntelligenceRollbackEngineSealed(blocked.metadata)).toBe(false);
  });

  it("seals after Phase 11 and exposes recovery modules", () => {
    const prior = sealThroughPhase11();
    const sealed = sealCodeIntelligenceRollbackEngine(prior.metadata);
    expect(sealed.blockedReason).toBeUndefined();
    expect(sealed.rollback.sealed).toBe(true);
    expect(sealed.rollback.modules).toHaveLength(6);
    expect(sealed.rollback.maxims[0]).toMatch(/NO AI ACTION WITHOUT RECOVERY/);
  });

  it("requires recovery point before mutate", () => {
    const prior = sealThroughPhase11();
    const sealed = sealCodeIntelligenceRollbackEngine(prior.metadata);
    expect(assertMutateAllowed({ metadata: sealed.metadata, operation: "repair" }).allowed).toBe(
      false,
    );
    const snap = createRecoverySnapshot(sealed.metadata, {
      operation: "repair",
      files: [{ path: "auth.ts", content: "const a = 1" }],
    });
    expect(snap.snapshot?.id).toMatch(/^SNAP-/);
    const gate = assertMutateAllowed({
      metadata: snap.metadata,
      operation: "repair",
      recoverySnapshotId: snap.snapshot!.id,
    });
    expect(gate.allowed).toBe(true);
  });

  it("archives deletes and restores snapshots", () => {
    const prior = sealThroughPhase11();
    let meta = sealCodeIntelligenceRollbackEngine(prior.metadata).metadata;
    const snap = createRecoverySnapshot(meta, {
      operation: "delete",
      files: [
        { path: "auth.ts", content: "old" },
        { path: "session.ts", content: "sess" },
      ],
    });
    meta = snap.metadata;
    const archived = archiveDeleteToVault(meta, {
      path: "auth.ts",
      content: "old",
      reason: "safe delete",
      snapshotId: snap.snapshot!.id,
    });
    expect(archived.entry?.permanentlyDeleted).toBe(false);
    meta = archived.metadata;
    const restored = restoreRecoverySnapshot(meta, snap.snapshot!.id);
    expect(restored.filesRestored).toBe(2);
    expect(restored.message).toMatch(/Rollback Successful/);
  });

  it("builds change diffs for human review", () => {
    const diff = buildChangeDiffReport(
      [{ path: "a.ts", content: "1" }],
      [
        { path: "a.ts", content: "2" },
        { path: "b.ts", content: "new" },
      ],
    );
    expect(diff.summary).toMatch(/added/);
    expect(diff.lines.some((l) => l.kind === "modified" && l.path === "a.ts")).toBe(true);
    expect(diff.lines.some((l) => l.kind === "added" && l.path === "b.ts")).toBe(true);
  });

  it("disaster recovery locks via audit emergency and restores last stable", () => {
    const prior = sealThroughPhase11();
    // Phase 10 already sealed via 8–10 cascade inside sealThroughPhase11.
    let meta = sealCodeIntelligenceRollbackEngine(prior.metadata).metadata;
    const snap = createRecoverySnapshot(meta, {
      operation: "repair",
      files: [{ path: "middleware.ts", content: "stable" }],
      label: "stable",
    });
    meta = snap.metadata;
    const disaster = triggerDisasterRecovery({
      metadata: meta,
      reason: "Failed repair — mass corruption risk",
      invokedBy: "test_operator",
    });
    expect(disaster.blockedReason).toBeUndefined();
    expect(disaster.restoreMessage).toMatch(/Rollback Successful/);
    expect(
      disaster.audit?.emergencyControls.some(
        (c) => c.control === "emergency_rollback" && c.active,
      ),
    ).toBe(true);
  });

  it("detects phase 12 / recovery intents", () => {
    expect(detectCodeIntelligenceRollbackEngineSealIntent("phase 12")).toBe(true);
    expect(detectCodeIntelligenceRollbackEngineSealIntent("seal recovery rollback")).toBe(true);
    expect(detectCodeIntelligenceRollbackEngineSealIntent("rescan only")).toBe(false);
  });
});
