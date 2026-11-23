/**
 * Code Intelligence IdP service — CINT Supabase Auth only (not Replica host Auth).
 */

import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import {
  CINT_DEFAULT_SIGNUP_ROLE,
  normalizeCintAuthRole,
  type CintAuthRole,
} from "@/lib/cint/cintAuthRoles";
import { countCintAdmins } from "@/lib/cint/cintAuthAdminService";
import {
  buildCintIdpSession,
  CINT_AUTH_NOT_CONFIGURED_CODE,
  type CintProductSession,
  toCintSessionClientPayload,
} from "@/lib/cint/cintAuthSession";
import {
  cintSupabaseNotConfiguredMessage,
  isCintSupabaseConfigured,
  readCintSupabasePublishableKey,
  readCintSupabaseServiceRoleKey,
  readCintSupabaseUrl,
  resolveCintSupabaseServiceRole,
} from "@/lib/cint/cintSupabaseConfig";

export { CINT_AUTH_NOT_CONFIGURED_CODE };

export type CintAuthResult =
  | { ok: true; session: CintProductSession; client: ReturnType<typeof toCintSessionClientPayload> }
  | { ok: false; code: string; error: string; status: number };

function cintAuthClient(): SupabaseClient | null {
  const url = readCintSupabaseUrl();
  const anon = readCintSupabasePublishableKey();
  if (!url || !anon) return null;
  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function isCintAuthConfigured(): boolean {
  return Boolean(readCintSupabaseUrl() && readCintSupabasePublishableKey());
}

export function cintAuthNotConfiguredMessage(): string {
  if (!isCintSupabaseConfigured() && !isCintAuthConfigured()) {
    return cintSupabaseNotConfiguredMessage();
  }
  if (readCintSupabaseUrl() && !readCintSupabasePublishableKey()) {
    return "Code Intelligence Auth needs CINT_SUPABASE_ANON_KEY (or CINT_SUPABASE_PUBLISHABLE_KEY) for sign-in.";
  }
  return "Code Intelligence Auth is not configured (set CINT_SUPABASE_URL + CINT_SUPABASE_ANON_KEY).";
}

type ProfileRow = {
  user_id: string;
  email: string | null;
  display_name: string | null;
  role: string | null;
};

async function readProfile(userId: string): Promise<ProfileRow | null> {
  if (!readCintSupabaseServiceRoleKey()) return null;
  try {
    const admin = resolveCintSupabaseServiceRole();
    const query = admin
      .from("cint_profiles")
      .select("user_id,email,display_name,role")
      .eq("user_id", userId)
      .maybeSingle();
    const raced = await Promise.race([
      query,
      new Promise<{ data: null; error: { message: string } }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: { message: "profile_timeout" } }), 2500),
      ),
    ]);
    if (raced.error || !raced.data) return null;
    return raced.data as ProfileRow;
  } catch {
    return null;
  }
}

