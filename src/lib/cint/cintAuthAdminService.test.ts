import { describe, expect, it } from "vitest";
import {
  cintAdminAssignableRoles,
  isCintAdminConfigured,
} from "@/lib/cint/cintAuthAdminService";
import { CINT_AUTH_ROLES, cintRoleAllows } from "@/lib/cint/cintAuthRoles";

describe("cintAuthAdminService", () => {
  it("exposes the four IdP roles for Admin promote", () => {
    expect(cintAdminAssignableRoles()).toEqual([...CINT_AUTH_ROLES]);
    expect(cintAdminAssignableRoles()).toContain("Admin");
    expect(cintAdminAssignableRoles()).toContain("Architect");
    expect(cintAdminAssignableRoles()).toContain("Viewer");
  });

  it("only Admin has org.admin (Architect keeps remediation.approve)", () => {
    expect(cintRoleAllows("Admin", "org.admin")).toBe(true);
    expect(cintRoleAllows("Architect", "org.admin")).toBe(false);
    expect(cintRoleAllows("Architect", "remediation.approve")).toBe(true);
    expect(cintRoleAllows("Viewer", "org.admin")).toBe(false);
  });

  it("reports configured only when service role env is present", () => {
    expect(typeof isCintAdminConfigured()).toBe("boolean");
  });
});
