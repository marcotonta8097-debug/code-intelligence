/**
 * Code Intelligence product roles + capability boundaries (B1 IdP).
 * Authorization data lives in cint_profiles / app_metadata — never user_metadata.
 */

export const CINT_AUTH_ROLES = [
  "Admin",
  "Architect",
  "Security Analyst",
  "Viewer",
] as const;

export type CintAuthRole = (typeof CINT_AUTH_ROLES)[number];

export const CINT_DEFAULT_SIGNUP_ROLE: CintAuthRole = "Viewer";

export type CintCapability =
  | "workspace.read"
  | "findings.triage"
  | "security.triage"
  | "architecture.review"
  | "remediation.propose"
  | "remediation.approve"
  | "org.admin"
  | "integrations.manage";

const ROLE_CAPABILITIES: Record<CintAuthRole, readonly CintCapability[]> = {
  Admin: [
    "workspace.read",
    "findings.triage",
    "security.triage",
    "architecture.review",
    "remediation.propose",
    "remediation.approve",
    "org.admin",
    "integrations.manage",
  ],
  Architect: [
    "workspace.read",
    "findings.triage",
    "architecture.review",
    "remediation.propose",
    "remediation.approve",
    "integrations.manage",
  ],
  "Security Analyst": [
    "workspace.read",
    "findings.triage",
    "security.triage",
    "remediation.propose",
  ],
  Viewer: ["workspace.read"],
};

export function isCintAuthRole(value: unknown): value is CintAuthRole {
  return typeof value === "string" && (CINT_AUTH_ROLES as readonly string[]).includes(value);
}

export function normalizeCintAuthRole(value: unknown, fallback: CintAuthRole = CINT_DEFAULT_SIGNUP_ROLE): CintAuthRole {
  if (isCintAuthRole(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    const hit = CINT_AUTH_ROLES.find((r) => r.toLowerCase() === trimmed.toLowerCase());
    if (hit) return hit;
  }
  return fallback;
}

export function cintRoleCapabilities(role: CintAuthRole): readonly CintCapability[] {
  return ROLE_CAPABILITIES[role];
}

export function cintRoleAllows(role: CintAuthRole, capability: CintCapability): boolean {
  return cintRoleCapabilities(role).includes(capability);
}
