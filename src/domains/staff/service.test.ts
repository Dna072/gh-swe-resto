import { describe, expect, it } from "vitest";
import { MemoryAuthAdmin } from "@/infrastructure/auth/memory-auth";
import { InMemoryNotificationDedup, InMemoryStaffUserRepository } from "@/infrastructure/memory/supporting-repositories";
import { createMemoryState } from "@/infrastructure/memory/state";
import { MockEmailNotificationProvider } from "@/infrastructure/notifications/email-provider";
import { NotificationService } from "@/domains/notifications/service";
import { StaffService } from "./service";

describe("StaffService", () => {
  it("invites kitchen staff and emails a set-password link", async () => {
    const state = createMemoryState();
    const email = new MockEmailNotificationProvider();
    const service = new StaffService(
      new InMemoryStaffUserRepository(state),
      new MemoryAuthAdmin(),
      new NotificationService([email], new InMemoryNotificationDedup(state)),
      "uppsala-main",
    );
    const result = await service.invite(
      { uid: "owner-1", role: "OWNER", email: "owner@mfcuisine.se" },
      { email: "kitchen@mfcuisine.se", displayName: "Kofi", role: "KITCHEN" },
    );
    expect(result.user.role).toBe("KITCHEN");
    expect(result.inviteUrl).toContain("kitchen");
    expect(email.sent[0]?.event).toBe("STAFF_INVITE");
  });
});
