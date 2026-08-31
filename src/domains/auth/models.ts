import type { Role, StaffRole } from "@/lib/security/rbac";
import type { Timestamped } from "@/domains/shared/types";

export type AuthUid = string;

export interface Actor {
  uid?: AuthUid;
  role: Role;
  email?: string;
  displayName?: string;
}

export interface StaffUser extends Timestamped {
  uid: AuthUid;
  email: string;
  displayName: string;
  role: StaffRole;
  restaurantId: string;
  disabled: boolean;
}

export interface Session {
  uid: AuthUid;
  email?: string;
  emailVerified: boolean;
  role: Role;
  restaurantId?: string;
  displayName?: string;
}

export const ANONYMOUS_CUSTOMER: Actor = { role: "CUSTOMER" };
