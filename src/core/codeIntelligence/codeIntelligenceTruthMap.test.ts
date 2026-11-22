import { describe, expect, it } from "vitest";
import {
  acceptCodeIntelligenceTruthMap,
  buildCodeIntelligenceTruthMap,
  CINT_TRUTH_MAP_REQUIRED_PAGES,
  detectCodeIntelligenceTruthMapAcceptIntent,
  detectCodeIntelligenceUnlockIntent,
  isCodeIntelligenceAutoRepairFrozen,
  lockCodeIntelligenceTruthRebase,
  unlockCodeIntelligenceTruthRebase,
} from "@/core/codeIntelligence/codeIntelligenceTruthMap";
import {
  CINT_IDENTITY_AUTHORITY_DOMAINS,
  CINT_IDENTITY_KEY,
  CINT_IDENTITY_PRIMARY_PURPOSES,
  isCodeIntelligenceIdentitySealed,
  type CodeIntelligenceIdentityConstitution,
} from "@/core/codeIntelligence/codeIntelligenceIdentityConstitution";

const FULL_HTML = `
<div class="app-shell" data-cint-app-shell="1" data-product-surface="code_intelligence">
  <aside data-cint-rail="1">
    ${CINT_TRUTH_MAP_REQUIRED_PAGES.filter((p) => !["Landing", "Login", "Signup", "Forgot Password"].includes(p))
      .map((p) => {
        const id = p.toLowerCase().replace(/\s+/g, "-");
        return `<a href="#${id}" data-view-nav="${id}">${p}</a>`;
      })
      .join("\n")}
  </aside>
  <main>
    ${CINT_TRUTH_MAP_REQUIRED_PAGES.map((p) => {
      const id = p.toLowerCase().replace(/\s+/g, "-");
      return `<section data-view="${id}" data-route="${id}">${p}</section>`;
    }).join("\n")}
  </main>
</div>
`;

describe("codeIntelligenceTruthMap Phase 1 acceptance layers", () => {
  it("covers required navigation/contract/route/alias layers", () => {
    const map = buildCodeIntelligenceTruthMap({
      html: FULL_HTML,
      userPrompt: "Code Intelligence platform",
      metadata: undefined,
    });
    expect(map.requiredManifest).toHaveLength(8);
    expect(map.layers.alias.dashboardMapsTo).toBe("Overview");
    expect(map.acceptance.readyToAccept).toBe(true);
    expect(map.acceptance.projectParityClean).toBe(false);
    expect(map.layers.contract.some((row) => row.status === "missing")).toBe(true);
    expect(map.layers.route).toHaveLength(8);
  });

  it("accept seals cint.identity.v1 and keeps freeze; unlock requires accept + seal", () => {
    const locked = lockCodeIntelligenceTruthRebase({});
    expect(isCodeIntelligenceAutoRepairFrozen({ html: FULL_HTML, metadata: locked.metadata })).toBe(
      true,
    );
    // Unlock from locked state cascades accept + remaining seals (operator parity unlock).
    const unlockedFromLocked = unlockCodeIntelligenceTruthRebase(locked.metadata);
    expect(unlockedFromLocked.ok).toBe(true);
    expect(unlockedFromLocked.state.frozen).toBe(false);
    expect(unlockedFromLocked.sealedDuringUnlock).toContain("identity");

    const accepted = acceptCodeIntelligenceTruthMap(locked.metadata);
    expect(accepted.state.frozen).toBe(true);
    expect(accepted.state.acceptedAt).toBeTruthy();
    expect(accepted.state.phase).toBe("phase_2_identity");
    expect(accepted.state.identitySealedAt).toBeTruthy();
    expect(accepted.identitySealed).toBe(true);
    expect(isCodeIntelligenceIdentitySealed(accepted.metadata)).toBe(true);

    const identity = accepted.metadata[CINT_IDENTITY_KEY] as CodeIntelligenceIdentityConstitution;
    expect(identity.sealed).toBe(true);
    expect(identity.assets.primary).toBe("Engineering Intelligence");
    expect(identity.assets.secondary).toBe("Repository Knowledge");
    expect(identity.assets.tertiary).toBe("Engineering Governance");
    expect(identity.productFamily).toBe("Engineering Intelligence");
    expect(identity.productType).toBe("Code Intelligence Platform");
    expect([...identity.primaryPurposes]).toEqual([...CINT_IDENTITY_PRIMARY_PURPOSES]);
    expect([...identity.authorityDomains]).toEqual([...CINT_IDENTITY_AUTHORITY_DOMAINS]);
    expect(identity.exclusions.not).toContain("E-Commerce");
    expect(identity.exclusions.not).toContain("Field Operations");

    // Unlock cascades missing seals then unfreezes (operator parity unlock).
    const unlocked = unlockCodeIntelligenceTruthRebase(accepted.metadata);
    expect(unlocked.ok).toBe(true);
    expect(unlocked.state.frozen).toBe(false);
    expect(unlocked.sealedDuringUnlock.length).toBeGreaterThan(0);
  });

  it("detects unlock intent", () => {
    expect(detectCodeIntelligenceUnlockIntent("unlock")).toBe(true);
    expect(detectCodeIntelligenceUnlockIntent("unlock repair for parity heal")).toBe(true);
    expect(
      detectCodeIntelligenceUnlockIntent(
        "coulde you help me built a code intelligence platform\nunlock",
      ),
    ).toBe(true);
    expect(detectCodeIntelligenceUnlockIntent("unlock ci freeze")).toBe(true);
    expect(detectCodeIntelligenceUnlockIntent("rescan only")).toBe(false);
  });

  it("detects accept truth map intent", () => {
    expect(detectCodeIntelligenceTruthMapAcceptIntent("ACCEPT TRUTH MAP")).toBe(true);
    expect(detectCodeIntelligenceTruthMapAcceptIntent("please accept the truth map now")).toBe(
      true,
    );
    expect(detectCodeIntelligenceTruthMapAcceptIntent("seal identity constitution")).toBe(true);
    expect(detectCodeIntelligenceTruthMapAcceptIntent("rescan only")).toBe(false);
  });
});
