import { describe, expect, it } from "vitest";
import { MockPaymentProvider } from "@/infrastructure/payments/mock-provider";
import { InMemoryWebhookStore } from "@/infrastructure/memory/supporting-repositories";
import { createMemoryState } from "@/infrastructure/memory/state";
import { PaymentService } from "./service";

describe("PaymentService", () => {
  it("rejects unsigned webhooks and ignores duplicates", async () => {
    const provider = new MockPaymentProvider();
    const store = new InMemoryWebhookStore(createMemoryState());
    const service = new PaymentService(provider, store);
    const session = await service.createPayment({
      orderId: "o1",
      amountOre: 17800,
      currency: "SEK",
      customerEmail: "ama@example.com",
      idempotencyKey: "pay-1",
      returnUrl: "http://localhost/order/o1",
    });
    const payload = JSON.stringify({
      eventId: "evt_1",
      providerPaymentId: session.providerPaymentId,
      status: "succeeded",
      type: "payment.succeeded",
    });
    await expect(service.processWebhook(payload, {})).rejects.toThrow(/signature/i);
    const first = await service.processWebhook(payload, { "x-mock-signature": provider.sign(payload) });
    const second = await service.processWebhook(payload, { "x-mock-signature": provider.sign(payload) });
    expect(first.duplicate).toBe(false);
    expect(second.duplicate).toBe(true);
  });
});
