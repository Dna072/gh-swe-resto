import { describe, expect, it } from "vitest";
import { MemoryAuthAdmin } from "@/infrastructure/auth/memory-auth";
import { InMemoryNotificationDedup, InMemoryStaffUserRepository } from "@/infrastructure/memory/supporting-repositories";
import { createMemoryState } from "@/infrastructure/memory/state";
import { MockEmailNotificationProvider } from "@/infrastructure/notifications/email-provider";
import { NotificationService } from "@/domains/notifications/service";
import { StaffService } from "./service";

function createService() {
  const state = createMemoryState();
  const email = new MockEmailNotificationProvider();
  const auth = new MemoryAuthAdmin();
  const service = new StaffService(
    new InMemoryStaffUserRepository(state),
    auth,
    new NotificationService([email], new InMemoryNotificationDedup(state)),
    "uppsala-main",
  );
  return { service, email, auth };
}

describe("StaffService", () => {
  it("invites kitchen staff and emails a set-password link", async () => {
    const { service, email } = createService();
    const result = await service.invite(
      { uid: "owner-1", role: "OWNER", email: "owner@mfcuisine.se" },
      { email: "kitchen@mfcuisine.se", displayName: "Kofi", role: "KITCHEN" },
    );
    expect(result.user.role).toBe("KITCHEN");
    expect(result.inviteUrl).toContain("kitchen");
    expect(result.emailDelivery).toBe("mock");
    expect(result.resetLinkReady).toBe(true);
    expect(email.sent[0]?.event).toBe("STAFF_INVITE");
  });

  it("lists pending setup and regenerates a shareable setup link", async () => {
    const { service, auth } = createService();
    const owner = { uid: "owner-1", role: "OWNER" as const, email: "owner@mfcuisine.se" };
    const invited = await service.invite(owner, {
      email: "finance@mfcuisine.se",
      displayName: "Ama",
      role: "FINANCE",
    });
    const listed = await service.list(owner);
    const row = listed.find((entry) => entry.uid === invited.user.uid);
    expect(row?.pendingSetup).toBe(true);
    expect(row?.hasSignedIn).toBe(false);

    const link = await service.createSetupLink(owner, invited.user.uid);
    expect(link.email).toBe("finance@mfcuisine.se");
    expect(link.inviteUrl).toContain("reset=1");

    auth.markSignedIn(invited.user.uid);
    const afterSignIn = await service.list(owner);
    expect(afterSignIn.find((entry) => entry.uid === invited.user.uid)?.pendingSetup).toBe(false);
    await expect(service.createSetupLink(owner, invited.user.uid)).rejects.toMatchObject({
      code: "VALIDATION",
    });
  });
});
