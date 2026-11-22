/**
 * Code Intelligence Admin API — member directory + role promote (org.admin).
 * Bootstrap: first IdP user may claim Admin when none exist.
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  bootstrapFirstCintAdmin,
  cintAdminAssignableRoles,
  countCintAdmins,
  isCintAdminConfigured,
  listCintAdminMembers,
  setCintMemberRole,
} from "@/lib/cint/cintAuthAdminService";
import { isCintAuthRole } from "@/lib/cint/cintAuthRoles";
import {
  cintAuthResolveAccessToken,
  isCintAuthConfigured,
} from "@/lib/cint/cintAuthService";
import { requireCintProductAuth } from "@/lib/cint/requireCintProductAuth";
import { withSentryApiRoute } from "@/lib/monitoring/withSentryApiRoute";
import {
  assertSameOriginAuthRequest,
  clientIpFromRequest,
} from "@/lib/auth/sameOriginAuthRequest";
import { enforceRateLimitPlaceholder } from "@/serverFns/security.server";

const PATH = "/api/projects/$projectId/cint/admin";

const postSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("set_role"),
    userId: z.string().uuid(),
    role: z.string().min(1),
  }),
  z.object({
    action: z.literal("bootstrap"),
  }),
]);

function bearer(request: Request): string {
  const h = request.headers.get("authorization") || "";
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m?.[1]?.trim() || "";
}

export const Route = createFileRoute("/api/projects/$projectId/cint/admin")({
  server: {
    handlers: {
      GET: withSentryApiRoute(PATH, async ({ request, params }) => {
        const projectId = params?.projectId?.trim();
        if (!projectId) {
          return Response.json({ ok: false, error: "missing_project" }, { status: 400 });
        }
        await enforceRateLimitPlaceholder(
          `cint-admin-get:${clientIpFromRequest(request)}:${projectId}`,
          "project:cint",
        );

        const adminCount = await countCintAdmins();
        const canBootstrap = isCintAdminConfigured() && adminCount === 0;

        // Directory read: any IdP role with workspace.read. Promote stays POST + org.admin.
        const gate = await requireCintProductAuth(request, "workspace.read");
        if (!gate.ok) {
          // Soft response when no Admin yet — UI can show Claim without listing members.
          if (canBootstrap && isCintAuthConfigured()) {
            return Response.json({
              ok: true,
              projectId,
              members: [],
              roles: cintAdminAssignableRoles(),
              canBootstrap: true,
              callerRole: null,
              configured: isCintAdminConfigured(),
            });
          }
          return gate.response;
        }

        const listed = await listCintAdminMembers();
        if (!listed.ok) {
          return Response.json(
            { ok: false, code: listed.code, error: listed.error },
            { status: 502 },
          );
        }
        return Response.json({
          ok: true,
          projectId,
          members: listed.members,
          roles: cintAdminAssignableRoles(),
          canBootstrap,
          callerRole: gate.session.role,
          configured: true,
        });
      }),

      POST: withSentryApiRoute(PATH, async ({ request, params }) => {
        const originBlock = assertSameOriginAuthRequest(request);
        if (originBlock) return originBlock;

        const projectId = params?.projectId?.trim();
        if (!projectId) {
          return Response.json({ ok: false, error: "missing_project" }, { status: 400 });
        }

        const json = await request.json().catch(() => ({}));
        const parsed = postSchema.safeParse(json);
        if (!parsed.success) {
          return Response.json(
            { ok: false, error: "Invalid admin payload (action set_role|bootstrap)" },
            { status: 400 },
          );
        }

        await enforceRateLimitPlaceholder(
          `cint-admin-post:${clientIpFromRequest(request)}:${projectId}:${parsed.data.action}`,
          "auth:admin",
        );

        if (parsed.data.action === "bootstrap") {
          const token = bearer(request);
          if (!token) {
            return Response.json(
              { ok: false, code: "cint_auth_required", error: "Bearer token required" },
              { status: 401 },
            );
          }
          const resolved = await cintAuthResolveAccessToken(token);
          if (!resolved.ok) {
            return Response.json(
              { ok: false, code: resolved.code, error: resolved.error },
              { status: resolved.status },
            );
          }
          if (resolved.session.authMode !== "idp" || resolved.session.demo) {
            return Response.json(
              {
                ok: false,
                code: "cint_auth_demo_rejected",
                error: "Demo sessions cannot claim Admin. Sign in with IdP.",
              },
              { status: 403 },
            );
          }
          const boot = await bootstrapFirstCintAdmin({
            userId: resolved.session.userId,
            email: resolved.session.email,
            displayName: resolved.session.displayName,
          });
          if (!boot.ok) {
            return Response.json(
              { ok: false, code: boot.code, error: boot.error },
              { status: boot.code === "cint_admin_already_exists" ? 409 : 400 },
            );
          }
          return Response.json({
            ok: true,
            projectId,
            action: "bootstrap",
            role: "Admin",
            message: "You are now the workspace Admin. Sign out and sign in again to refresh the session role.",
          });
        }

        const gate = await requireCintProductAuth(request, "org.admin");
        if (!gate.ok) return gate.response;

        if (!isCintAuthRole(parsed.data.role)) {
          return Response.json(
            { ok: false, error: "Invalid role", roles: cintAdminAssignableRoles() },
            { status: 400 },
          );
        }

        const updated = await setCintMemberRole({
          userId: parsed.data.userId,
          role: parsed.data.role,
          actorUserId: gate.session.userId,
        });
        if (!updated.ok) {
          return Response.json(
            { ok: false, code: updated.code, error: updated.error },
            { status: updated.code === "cint_admin_last_admin" ? 409 : 400 },
          );
        }
        return Response.json({
          ok: true,
          projectId,
          action: "set_role",
          member: updated.member,
          message:
            updated.member.userId === gate.session.userId
              ? "Your role changed — sign out and sign in again to refresh the session."
              : "Role updated. Member must sign out/in to refresh their session.",
        });
      }),
    },
  },
});
