import type { Session } from "@/domains/auth/models";
import { isRole } from "@/lib/security/rbac";
import { getAdminAuth } from "./admin";

export async function verifySessionToken(idToken: string): Promise<Session> {
  const decoded = await getAdminAuth().verifyIdToken(idToken);
  const roleClaim = typeof decoded.role === "string" && isRole(decoded.role) ? decoded.role : "CUSTOMER";
  return {
    uid: decoded.uid,
    email: decoded.email,
    emailVerified: Boolean(decoded.email_verified),
    role: roleClaim,
    restaurantId: typeof decoded.restaurantId === "string" ? decoded.restaurantId : undefined,
  };
}
