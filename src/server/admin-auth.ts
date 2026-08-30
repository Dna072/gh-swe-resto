import "server-only";

import { authorizationService } from "@/domains/auth/authorization-service";
import type { Actor } from "@/domains/auth/models";
import { verifySessionToken } from "@/infrastructure/firebase/auth";
import { AppError } from "@/lib/errors";
import { getEnv } from "@/lib/env";
import type { Permission } from "@/lib/security/rbac";

export function adminTokenFromRequest(request: Request): string {
  const dedicated = request.headers.get("x-admin-token")?.trim() ?? "";
  if (dedicated) {
    return dedicated;
  }
  const header = request.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

export async function requireAdmin(request: Request, permission: Permission): Promise<Actor> {
  const token = adminTokenFromRequest(request);
  if (!token) {
    throw new AppError("UNAUTHORIZED", "Admin sign-in is required.");
  }

  const env = getEnv();
  if (env.ADMIN_DEV_TOKEN && token === env.ADMIN_DEV_TOKEN && env.APP_ENV !== "production") {
    const actor: Actor = { uid: "admin-dev", role: "OWNER", email: "admin@localhost" };
    authorizationService.requirePermission(actor, permission);
    return actor;
  }

  try {
    const session = await verifySessionToken(token);
    const actor: Actor = { uid: session.uid, role: session.role, email: session.email };
    authorizationService.requirePermission(actor, permission);
    return actor;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("UNAUTHORIZED", "Admin sign-in is required.");
  }
}