async function upsertProfile(input: {
  userId: string;
  email: string;
  displayName: string;
  role: CintAuthRole;
}): Promise<void> {
  if (!readCintSupabaseServiceRoleKey()) return;
  try {
    const admin = resolveCintSupabaseServiceRole();
    // Bound profile writes — never let Auth Admin hang the login/signup response.
    const work = (async () => {
      await admin.from("cint_profiles").upsert(
        {
          user_id: input.userId,
          email: input.email,
          display_name: input.displayName,
          role: input.role,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
      // Prefer app_metadata for authorization claims (user_metadata is user-editable).
      await admin.auth.admin.updateUserById(input.userId, {
        app_metadata: { cint_role: input.role },
      });
    })();
    await Promise.race([
      work,
      new Promise<void>((resolve) => setTimeout(resolve, 2500)),
    ]);
  } catch {
    // Profile table may not be migrated yet — session still carries role from signup path.
  }
}

function roleFromUser(user: User, profile: ProfileRow | null): CintAuthRole {
  if (profile?.role) return normalizeCintAuthRole(profile.role);
  const appRole = (user.app_metadata as Record<string, unknown> | undefined)?.cint_role;
  if (appRole) return normalizeCintAuthRole(appRole);
  return CINT_DEFAULT_SIGNUP_ROLE;
}

/**
 * Empty org → Admin so Connect / Sync / Analyze are not locked behind Viewer.
 * Persists when service role is present; still returns Admin for this request if not.
 */
async function resolveEffectiveOperatorRole(input: {
  user: User;
  profile: ProfileRow | null;
  email: string;
  displayName: string;
}): Promise<CintAuthRole> {
  const current = roleFromUser(input.user, input.profile);
  if (current !== "Viewer") return current;
  const adminCount = await countCintAdmins();
  if (adminCount > 0) return current;
  await upsertProfile({
    userId: input.user.id,
    email: input.email,
    displayName: input.displayName,
    role: "Admin",
  });
  return "Admin";
}

/** Supabase `expires_at` is usually Unix seconds; accept ms if already absolute. */
export function normalizeCintExpiresAtMs(
  expiresAt: number | null | undefined,
  at = Date.now(),
): number | undefined {
  if (typeof expiresAt !== "number" || !Number.isFinite(expiresAt)) return undefined;
  const ms = expiresAt < 1e12 ? expiresAt * 1000 : expiresAt;
  return ms > at ? ms : undefined;
}

function sessionFromAuth(input: {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number | null;
  profile: ProfileRow | null;
  roleOverride?: CintAuthRole;
}): CintProductSession {
  const email = (input.user.email || input.profile?.email || "").trim().toLowerCase();
  const displayName =
    input.profile?.display_name ||
    (typeof input.user.user_metadata?.full_name === "string"
      ? input.user.user_metadata.full_name
      : "") ||
    email.split("@")[0] ||
    "Engineer";
  const role = input.roleOverride || roleFromUser(input.user, input.profile);
  return buildCintIdpSession({
    userId: input.user.id,
    email,
    displayName,
    role,
    accessToken: input.accessToken,
    refreshToken: input.refreshToken,
    expiresAt: normalizeCintExpiresAtMs(input.expiresAt),
  });
}

function ok(session: CintProductSession): CintAuthResult {
  return { ok: true, session, client: toCintSessionClientPayload(session) };
}

function fail(code: string, error: string, status: number): CintAuthResult {
  return { ok: false, code, error, status };
}

async function withAuthTimeout<T>(promise: PromiseLike<T>, ms = 8000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("cint_auth_provider_timeout")),
          ms,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function cintAuthSignIn(email: string, password: string): Promise<CintAuthResult> {
  const client = cintAuthClient();
  if (!client) {
    return fail(CINT_AUTH_NOT_CONFIGURED_CODE, cintAuthNotConfiguredMessage(), 503);
  }
  let data: Awaited<ReturnType<typeof client.auth.signInWithPassword>>["data"];
  let error: Awaited<ReturnType<typeof client.auth.signInWithPassword>>["error"];
  try {
    const result = await withAuthTimeout(
      client.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      }),
    );
    data = result.data;
    error = result.error;
  } catch {
    return fail(
      "cint_auth_provider_timeout",
      "CINT Auth provider timed out — verify CINT_SUPABASE_URL + ANON key and Auth is enabled.",
      504,
    );
  }
  if (error) return fail("cint_auth_invalid", error.message, 401);
  const session = data.session;
  // supabase-js occasionally returns user only on session.user
  const user = data.user ?? session?.user ?? null;
  const access = session?.access_token?.trim() || "";
  const refresh = session?.refresh_token?.trim() || "";
  if (!session || !user?.id || access.length < 20) {
    const missing = [
      !session ? "session" : null,
      !user?.id ? "user id" : null,
      access.length < 20 ? "access token" : null,
    ].filter(Boolean);
    return fail(
      "cint_auth_incomplete_session",
      `Sign-in succeeded but the IdP session was incomplete (missing ${missing.join(", ") || "fields"}).`,
      502,
    );
  }
  // Refresh is preferred but not required to enter the product — access-only still authenticates.
  const profile = await readProfile(user.id);
  const resolvedEmail = (user.email || profile?.email || email || "").trim().toLowerCase();
  const displayName =
    profile?.display_name ||
    (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "") ||
    resolvedEmail.split("@")[0] ||
    "Engineer";
  const role = await resolveEffectiveOperatorRole({
    user,
    profile,
    email: resolvedEmail,
    displayName,
  });
  const product = sessionFromAuth({
    user,
    accessToken: access,
    refreshToken: refresh.length >= 20 ? refresh : undefined,
    expiresAt: session.expires_at,
    profile,
    roleOverride: role,
  });
  await upsertProfile({
    userId: product.userId,
    email: product.email,
    displayName: product.displayName,
    role: product.role,
  });
  return ok(product);
}

export async function cintAuthSignUp(input: {
  email: string;
  password: string;
  displayName?: string;
}): Promise<CintAuthResult> {
  const client = cintAuthClient();
  if (!client) {
    return fail(CINT_AUTH_NOT_CONFIGURED_CODE, cintAuthNotConfiguredMessage(), 503);
  }
  const email = input.email.trim().toLowerCase();
  const displayName = (input.displayName || email.split("@")[0] || "Engineer").trim();
  let data: Awaited<ReturnType<typeof client.auth.signUp>>["data"];
  let error: Awaited<ReturnType<typeof client.auth.signUp>>["error"];
  try {
    const result = await withAuthTimeout(
      client.auth.signUp({
        email,
        password: input.password,
        options: { data: { full_name: displayName } },
      }),
    );
    data = result.data;
    error = result.error;
  } catch {
    return fail(
      "cint_auth_provider_timeout",
      "CINT Auth provider timed out — verify CINT_SUPABASE_URL + ANON key and Auth is enabled.",
      504,
    );
  }
  if (error) {
    const msg = error.message || "Signup failed";
    if (/rate limit|too many/i.test(msg)) {
      return fail(
        "cint_auth_email_rate_limited",
        "Email rate limit exceeded — wait a few minutes, or Sign in / Forgot password if this account already exists.",
        429,
      );
    }
    return fail("cint_auth_signup_failed", msg, 400);
  }
  const session = data.session;
  const user = data.user;
  if (!user) {
    return fail(
      "cint_auth_confirm_required",
      "Account created — confirm your email before signing in (IdP email confirmation enabled).",
      202,
    );
  }
  // First IdP user in an empty org becomes Admin; later signups stay Viewer until promoted.
  const adminCount = await countCintAdmins();
  const role = adminCount === 0 ? ("Admin" as CintAuthRole) : CINT_DEFAULT_SIGNUP_ROLE;
  await upsertProfile({ userId: user.id, email, displayName, role });

  const access = session?.access_token?.trim() || "";
  const refresh = session?.refresh_token?.trim() || "";
  if (!session || access.length < 20 || refresh.length < 20) {
    return fail(
      "cint_auth_confirm_required",
      "Account created — confirm your email, then sign in.",
      202,
    );
  }
  const profile = await readProfile(user.id);
  return ok(
    sessionFromAuth({
      user,
      accessToken: access,
      refreshToken: refresh,
      expiresAt: session.expires_at,
      profile,
      roleOverride: role,
    }),
  );
}

