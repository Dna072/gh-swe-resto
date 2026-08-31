import { describe, expect, it } from "vitest";
import { MemoryAuthAdmin } from "@/infrastructure/auth/memory-auth";
import { InMemoryNotificationDedup, InMemoryStaffUserRepository } from "@/infrastructure/memory/supporting-repositories";
import { InMemoryAdminBootstrapStore } from "@/infrastructure/memory/admin-bootstrap";
import { createMemoryState } from "@/infrastructure/memory/state";
import { MockEmailNotificationProvider } from "@/infrastructure/notifications/email-provider";
import { NotificationService } from "@/domains/notifications/service";
import { resetEnvCache } from "@/lib/env";
import { StaffService } from "./service";
import { AdminBootstrapService } from "./bootstrap";

function makeService() {
  const state = createMemoryState();
  const email = new MockEmailNotificationProvider();
  const users = new InMemoryStaffUserRepository(state);
  const staff = new StaffService(
    users,
    new MemoryAuthAdmin(),
    new NotificationService([email], new InMemoryNotificationDedup(state)),
    "uppsala-main",
  );
  const bootstrap = new AdminBootstrapService(
    staff,
    users,
    new InMemoryAdminBootstrapStore("uppsala-main"),
    "uppsala-main",
  );
  return { bootstrap, email, users };
}

describe("AdminBootstrapService", () => {
  it("creates the first owner once with the admin token", async () => {
    resetEnvCache();
    const { bootstrap, email, users } = makeService();
    expect(await bootstrap.isAvailable()).toBe(true);
    const result = await bootstrap.createFirstOwner("dev-admin-token", {
      email: "owner@mfcuisine.se",
      displayName: "Ama",
    });
    expect(result.user.role).toBe("OWNER");
    expect(email.sent[0]?.event).toBe("STAFF_INVITE");
    expect(await users.getByEmail("owner@mfcuisine.se")).toMatchObject({ role: "OWNER" });
    expect(await bootstrap.isAvailable()).toBe(false);
    await expect(
      bootstrap.createFirstOwner("dev-admin-token", {
        email: "other@mfcuisine.se",
        displayName: "Kofi",
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("rejects a wrong admin token", async () => {
    resetEnvCache();
    const { bootstrap } = makeService();
    await expect(
      bootstrap.createFirstOwner("not-the-token", {
        email: "owner@mfcuisine.se",
        displayName: "Ama",
      }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
