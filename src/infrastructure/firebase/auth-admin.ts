import { getAdminAuth } from "@/infrastructure/firebase/admin";
import type { AuthAdminPort, AuthCustomClaims, AuthUserRecord } from "@/domains/auth/ports";
import { logger } from "@/lib/logging/logger";

export class FirebaseAuthAdmin implements AuthAdminPort {
  async createUser(input: { email: string; password?: string; displayName?: string }): Promise<AuthUserRecord> {
    const user = await getAdminAuth().createUser({
      email: input.email,
      password: input.password,
      displayName: input.displayName,
      emailVerified: false,
    });
    return { uid: user.uid, email: user.email ?? input.email, displayName: user.displayName };
  }

  async getUserByEmail(email: string): Promise<AuthUserRecord | null> {
    try {
      const user = await getAdminAuth().getUserByEmail(email);
      return { uid: user.uid, email: user.email ?? email, displayName: user.displayName, disabled: user.disabled };
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
      if (code.includes("user-not-found")) {
        return null;
      }
      throw error;
    }
  }

  async setCustomUserClaims(uid: string, claims: AuthCustomClaims): Promise<void> {
    await getAdminAuth().setCustomUserClaims(uid, claims);
  }

  async generatePasswordResetLink(email: string, continueUrl: string): Promise<string> {
    // Link only — Firebase does not send mail. Branded SES templates send it.
    return getAdminAuth().generatePasswordResetLink(email, { url: continueUrl });
  }

  async generateEmailVerificationLink(email: string, continueUrl: string): Promise<string> {
    // Link only — Firebase does not send mail. Branded SES templates send it.
    return getAdminAuth().generateEmailVerificationLink(email, { url: continueUrl });
  }

  async verifyPassword(): Promise<AuthUserRecord | null> {
    return null;
  }

  issueLocalSessionToken(): string | null {
    return null;
  }

  readLocalSessionToken(): string | null {
    return null;
  }
}

export function firebaseAuthAvailable(): boolean {
  try {
    getAdminAuth();
    return true;
  } catch (error) {
    logger.info("firebase_auth_admin_unavailable", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return false;
  }
}
