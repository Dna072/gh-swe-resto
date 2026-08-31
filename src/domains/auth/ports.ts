import type { Role, StaffRole } from "@/lib/security/rbac";

export type AuthUserRecord = {
  uid: string;
  email: string;
  displayName?: string;
  disabled?: boolean;
};

export type AuthCustomClaims = {
  role?: Role | StaffRole;
  restaurantId?: string;
};

export interface AuthAdminPort {
  createUser(input: {
    email: string;
    password?: string;
    displayName?: string;
  }): Promise<AuthUserRecord>;
  getUserByEmail(email: string): Promise<AuthUserRecord | null>;
  setCustomUserClaims(uid: string, claims: AuthCustomClaims): Promise<void>;
  generatePasswordResetLink(email: string, continueUrl: string): Promise<string>;
  generateEmailVerificationLink(email: string, continueUrl: string): Promise<string>;
  verifyPassword(email: string, password: string): Promise<AuthUserRecord | null>;
  issueLocalSessionToken(uid: string): string | null;
  readLocalSessionToken(token: string): string | null;
}
