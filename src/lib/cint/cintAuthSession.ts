/**
 * Code Intelligence product session governance (B1).
 * Key: cint.session.v1 — isolated from replica.* / foc.*.
 */

import {
  cintRoleAllows,
  isCintAuthRole,
  normalizeCintAuthRole,
  type CintAuthRole,
  type CintCapability,
} from "@/lib/cint/cintAuthRoles";

export const CINT_SESSION_STORAGE_KEY = "cint.session.v1" as const;
export const CINT_AUTH_NOT_CONFIGURED_CODE = "cint_auth_not_configured" as const;

export type CintAuthMode = "idp" | "demo";

export type CintProductSession = {
  authed: true;
  authMode: CintAuthMode;
  at: number;
  expiresAt: number;
  userId: string;
  email: string;
  displayName: string;
  role: CintAuthRole;
  /** Present for IdP sessions; omitted/empty for honest demo. */
  accessToken?: string;
  refreshToken?: string;
  demo?: boolean;
};

export type CintSessionClientPayload = {
  authed: true;
  authMode: CintAuthMode;
  at: number;
  expiresAt: number;
  userId: string;
  email: string;
  displayName: string;
  role: CintAuthRole;
  accessToken?: string;
  refreshToken?: string;
  demo?: boolean;
};

const DAY_MS = 1000 * 60 * 60 * 24;
const DEMO_TTL_MS = DAY_MS;
const IDP_FALLBACK_TTL_MS = DAY_MS * 7;

export function isCintSessionExpired(session: Pick<CintProductSession, "expiresAt">, now = Date.now()): boolean {
  return !(typeof session.expiresAt === "number" && session.expiresAt > now);
}

export function cintSessionAllows(
  session: Pick<CintProductSession, "role" | "expiresAt" | "authed"> | null | undefined,
  capability: CintCapability,
  now = Date.now(),
): boolean {
  if (!session?.authed || isCintSessionExpired(session, now)) return false;
  if (!isCintAuthRole(session.role)) return false;
  return cintRoleAllows(session.role, capability);
}

export function buildCintIdpSession(input: {
  userId: string;
  email: string;
  displayName?: string;
  role: CintAuthRole;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  at?: number;
}): CintProductSession {
  const at = input.at ?? Date.now();
  const expiresAt =
    typeof input.expiresAt === "number" && input.expiresAt > at
      ? input.expiresAt
      : at + IDP_FALLBACK_TTL_MS;
  const refresh = input.refreshToken?.trim();
  return {
    authed: true,
    authMode: "idp",
    at,
    expiresAt,
    userId: input.userId,
    email: input.email,
    displayName: (input.displayName || input.email.split("@")[0] || "Engineer").trim(),
    role: normalizeCintAuthRole(input.role),
    accessToken: input.accessToken,
    refreshToken: refresh && refresh.length >= 20 ? refresh : undefined,
    demo: false,
  };
}

export function buildCintDemoSession(input?: {
  email?: string;
  displayName?: string;
  role?: CintAuthRole;
  at?: number;
}): CintProductSession {
  const at = input?.at ?? Date.now();
  const email = (input?.email || "demo@eng-platform.local").trim().toLowerCase();
  return {
    authed: true,
    authMode: "demo",
    at,
    expiresAt: at + DEMO_TTL_MS,
    userId: `demo:${email}`,
    email,
    displayName: (input?.displayName || "Demo Engineer").trim(),
    role: normalizeCintAuthRole(input?.role, "Admin"),
    demo: true,
  };
}

export function parseCintProductSession(raw: unknown, now = Date.now()): CintProductSession | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.authed !== true) return null;

  const authMode: CintAuthMode =
    o.authMode === "idp" ? "idp" : o.authMode === "demo" || o.demo === true ? "demo" : o.accessToken ? "idp" : "demo";

  const at = typeof o.at === "number" ? o.at : now;
  const expiresAt =
    typeof o.expiresAt === "number"
      ? o.expiresAt
      : authMode === "demo"
        ? at + DEMO_TTL_MS
        : at + IDP_FALLBACK_TTL_MS;

  if (expiresAt <= now) return null;

  const email = typeof o.email === "string" && o.email.trim() ? o.email.trim().toLowerCase() : "";
  const userId =
    typeof o.userId === "string" && o.userId.trim()
      ? o.userId.trim()
      : authMode === "demo"
        ? `demo:${email || "anonymous"}`
        : "";
  if (authMode === "idp" && (!userId || !email)) return null;

  const accessToken = typeof o.accessToken === "string" ? o.accessToken.trim() : "";
  const refreshToken = typeof o.refreshToken === "string" ? o.refreshToken.trim() : "";
  if (authMode === "idp" && accessToken.length < 20) return null;

  return {
    authed: true,
    authMode,
    at,
    expiresAt,
    userId: userId || `demo:anonymous`,
    email: email || "demo@eng-platform.local",
    displayName:
      typeof o.displayName === "string" && o.displayName.trim()
        ? o.displayName.trim()
        : email.split("@")[0] || "Engineer",
    role: normalizeCintAuthRole(o.role, authMode === "demo" ? "Admin" : "Viewer"),
    accessToken: accessToken || undefined,
    refreshToken: refreshToken || undefined,
    demo: authMode === "demo",
  };
}

/** Strip secrets for UI paint / audit logs. */
export function cintSessionPublicView(session: CintProductSession): Omit<CintProductSession, "accessToken" | "refreshToken"> {
  const { accessToken: _a, refreshToken: _r, ...rest } = session;
  return rest;
}

export function toCintSessionClientPayload(session: CintProductSession): CintSessionClientPayload {
  return {
    authed: true,
    authMode: session.authMode,
    at: session.at,
    expiresAt: session.expiresAt,
    userId: session.userId,
    email: session.email,
    displayName: session.displayName,
    role: session.role,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    demo: session.demo,
  };
}
