import { describe, expect, it } from "vitest";
import { MemoryAuthAdmin } from "@/infrastructure/auth/memory-auth";
import { InMemoryCustomerRepository, InMemoryNotificationDedup } from "@/infrastructure/memory/supporting-repositories";
import { createMemoryState } from "@/infrastructure/memory/state";
import { MockEmailNotificationProvider } from "@/infrastructure/notifications/email-provider";
import { NotificationService } from "@/domains/notifications/service";
import { CustomerService } from "./service";

describe("CustomerService", () => {
  it("registers a customer and sends a welcome email once", async () => {
    const state = createMemoryState();
    const email = new MockEmailNotificationProvider();
    const service = new CustomerService(
      new InMemoryCustomerRepository(state),
      new MemoryAuthAdmin(),
      new NotificationService([email], new InMemoryNotificationDedup(state)),
    );
    const first = await service.register({
      email: "ama@example.com",
      password: "aaaaaaaa",
      name: "Ama",
      phone: "+46700000000",
    });
    expect(first.customer.id).toBeTruthy();
    expect(first.localToken).toMatch(/^memory-session:/);
    expect(email.sent).toHaveLength(1);
    expect(email.sent[0]?.event).toBe("ACCOUNT_CREATED");
    await expect(
      service.register({
        email: "ama@example.com",
        password: "aaaaaaaa",
        name: "Ama",
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });
});
