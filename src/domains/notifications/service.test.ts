import { describe, expect, it } from "vitest";
import { MockEmailNotificationProvider } from "@/infrastructure/notifications/email-provider";
import { InMemoryNotificationDedup } from "@/infrastructure/memory/supporting-repositories";
import { createMemoryState } from "@/infrastructure/memory/state";
import { NotificationService } from "./service";

describe("NotificationService", () => {
  it("sends email once per idempotency key", async () => {
    const email = new MockEmailNotificationProvider();
    const service = new NotificationService([email], new InMemoryNotificationDedup(createMemoryState()));
    const payload = {
      event: "ORDER_CONFIRMED" as const,
      to: "ama@example.com",
      orderId: "o1",
      idempotencyKey: "order-o1-confirmed",
    };
    await service.notify(payload);
    await service.notify(payload);
    expect(email.sent).toHaveLength(1);
    expect(email.sent[0]?.html).toContain("Meridian Fusion");
    expect(email.sent[0]?.body).toContain("We have your order");
  });
});