export async function cintAuthRefresh(refreshToken: string): Promise<CintAuthResult> {
  const client = cintAuthClient();
  if (!client) {
    return fail(CINT_AUTH_NOT_CONFIGURED_CODE, cintAuthNotConfiguredMessage(), 503);
  }
  const token = refreshToken.trim();
  if (token.length < 20) return fail("cint_auth_invalid", "Missing refresh token", 401);
  const { data, error } = await client.auth.refreshSession({ refresh_token: token });
  if (error) return fail("cint_auth_refresh_failed", error.message, 401);
  const session = data.session;
  const user = data.user;
  const access = session?.access_token?.trim() || "";
  const refresh = session?.refresh_token?.trim() || "";
  if (!session || !user || access.length < 20 || refresh.length < 20) {
    return fail("cint_auth_incomplete_session", "Refresh returned an incomplete session.", 502);
  }
  const profile = await readProfile(user.id);
  return ok(
    sessionFromAuth({
      user,
      accessToken: access,
      refreshToken: refresh,
      expiresAt: session.expires_at,
      profile,
    }),
  );
}

export async function cintAuthResolveAccessToken(accessToken: string): Promise<CintAuthResult> {
  const client = cintAuthClient();
  if (!client) {
    return fail(CINT_AUTH_NOT_CONFIGURED_CODE, cintAuthNotConfiguredMessage(), 503);
  }
  const token = accessToken.trim();
  if (token.length < 20) return fail("cint_auth_invalid", "Missing access token", 401);
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return fail("cint_auth_invalid", error?.message || "Invalid session", 401);
  const profile = await readProfile(data.user.id);
  const email = (data.user.email || profile?.email || "").trim().toLowerCase();
  const displayName =
    profile?.display_name ||
    (typeof data.user.user_metadata?.full_name === "string"
      ? data.user.user_metadata.full_name
      : "") ||
    email.split("@")[0] ||
    "Engineer";
  const role = await resolveEffectiveOperatorRole({
    user: data.user,
    profile,
    email,
    displayName,
  });
  const product = buildCintIdpSession({
    userId: data.user.id,
    email,
    displayName,
    role,
    accessToken: token,
    expiresAt: Date.now() + 1000 * 60 * 60,
  });
  return ok(product);
}

export async function cintAuthSignOut(): Promise<{ ok: true }> {
  // Client owns clearing cint.session.v1. Server path is reserved for future token revoke.
  return { ok: true };
}

export type CintAuthForgotResult =
  | { ok: true; message: string }
  | { ok: false; code: string; error: string; status: number };

/**
 * Request IdP password-reset email (Supabase Auth).
 * Does not reveal whether the email exists.
 */
export async function cintAuthRequestPasswordReset(input: {
  email: string;
  redirectTo?: string;
}): Promise<CintAuthForgotResult> {
  const client = cintAuthClient();
  if (!client) {
    return {
      ok: false,
      code: CINT_AUTH_NOT_CONFIGURED_CODE,
      error: cintAuthNotConfiguredMessage(),
      status: 503,
    };
  }
  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { ok: false, code: "cint_auth_invalid", error: "Valid email required", status: 400 };
  }
  const redirectTo = input.redirectTo?.trim() || undefined;
  try {
    const { error } = await withAuthTimeout(
      client.auth.resetPasswordForEmail(email, redirectTo ? { redirectTo } : undefined),
    );
    if (error) {
      return {
        ok: false,
        code: "cint_auth_reset_failed",
        error: error.message,
        status: 400,
      };
    }
  } catch {
    return {
      ok: false,
      code: "cint_auth_provider_timeout",
      error:
        "CINT Auth provider timed out — verify CINT_SUPABASE_URL + ANON key and Auth email is enabled.",
      status: 504,
    };
  }
  return {
    ok: true,
    message:
      "If that email is registered, a reset link is on the way. Check inbox (and spam), then sign in with the new password.",
  };
}
