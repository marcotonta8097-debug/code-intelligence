import { describe, expect, it } from "vitest";
import {
  acceptCodeIntelligenceTruthMap,
  advanceCodeIntelligenceEntityAuthority,
  advanceCodeIntelligenceRegistryAuthority,
  advanceCodeIntelligenceWorkflowAuthority,
  lockCodeIntelligenceTruthRebase,
  unlockCodeIntelligenceTruthRebase,
} from "@/core/codeIntelligence/codeIntelligenceTruthMap";
import {
  CINT_IDENTITY_AUTHORITY_DOMAINS,
  CINT_IDENTITY_KEY,
} from "@/core/codeIntelligence/codeIntelligenceIdentityConstitution";
import {
  auditCodeIntelligenceRegistrySlices,
  buildCodeIntelligenceRegistryAuthority,
  CINT_REGISTRY_DOMAIN_SLICES,
  CINT_REGISTRY_KEY,
  detectCodeIntelligenceRegistrySealIntent,
  isCodeIntelligenceRegistrySealed,
  sealCodeIntelligenceRegistry,
} from "@/core/codeIntelligence/codeIntelligenceRegistryAuthority";

describe("Phase 3 — cint.registry.v1 Registry Authority", () => {
  it("maps all 9 identity authority domains onto pack-owned surfaces", () => {
    const audit = auditCodeIntelligenceRegistrySlices();
    expect(audit.domainCountOk).toBe(true);
    expect(audit.ok).toBe(true);
    expect(audit.missingPages).toEqual([]);
    expect(audit.missingEntities).toEqual([]);
    expect(audit.missingFeatures).toEqual([]);
    expect(CINT_REGISTRY_DOMAIN_SLICES).toHaveLength(CINT_IDENTITY_AUTHORITY_DOMAINS.length);
    const report = CINT_REGISTRY_DOMAIN_SLICES.find((s) => s.id === "Report Authority");
    expect(report?.pages).toEqual(["History", "Overview"]);
    expect(report?.forbiddenPageInvent).toContain("Reports");
  });

  it("refuses seal without identity; seals after Truth Map accept; keeps freeze", () => {
    const refused = sealCodeIntelligenceRegistry({});
    expect(refused.ok).toBe(false);
    expect(refused.reason).toContain("identity_not_sealed");
    expect(refused.registry.sealed).toBe(false);

    const locked = lockCodeIntelligenceTruthRebase({});
    const accepted = acceptCodeIntelligenceTruthMap(locked.metadata);
    expect(accepted.metadata[CINT_IDENTITY_KEY]).toBeTruthy();

    const advanced = advanceCodeIntelligenceRegistryAuthority(accepted.metadata);
    expect(advanced.ok).toBe(true);
    expect(advanced.state.frozen).toBe(true);
    expect(advanced.state.phase).toBe("phase_3_registry");
    expect(advanced.state.registrySealedAt).toBeTruthy();
    expect(isCodeIntelligenceRegistrySealed(advanced.metadata)).toBe(true);

    const registry = advanced.metadata[CINT_REGISTRY_KEY] as {
      sealed: boolean;
      coverageOk: boolean;
      domains: unknown[];
      packAudit: { ok: boolean };
    };
    expect(registry.sealed).toBe(true);
    expect(registry.coverageOk).toBe(true);
    expect(registry.domains).toHaveLength(9);
    expect(registry.packAudit.ok).toBe(true);

    const unlockedFromIdentity = unlockCodeIntelligenceTruthRebase(accepted.metadata);
    expect(unlockedFromIdentity.ok).toBe(true);
    expect(unlockedFromIdentity.state.frozen).toBe(false);
    expect(unlockedFromIdentity.sealedDuringUnlock).toEqual(
      expect.arrayContaining(["registry", "entity", "workflow"]),
    );

    const entity = advanceCodeIntelligenceEntityAuthority(advanced.metadata);
    expect(entity.ok).toBe(true);
    const workflow = advanceCodeIntelligenceWorkflowAuthority(entity.metadata);
    expect(workflow.ok).toBe(true);
    expect(workflow.state.phase).toBe("phase_5_workflow");
    expect(workflow.state.frozen).toBe(true);

    const unlocked = unlockCodeIntelligenceTruthRebase(workflow.metadata);
    expect(unlocked.ok).toBe(true);
    expect(unlocked.state.frozen).toBe(false);
  });

  it("detects phase 3 / seal registry intent", () => {
    expect(detectCodeIntelligenceRegistrySealIntent("seal registry")).toBe(true);
    expect(detectCodeIntelligenceRegistrySealIntent("phase 3")).toBe(true);
    expect(detectCodeIntelligenceRegistrySealIntent("start next")).toBe(true);
    expect(detectCodeIntelligenceRegistrySealIntent("registry authority")).toBe(true);
    expect(detectCodeIntelligenceRegistrySealIntent("rescan only")).toBe(false);
  });

  it("build coverage matches pack audit", () => {
    const built = buildCodeIntelligenceRegistryAuthority({ sealed: false });
    expect(built.coverageOk).toBe(true);
    expect(built.packAudit.health.overall).toBe(100);
  });
});
