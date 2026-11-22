/**
 * Code Intelligence Admin — IdP member directory + role promotion (org.admin).
 * Uses CINT service role only. Never Replica host Auth.
 */

import {
  CINT_AUTH_ROLES,
  isCintAuthRole,
  normalizeCintAuthRole,
  type CintAuthRole,
} from "@/lib/cint/cintAuthRoles";
import {
  readCintSupabaseServiceRoleKey,
  resolveCintSupabaseServiceRole,
} from "@/lib/cint/cintSupabaseConfig";

export type CintAdminMember = {
  userId: string;
  email: string;
  displayName: string;
  role: CintAuthRole;
  updatedAt: string | null;
};

export function isCintAdminConfigured(): boolean {
  return Boolean(readCintSupabaseServiceRoleKey());
}

export async function countCintAdmins(): Promise<number> {
  if (!isCintAdminConfigured()) return 0;
  try {
    const admin = resolveCintSupabaseServiceRole();
    const { count, error } = await admin
      .from("cint_profiles")
      .select("user_id", { count: "exact", head: true })
      .eq("role", "Admin");
    if (error) return 0;
    return typeof count === "number" ? count : 0;
  } catch {
    return 0;
  }
}

export async function listCintAdminMembers(): Promise<
  | { ok: true; members: CintAdminMember[] }
  | { ok: false; code: string; error: string }
> {
  if (!isCintAdminConfigured()) {
    return {
      ok: false,
      code: "cint_admin_not_configured",
      error: "CINT_SUPABASE_SERVICE_ROLE_KEY required for Admin member directory.",
    };
  }
  try {
    const admin = resolveCintSupabaseServiceRole();
    const { data, error } = await admin
      .from("cint_profiles")
      .select("user_id,email,display_name,role,updated_at")
      .order("email", { ascending: true })
      .limit(200);
    if (error) {
      return { ok: false, code: "cint_admin_list_failed", error: error.message };
    }
    const members: CintAdminMember[] = (data || []).map((row) => {
      const r = row as Record<string, unknown>;
      return {
        userId: String(r.user_id || ""),
        email: String(r.email || ""),
        displayName: String(r.display_name || r.email || "Engineer"),
        role: normalizeCintAuthRole(r.role),
        updatedAt: typeof r.updated_at === "string" ? r.updated_at : null,
      };
    });
    return { ok: true, members };
  } catch (error) {
    return {
      ok: false,
      code: "cint_admin_list_failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function setCintMemberRole(input: {
  userId: string;
  role: CintAuthRole;
  actorUserId: string;
}): Promise<{ ok: true; member: CintAdminMember } | { ok: false; code: string; error: string }> {
  if (!isCintAdminConfigured()) {
    return {
      ok: false,
      code: "cint_admin_not_configured",
      error: "CINT_SUPABASE_SERVICE_ROLE_KEY required to change roles.",
    };
  }
  if (!isCintAuthRole(input.role)) {
    return { ok: false, code: "cint_admin_invalid_role", error: "Invalid role" };
  }
  const userId = input.userId.trim();
  if (!userId) {
    return { ok: false, code: "cint_admin_invalid_user", error: "userId required" };
  }

  // Prevent demoting the last Admin (including self).
  if (input.role !== "Admin") {
    const admins = await countCintAdmins();
    const listed = await listCintAdminMembers();
    const target = listed.ok ? listed.members.find((m) => m.userId === userId) : null;
    if (target?.role === "Admin" && admins <= 1) {
      return {
        ok: false,
        code: "cint_admin_last_admin",
        error: "Cannot demote the last Admin. Promote another Admin first.",
      };
    }
  }

  try {
    const admin = resolveCintSupabaseServiceRole();
    const { data: existing, error: readErr } = await admin
      .from("cint_profiles")
      .select("user_id,email,display_name,role,updated_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (readErr || !existing) {
      return {
        ok: false,
        code: "cint_admin_user_not_found",
        error: readErr?.message || "Member profile not found",
      };
    }
    const email = String((existing as { email?: string }).email || "");
    const displayName = String(
      (existing as { display_name?: string }).display_name || email || "Engineer",
    );
    const now = new Date().toISOString();
    const { error: upErr } = await admin.from("cint_profiles").upsert(
      {
        user_id: userId,
        email,
        display_name: displayName,
        role: input.role,
        updated_at: now,
      },
      { onConflict: "user_id" },
    );
    if (upErr) {
      return { ok: false, code: "cint_admin_update_failed", error: upErr.message };
    }
    await admin.auth.admin.updateUserById(userId, {
      app_metadata: { cint_role: input.role },
    });
    return {
      ok: true,
      member: {
        userId,
        email,
        displayName,
        role: input.role,
        updatedAt: now,
      },
    };
  } catch (error) {
    return {
      ok: false,
      code: "cint_admin_update_failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function bootstrapFirstCintAdmin(input: {
  userId: string;
  email: string;
  displayName: string;
}): Promise<
  | { ok: true; role: "Admin"; created: boolean }
  | { ok: false; code: string; error: string }
> {
  if (!isCintAdminConfigured()) {
    return {
      ok: false,
      code: "cint_admin_not_configured",
      error: "CINT_SUPABASE_SERVICE_ROLE_KEY required to bootstrap Admin.",
    };
  }
  const admins = await countCintAdmins();
  if (admins > 0) {
    return {
      ok: false,
      code: "cint_admin_already_exists",
      error: "An Admin already exists. Ask an Admin to promote your role.",
    };
  }
  const result = await setCintMemberRole({
    userId: input.userId,
    role: "Admin",
    actorUserId: input.userId,
  });
  if (!result.ok) {
    // Profile may not exist yet — upsert then set.
    try {
      const admin = resolveCintSupabaseServiceRole();
      const now = new Date().toISOString();
      await admin.from("cint_profiles").upsert(
        {
          user_id: input.userId,
          email: input.email,
          display_name: input.displayName,
          role: "Admin",
          updated_at: now,
        },
        { onConflict: "user_id" },
      );
      await admin.auth.admin.updateUserById(input.userId, {
        app_metadata: { cint_role: "Admin" },
      });
      return { ok: true, role: "Admin", created: true };
    } catch (error) {
      return {
        ok: false,
        code: "cint_admin_bootstrap_failed",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  return { ok: true, role: "Admin", created: true };
}

export function cintAdminAssignableRoles(): readonly CintAuthRole[] {
  return CINT_AUTH_ROLES;
}
