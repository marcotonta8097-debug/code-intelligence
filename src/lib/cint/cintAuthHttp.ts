/**
 * Shared CI product-auth HTTP handler (B1).
 * Used by /cint/auth and as a fallback when /cint/$entity receives "auth".
 */

import { z } from "zod";
import {
  assertSameOriginAuthRequest,
  clientIpFromRequest,
} from "@/lib/auth/sameOriginAuthRequest";
import {
  cintAuthNotConfiguredMessage,
  cintAuthRefresh,
  cintAuthRequestPasswordReset,
  cintAuthResolveAccessToken,
  cintAuthSignIn,
  cintAuthSignOut,
  cintAuthSignUp,
  CINT_AUTH_NOT_CONFIGURED_CODE,
  isCintAuthConfigured,
} from "@/lib/cint/cintAuthService";
import { enforceRateLimitPlaceholder } from "@/serverFns/security.server";

const bodySchema = z.object({
  action: z
    .enum(["login", "signup", "logout", "refresh", "session", "forgot"])
    .default("login"),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  displayName: z.string().trim().min(1).max(80).optional(),
  refreshToken: z.string().min(20).optional(),
  /** Optional recovery redirect (must be allow-listed in CINT Supabase Auth settings). */
  redirectTo: z.string().url().optional(),
});

function bearer(request: Request): string {
  const h = request.headers.get("authorization") || "";
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m?.[1]?.trim() || "";
}

function sessionJson(
  result: Extract<Awaited<ReturnType<typeof cintAuthSignIn>>, { ok: true }>,
  projectId: string,
  extra: Record<string, unknown> = {},
) {
  return Response.json({
    ok: true,
    projectId,
    session: result.client,
    user: {
      id: result.session.userId,
      email: result.session.email,
      displayName: result.session.displayName,
      role: result.session.role,
    },
    ...extra,
  });
}

export async function handleCintAuthGet(request: Request, projectId: string): Promise<Response> {
  if (!isCintAuthConfigured()) {
    return Response.json(
      {
        ok: false,
        code: CINT_AUTH_NOT_CONFIGURED_CODE,
        error: cintAuthNotConfiguredMessage(),
        configured: false,
      },
      { status: 503 },
    );
  }
  const token = bearer(request);
  if (!token) {
    return Response.json(
      { ok: false, code: "cint_auth_required", error: "Bearer token required", configured: true },
      { status: 401 },
    );
  }
  const result = await cintAuthResolveAccessToken(token);
  if (!result.ok) {
    return Response.json(
      { ok: false, code: result.code, error: result.error, configured: true },
      { status: result.status },
    );
  }
  return sessionJson(result, projectId, { configured: true });
}

export async function handleCintAuthPost(request: Request, projectId: string): Promise<Response> {
  const originBlock = assertSameOriginAuthRequest(request);
  if (originBlock) return originBlock;

  const json = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Invalid auth payload (action, email, password)" },
      { status: 400 },
    );
  }

  const { action } = parsed.data;
  const rateId = `${clientIpFromRequest(request)}:${(parsed.data.email || action).toLowerCase()}`;
  try {
    await enforceRateLimitPlaceholder(rateId, `auth:${action}`);
  } catch (error) {
    if (error instanceof Response) return error;
    return new Response("Too many requests", { status: 429 });
  }

  if (action === "logout") {
    await cintAuthSignOut();
    return Response.json({ ok: true, projectId, message: "Signed out" });
  }

  if (action === "refresh") {
    if (!parsed.data.refreshToken) {
      return Response.json({ ok: false, error: "refreshToken required" }, { status: 400 });
    }
    const result = await cintAuthRefresh(parsed.data.refreshToken);
    if (!result.ok) {
      return Response.json(
        { ok: false, code: result.code, error: result.error },
        { status: result.status },
      );
    }
    return sessionJson(result, projectId);
  }

  if (action === "session") {
    return handleCintAuthGet(request, projectId);
  }

  if (action === "forgot") {
    if (!parsed.data.email) {
      return Response.json({ ok: false, error: "Email required" }, { status: 400 });
    }
    const result = await cintAuthRequestPasswordReset({
      email: parsed.data.email,
      redirectTo: parsed.data.redirectTo,
    });
    if (!result.ok) {
      return Response.json(
        { ok: false, code: result.code, error: result.error },
        { status: result.status },
      );
    }
    return Response.json({
      ok: true,
      projectId,
      action: "forgot",
      message: result.message,
    });
  }

  if (!parsed.data.email || !parsed.data.password) {
    return Response.json({ ok: false, error: "Email and password required" }, { status: 400 });
  }

  if (action === "signup") {
    if (parsed.data.password.length < 8) {
      return Response.json(
        { ok: false, error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }
    const result = await cintAuthSignUp({
      email: parsed.data.email,
      password: parsed.data.password,
      displayName: parsed.data.displayName,
    });
    if (!result.ok) {
      return Response.json(
        { ok: false, code: result.code, error: result.error },
        { status: result.status === 202 ? 202 : result.status },
      );
    }
    return sessionJson(result, projectId, { message: "Account created" });
  }

  const result = await cintAuthSignIn(parsed.data.email, parsed.data.password);
  if (!result.ok) {
    return Response.json(
      { ok: false, code: result.code, error: result.error },
      { status: result.status },
    );
  }
  return sessionJson(result, projectId, { message: "Signed in" });
}
