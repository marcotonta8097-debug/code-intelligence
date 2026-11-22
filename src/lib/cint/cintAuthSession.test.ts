import { describe, expect, it } from "vitest";
import { cintRoleAllows } from "@/lib/cint/cintAuthRoles";
import {
  buildCintDemoSession,
  buildCintIdpSession,
  cintSessionAllows,
  parseCintProductSession,
} from "@/lib/cint/cintAuthSession";

describe("cintAuthSession / roles (B1)", () => {
  it("builds IdP sessions with identity + role (not demo)", () => {
    const s = buildCintIdpSession({
      userId: "u1",
      email: "alex@eng-platform.demo",
      role: "Architect",
      accessToken: "a".repeat(24),
      refreshToken: "r".repeat(24),
      expiresAt: Date.now() + 60_000,
    });
    expect(s.authMode).toBe("idp");
    expect(s.demo).toBe(false);
    expect(s.role).toBe("Architect");
    expect(cintSessionAllows(s, "remediation.approve")).toBe(true);
    expect(cintSessionAllows(s, "org.admin")).toBe(false);
  });

  it("demo sessions expire and default Admin only for local prototype", () => {
    const s = buildCintDemoSession({ email: "demo@x.test" });
    expect(s.authMode).toBe("demo");
    expect(s.role).toBe("Admin");
    expect(cintRoleAllows("Viewer", "remediation.approve")).toBe(false);
    expect(parseCintProductSession({ ...s, expiresAt: Date.now() - 1 })).toBeNull();
  });

  it("rejects incomplete IdP payloads", () => {
    expect(
      parseCintProductSession({
        authed: true,
        authMode: "idp",
        userId: "u1",
        email: "a@b.co",
        role: "Admin",
        accessToken: "short",
        expiresAt: Date.now() + 60_000,
      }),
    ).toBeNull();
  });

  it("Viewer cannot approve remediation", () => {
    const s = buildCintIdpSession({
      userId: "u2",
      email: "viewer@eng-platform.demo",
      role: "Viewer",
      accessToken: "a".repeat(24),
      refreshToken: "r".repeat(24),
    });
    expect(cintSessionAllows(s, "workspace.read")).toBe(true);
    expect(cintSessionAllows(s, "remediation.approve")).toBe(false);
  });
});
