import { AppError } from "@/lib/errors";
import { authorizationService } from "@/domains/auth/authorization-service";
import type { Actor, StaffUser } from "@/domains/auth/models";
import type { AuthAdminPort } from "@/domains/auth/ports";
import { isStaffRole, type StaffRole } from "@/lib/security/rbac";
import { newAccessToken } from "@/lib/ids";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logging/logger";
import type { StaffUserRepository } from "./repository";
import type { NotificationService } from "@/domains/notifications/service";
import { staffContinueUrl } from "@/lib/brand/hosts";

export type StaffInviteResult = {
  user: StaffUser;
  inviteUrl: string;
  emailDelivery: "sent" | "mock" | "failed";
  resetLinkReady: boolean;
};

export type StaffListItem = StaffUser & {
  hasSignedIn: boolean;
  pendingSetup: boolean;
};

export class StaffService {
  constructor(
    private readonly staff: StaffUserRepository,
    private readonly auth: AuthAdminPort,
    private readonly notifications: NotificationService,
    private readonly restaurantId: string,
  ) {}

  async list(actor: Actor): Promise<StaffListItem[]> {
    authorizationService.requirePermission(actor, "users:read");
    const users = await this.staff.listByRestaurant(this.restaurantId);
    return Promise.all(
      users.map(async (user) => {
        const authUser = await this.auth.getUserByUid(user.uid);
        const hasSignedIn = Boolean(authUser?.lastSignInAt);
        return {
          ...user,
          hasSignedIn,
          pendingSetup: !user.disabled && !hasSignedIn,
        };
      }),
    );
  }

  async createSetupLink(actor: Actor, uid: string): Promise<{ inviteUrl: string; email: string }> {
    authorizationService.requirePermission(actor, "users:write");
    const user = await this.staff.getByUid(uid);
    if (!user || user.restaurantId !== this.restaurantId) {
      throw new AppError("NOT_FOUND", "That staff member was not found.");
    }
    if (user.disabled) {
      throw new AppError("VALIDATION", "That staff account is disabled.");
    }
    const authUser = await this.auth.getUserByUid(uid);
    if (!authUser) {
      throw new AppError("NOT_FOUND", "That staff account is missing from authentication.");
    }
    if (authUser.lastSignInAt) {
      throw new AppError(
        "VALIDATION",
        "This person has already signed in. Ask them to use password reset from the sign-in page if needed.",
      );
    }
    const continueUrl = staffContinueUrl(user.role);
    try {
      const inviteUrl = await this.auth.generatePasswordResetLink(user.email, continueUrl);
      return { inviteUrl, email: user.email };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.warn("staff_setup_link_failed", {
        uid,
        message: error instanceof Error ? error.message : "unknown",
      });
      throw new AppError("INTERNAL", "Could not create a setup link for this person.");
    }
  }

  async invite(
    actor: Actor,
    input: { email: string; displayName: string; role: StaffRole },
  ): Promise<StaffInviteResult> {
    authorizationService.requirePermission(actor, "users:write");
    if (!isStaffRole(input.role)) {
      throw new AppError("VALIDATION", "Choose a staff role.");
    }
    const email = input.email.trim().toLowerCase();
    if (!email || !input.displayName.trim()) {
      throw new AppError("VALIDATION", "Name and email are required.");
    }

    let record = await this.auth.getUserByEmail(email);
    if (!record) {
      record = await this.auth.createUser({
        email,
        password: newAccessToken(),
        displayName: input.displayName.trim(),
      });
    }
    await this.auth.setCustomUserClaims(record.uid, {
      role: input.role,
      restaurantId: this.restaurantId,
    });

    const now = new Date().toISOString();
    const existing = await this.staff.getByUid(record.uid);
    const user = await this.staff.save({
      uid: record.uid,
      email,
      displayName: input.displayName.trim(),
      role: input.role,
      restaurantId: this.restaurantId,
      disabled: false,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });

    const continueUrl = staffContinueUrl(input.role);
    let inviteUrl = continueUrl;
    let resetLinkReady = false;
    try {
      inviteUrl = await this.auth.generatePasswordResetLink(email, continueUrl);
      resetLinkReady = true;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.warn("staff_invite_reset_link_failed", {
        email,
        message: error instanceof Error ? error.message : "unknown",
      });
      inviteUrl = continueUrl;
    }

    const emailProvider = getEnv().EMAIL_PROVIDER;
    let emailDelivery: StaffInviteResult["emailDelivery"] = emailProvider === "mock" ? "mock" : "sent";
    try {
      await this.notifications.notify({
        event: "STAFF_INVITE",
        to: email,
        idempotencyKey: `staff-invite:${record.uid}:${now.slice(0, 10)}`,
        vars: {
          guestName: user.displayName,
          role: user.role,
          ctaUrl: inviteUrl,
        },
      });
      if (emailProvider === "mock") {
        emailDelivery = "mock";
      }
    } catch (error) {
      emailDelivery = "failed";
      logger.warn("staff_invite_email_failed", {
        email,
        message: error instanceof Error ? error.message : "unknown",
      });
    }
    return { user, inviteUrl, emailDelivery, resetLinkReady };
  }
}
