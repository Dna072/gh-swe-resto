import { AppError } from "@/lib/errors";
import { authorizationService } from "@/domains/auth/authorization-service";
import type { Actor, StaffUser } from "@/domains/auth/models";
import type { AuthAdminPort } from "@/domains/auth/ports";
import { isStaffRole, type StaffRole } from "@/lib/security/rbac";
import { newAccessToken } from "@/lib/ids";
import type { StaffUserRepository } from "./repository";
import type { NotificationService } from "@/domains/notifications/service";
import { staffContinueUrl } from "@/lib/brand/hosts";

export class StaffService {
  constructor(
    private readonly staff: StaffUserRepository,
    private readonly auth: AuthAdminPort,
    private readonly notifications: NotificationService,
    private readonly restaurantId: string,
  ) {}

  async list(actor: Actor): Promise<StaffUser[]> {
    authorizationService.requirePermission(actor, "users:read");
    return this.staff.listByRestaurant(this.restaurantId);
  }

  async invite(
    actor: Actor,
    input: { email: string; displayName: string; role: StaffRole },
  ): Promise<{ user: StaffUser; inviteUrl: string }> {
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
    try {
      inviteUrl = await this.auth.generatePasswordResetLink(email, continueUrl);
    } catch {
      inviteUrl = continueUrl;
    }
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
    return { user, inviteUrl };
  }
}
