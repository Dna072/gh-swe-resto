import { AppError } from "@/lib/errors";
import { hasPermission, type Permission, type Role } from "@/lib/security/rbac";
import type { Actor } from "./models";

export class AuthorizationService {
  requireAuthenticated(actor: Actor): asserts actor is Actor & { uid: string } {
    if (!actor.uid) {
      throw new AppError("UNAUTHORIZED", "Sign in is required for this action.");
    }
  }

  requirePermission(actor: Actor, permission: Permission): void {
    this.requireAuthenticated(actor);
    if (!hasPermission(actor.role, permission)) {
      throw new AppError("FORBIDDEN", "You do not have permission to perform this action.", {
        permission,
        role: actor.role,
      });
    }
  }

  requireAnyPermission(actor: Actor, permissions: readonly Permission[]): void {
    this.requireAuthenticated(actor);
    if (!permissions.some((permission) => hasPermission(actor.role, permission))) {
      throw new AppError("FORBIDDEN", "You do not have permission to perform this action.", {
        permissions,
        role: actor.role,
      });
    }
  }

  can(actor: Actor, permission: Permission): boolean {
    return Boolean(actor.uid) && hasPermission(actor.role, permission);
  }

  assertSelfOrStaff(actor: Actor, customerId: string, staffPermission: Permission): void {
    if (actor.uid === customerId && actor.role === "CUSTOMER") {
      return;
    }
    this.requirePermission(actor, staffPermission);
  }

  isStaff(role: Role): boolean {
    return role !== "CUSTOMER";
  }
}

export const authorizationService = new AuthorizationService();
