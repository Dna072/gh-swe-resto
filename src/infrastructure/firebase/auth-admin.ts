import type { UserRecord } from "firebase-admin/auth";
import { getAdminAuth } from "@/infrastructure/firebase/admin";
import type { AuthAdminPort, AuthCustomClaims, AuthUserRecord } from "@/domains/auth/ports";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logging/logger";
import { ensureFirebaseActionApiKey, isFirebaseAuthConfigError } from "./auth-links";

function toAuthUserRecord(user: UserRecord, emailFallback?: string): AuthUserRecord {
  const lastSignIn = user.metadata.lastSignInTime?.trim();
  return {
    uid: user.uid,
    email: user.email ?? emailFallback ?? "",
    displayName: user.displayName,
    disabled: user.disabled,
    lastSignInAt: lastSignIn ? new Date(lastSignIn).toISOString() : null,
  };
}

function rethrowAuth(error: unknown, fallback: string): never {
  if (isFirebaseAuthConfigError(error)) {
    throw new AppError(
      "INTERNAL",
      "Firebase Authentication is not enabled for this project yet. Enable Email/Password in the Firebase console, then try again.",
    );
  }
  if (error instanceof AppError) {
    throw error;
  }
  const message = error instanceof Error ? error.message : fallback;
  throw new AppError("INTERNAL", message || fallback);
}

export class FirebaseAuthAdmin implements AuthAdminPort {
  async createUser(input: { email: string; password?: string; displayName?: string }): Promise<AuthUserRecord> {
    try {
      const user = await getAdminAuth().createUser({
        email: input.email,
        password: input.password,
        displayName: input.displayName,
        emailVerified: false,
      });
      return { uid: user.uid, email: user.email ?? input.email, displayName: user.displayName };
    } catch (error) {
      rethrowAuth(error, "Could not create the staff account.");
    }
  }

  async getUserByEmail(email: string): Promise<AuthUserRecord | null> {
    try {
      const user = await getAdminAuth().getUserByEmail(email);
      return toAuthUserRecord(user, email);
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
      if (code.includes("user-not-found")) {
        return null;
      }
      throw error;
    }
  }

  async getUserByUid(uid: string): Promise<AuthUserRecord | null> {
    try {
      const user = await getAdminAuth().getUser(uid);
      return toAuthUserRecord(user);
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
    try {
      const link = await getAdminAuth().generatePasswordResetLink(email, { url: continueUrl });
      return ensureFirebaseActionApiKey(link);
    } catch (error) {
      if (isFirebaseAuthConfigError(error)) {
        rethrowAuth(error, "Could not create the set-password link.");
      }
      throw error;
    }
  }

  async generateEmailVerificationLink(email: string, continueUrl: string): Promise<string> {
    // Link only — Firebase does not send mail. Branded SES templates send it.
    try {
      const link = await getAdminAuth().generateEmailVerificationLink(email, { url: continueUrl });
      return ensureFirebaseActionApiKey(link);
    } catch (error) {
      if (isFirebaseAuthConfigError(error)) {
        rethrowAuth(error, "Could not create the verification link.");
      }
      throw error;
    }
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
