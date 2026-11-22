/**
 * Server gate for Code Intelligence product APIs (B1 role boundaries).
 */

import {
  cintAuthResolveAccessToken,
  isCintAuthConfigured,
  cintAuthNotConfiguredMessage,
  CINT_AUTH_NOT_CONFIGURED_CODE,
} from "@/lib/cint/cintAuthService";
import { cintRoleAllows, type CintCapability } from "@/lib/cint/cintAuthRoles";
import type { CintProductSession } from "@/lib/cint/cintAuthSession";
import { isProduction } from "@/serverFns/security.server";

export type CintAuthGateOk = {
  ok: true;
  session: CintProductSession;
};

export type CintAuthGateFail = {
  ok: false;
  response: Response;
};

function bearerFromRequest(request: Request): string {
  const h = request.headers.get("authorization") || request.headers.get("Authorization") || "";
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m?.[1]?.trim() || "";
}

/**
 * Require IdP Bearer session + capability.
 * Demo sessions are rejected on capability-gated routes (honest: demo ≠ production auth).
 * When IdP is not configured in non-production, returns 503 with allowDemo hint — callers
 * that explicitly allow demo may fall through; gated routes stay closed.
 */
export async function requireCintProductAuth(
  request: Request,
  capability: CintCapability,
): Promise<CintAuthGateOk | CintAuthGateFail> {
  if (!isCintAuthConfigured()) {
    return {
      ok: false,
      response: Response.json(
        {
          ok: false,
          code: CINT_AUTH_NOT_CONFIGURED_CODE,
          error: cintAuthNotConfiguredMessage(),
          allowDemo: !isProduction(),
        },
        { status: 503 },
      ),
    };
  }

  const token = bearerFromRequest(request);
  if (!token) {
    return {
      ok: false,
      response: Response.json(
        {
          ok: false,
          code: "cint_auth_required",
          error: "Sign in with Code Intelligence IdP (Bearer token missing).",
        },
        { status: 401 },
      ),
    };
  }

  const resolved = await cintAuthResolveAccessToken(token);
  if (!resolved.ok) {
    return {
      ok: false,
      response: Response.json(
        { ok: false, code: resolved.code, error: resolved.error },
        { status: resolved.status },
      ),
    };
  }

  if (resolved.session.authMode !== "idp" || resolved.session.demo) {
    return {
      ok: false,
      response: Response.json(
        {
          ok: false,
          code: "cint_auth_demo_rejected",
          error: "Demo sessions cannot perform this action. Sign in with IdP.",
        },
        { status: 403 },
      ),
    };
  }

  if (!cintRoleAllows(resolved.session.role, capability)) {
    return {
      ok: false,
      response: Response.json(
        {
          ok: false,
          code: "cint_auth_forbidden",
          error: `Role ${resolved.session.role} cannot ${capability}`,
          role: resolved.session.role,
          capability,
        },
        { status: 403 },
      ),
    };
  }

  return { ok: true, session: resolved.session };
}
