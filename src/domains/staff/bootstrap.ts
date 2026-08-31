import { AppError } from "@/lib/errors";
import type { Actor } from "@/domains/auth/models";
import { getEnv } from "@/lib/env";
import { secretsMatch } from "@/lib/security/secret-compare";
import type { AdminBootstrapStore } from "./bootstrap-store";
import type { StaffUserRepository } from "./repository";
import type { StaffService } from "./service";

const BOOTSTRAP_ACTOR: Actor = {
  uid: "admin-bootstrap",
  role: "OWNER",
  email: "bootstrap@localhost",
  displayName: "First-owner setup",
};

export class AdminBootstrapService {
  constructor(
    private readonly staff: StaffService,
    private readonly users: StaffUserRepository,
    private readonly store: AdminBootstrapStore,
    private readonly restaurantId: string,
  ) {}

  async isAvailable(): Promise<boolean> {
    if (!getEnv().ADMIN_DEV_TOKEN) {
      return false;
    }
    const record = await this.store.get();
    if (record?.status === "complete") {
      return false;
    }
    return !(await this.findOwner());
  }

  async createFirstOwner(token: string, input: { email: string; displayName: string }) {
    const expected = getEnv().ADMIN_DEV_TOKEN;
    if (!expected || !secretsMatch(token, expected)) {
      throw new AppError("UNAUTHORIZED", "Admin token is not valid for first-owner setup.");
    }
    const record = await this.store.get();
    const existingOwner = await this.findOwner();
    if (record?.status === "complete" || existingOwner) {
      if (existingOwner && record?.status !== "complete") {
        await this.store.complete({ ownerUid: existingOwner.uid, ownerEmail: existingOwner.email });
      }
      throw new AppError("CONFLICT", "The first owner is already set. Sign in with that account to invite others.");
    }
    const claimed = await this.store.claim(new Date().toISOString());
    if (!claimed) {
      throw new AppError("CONFLICT", "The first owner is already set. Sign in with that account to invite others.");
    }
    try {
      const result = await this.staff.invite(BOOTSTRAP_ACTOR, {
        email: input.email,
        displayName: input.displayName,
        role: "OWNER",
      });
      await this.store.complete({ ownerUid: result.user.uid, ownerEmail: result.user.email });
      return result;
    } catch (error) {
      await this.store.release();
      throw error;
    }
  }

  private async findOwner() {
    const staff = await this.users.listByRestaurant(this.restaurantId);
    return staff.find((user) => user.role === "OWNER" && !user.disabled) ?? null;
  }
}
