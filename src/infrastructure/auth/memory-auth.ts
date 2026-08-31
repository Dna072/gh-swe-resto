import { sha256Hex, hashesEqual } from "@/lib/hash";
import { newId } from "@/lib/ids";
import type { AuthAdminPort, AuthCustomClaims, AuthUserRecord } from "@/domains/auth/ports";

const SESSION_PREFIX = "memory-session:";

type MemoryUser = AuthUserRecord & {
  passwordHash?: string;
  claims: AuthCustomClaims;
};

export class MemoryAuthAdmin implements AuthAdminPort {
  private readonly users = new Map<string, MemoryUser>();
  private readonly byEmail = new Map<string, string>();

  async createUser(input: { email: string; password?: string; displayName?: string }): Promise<AuthUserRecord> {
    const email = input.email.trim().toLowerCase();
    if (this.byEmail.has(email)) {
      throw new Error("Email already in use.");
    }
    const uid = newId();
    const user: MemoryUser = {
      uid,
      email,
      displayName: input.displayName,
      passwordHash: input.password ? sha256Hex(input.password) : undefined,
      claims: {},
    };
    this.users.set(uid, user);
    this.byEmail.set(email, uid);
    return { uid, email, displayName: user.displayName };
  }

  async getUserByEmail(email: string): Promise<AuthUserRecord | null> {
    const uid = this.byEmail.get(email.trim().toLowerCase());
    if (!uid) {
      return null;
    }
    const user = this.users.get(uid);
    return user ? { uid: user.uid, email: user.email, displayName: user.displayName, disabled: user.disabled } : null;
  }

  async setCustomUserClaims(uid: string, claims: AuthCustomClaims): Promise<void> {
    const user = this.users.get(uid);
    if (user) {
      user.claims = { ...user.claims, ...claims };
    }
  }

  async generatePasswordResetLink(email: string, continueUrl: string): Promise<string> {
    const url = new URL(continueUrl);
    url.searchParams.set("email", email);
    url.searchParams.set("reset", "1");
    return url.toString();
  }

  async generateEmailVerificationLink(email: string, continueUrl: string): Promise<string> {
    const url = new URL(continueUrl);
    url.searchParams.set("email", email);
    url.searchParams.set("verify", "1");
    return url.toString();
  }

  async verifyPassword(email: string, password: string): Promise<AuthUserRecord | null> {
    const uid = this.byEmail.get(email.trim().toLowerCase());
    if (!uid) {
      return null;
    }
    const user = this.users.get(uid);
    if (!user?.passwordHash || !hashesEqual(user.passwordHash, sha256Hex(password))) {
      return null;
    }
    if (user.disabled) {
      return null;
    }
    return { uid: user.uid, email: user.email, displayName: user.displayName };
  }

  issueLocalSessionToken(uid: string): string {
    return `${SESSION_PREFIX}${uid}`;
  }

  readLocalSessionToken(token: string): string | null {
    if (!token.startsWith(SESSION_PREFIX)) {
      return null;
    }
    return token.slice(SESSION_PREFIX.length) || null;
  }

  claimsFor(uid: string): AuthCustomClaims {
    return this.users.get(uid)?.claims ?? {};
  }
}
