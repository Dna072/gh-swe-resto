import "server-only";

import type { Actor, Session } from "@/domains/auth/models";
import { verifySessionToken } from "@/infrastructure/firebase/auth";
import { AppError } from "@/lib/errors";
import { getEnv } from "@/lib/env";
import { isStaffRole } from "@/lib/security/rbac";
import { authAdmin, staffUserRepository } from "@/server/composition";

export function customerTokenFromRequest(request: Request): string {
  const dedicated = request.headers.get("x-customer-token")?.trim() ?? "";
  if (dedicated) {
    return dedicated;
  }
  const header = request.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

export async function optionalSession(request: Request): Promise<Actor | undefined> {
  const token = customerTokenFromRequest(request);
  if (!token) {
    return undefined;
  }
  try {
    return await sessionActorFromToken(token);
  } catch {
    return undefined;
  }
}

export async function requireCustomer(request: Request): Promise<Actor> {
  const token = customerTokenFromRequest(request);
  if (!token) {
    throw new AppError("UNAUTHORIZED", "Sign in is required.");
  }
  return sessionActorFromToken(token);
}

async function sessionActorFromToken(token: string): Promise<Actor> {
  const env = getEnv();
  const localUid = authAdmin.readLocalSessionToken(token);
  if (localUid) {
    if (env.APP_ENV === "production") {
      throw new AppError("UNAUTHORIZED", "Sign in is required.");
    }
    const staff = await staffUserRepository.getByUid(localUid);
    if (staff && !staff.disabled) {
      return {
        uid: staff.uid,
        role: staff.role,
        email: staff.email,
        displayName: staff.displayName,
      };
    }
    return { uid: localUid, role: "CUSTOMER" };
  }

  try {
    const session: Session = await verifySessionToken(token);
    return {
      uid: session.uid,
      role: session.role,
      email: session.email,
      displayName: session.displayName,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("UNAUTHORIZED", "Sign in is required.");
  }
}

export function isStaffActor(actor: Actor): boolean {
  return isStaffRole(actor.role);
}
