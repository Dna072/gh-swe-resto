import { describe, expect, it } from "vitest";
import { quoteDelivery, resolveAdvanceDeliverySlot } from "@/server/checkout";
import { orderService, recallGuestToken, rememberGuestToken, restaurantSettings } from "@/server/composition";
import { toPublicOrder } from "@/server/public-order";

const jollofLine = {
  menuItemId: "jollof",
  quantity: 1,
  modifiers: [
    { groupId: "protein", optionId: "chicken", quantity: 1 },
    { groupId: "heat", optionId: "hot-shito", quantity: 1 },
  ],
};

describe("Phase 3 checkout", () => {
  it("quotes delivery fees from seeded zones, not a hardcoded UI table", async () => {
    const centrum = await quoteDelivery({
      line1: "Svartbäcksgatan 1",
      postalCode: "75322",
      city: "Uppsala",
      country: "SE",
    });
    expect(centrum.zoneName).toBe("Uppsala centrum");
    expect(centrum.feeOre).toBe(4900);

    const south = await quoteDelivery({
      line1: "Testvägen 1",
      postalCode: "75643",
      city: "Uppsala",
      country: "SE",
    });
    expect(south.zoneName).toBe("Södra Uppsala");
    expect(south.feeOre).toBe(5900);
  });

  it("creates a guest delivery order and hides the access-token hash", async () => {
    const quote = await quoteDelivery({
      line1: "Kungsängsgatan 2",
      postalCode: "75322",
      city: "Uppsala",
      country: "SE",
    });
    const created = await orderService.create({
      restaurantId: "uppsala-main",
      lines: [jollofLine],
      customer: {
        name: "Ama Mensah",
        email: "ama@example.com",
        phone: "+46700000000",
        guestSessionId: "guest-phase3",
      },
      deliveryAddress: {
        line1: "Kungsängsgatan 2",
        postalCode: "75322",
        city: "Uppsala",
        country: "SE",
      },
      deliveryFeeOre: quote.feeOre,
      guestSessionId: "guest-phase3",
      idempotencyKey: "phase3-delivery-1",
      fulfillment: "DELIVERY",
      deliveryProvider: quote.provider,
      deliveryQuoteId: quote.quoteId,
      estimatedDeliveryTime: quote.deliveryEstimate,
      at: new Date("2026-08-31T12:00:00.000Z"),
    });
    expect(created.order.publicOrderNumber).toMatch(/^GH\d+$/);
    expect(created.order.deliveryFeeOre).toBe(4900);
    expect(created.order.totalOre).toBe(12900 + 4900);
    expect(created.accessToken.length).toBeGreaterThan(20);
    const publicOrder = toPublicOrder(created.order);
    expect(publicOrder).not.toHaveProperty("accessTokenHash");
    expect(publicOrder.paymentDeferred).toBe(false);
    expect(publicOrder.payable).toBe(true);
    expect(publicOrder.cancellable).toBe(true);
    expect(publicOrder.fulfillment).toBe("DELIVERY");
    rememberGuestToken(created.order.id, "phase3-delivery-1", created.accessToken);
    expect(recallGuestToken(created.order.id, "phase3-delivery-1")).toBe(created.accessToken);
    const loaded = await orderService.getForCustomer(created.order.id, created.accessToken);
    expect(loaded.id).toBe(created.order.id);
  });

  it("resolves a 24-hour advance slot inside kitchen hours", async () => {
    const now = new Date("2026-08-30T10:00:00.000Z");
    expect(resolveAdvanceDeliverySlot("2026-08-31T10:00:00.000Z", now)).toBe("2026-08-31T10:00:00.000Z");
    expect(() => resolveAdvanceDeliverySlot("2026-08-30T14:00:00.000Z", now)).toThrow(/24 hours/i);
  });

  it("creates a pickup order with no delivery fee", async () => {
    const pickup = restaurantSettings().pickup;
    const created = await orderService.create({
      restaurantId: "uppsala-main",
      lines: [jollofLine],
      customer: {
        name: "Jonas Lind",
        email: "jonas@example.com",
        phone: "+46701111111",
        guestSessionId: "guest-pickup",
      },
      deliveryAddress: pickup,
      deliveryFeeOre: 0,
      guestSessionId: "guest-pickup",
      idempotencyKey: "phase3-pickup-1",
      fulfillment: "PICKUP",
      at: new Date("2026-08-31T12:00:00.000Z"),
    });
    expect(created.order.deliveryStatus).toBe("NOT_REQUESTED");
    expect(created.order.deliveryFeeOre).toBe(0);
    expect(created.order.totalOre).toBe(12900);
    expect(toPublicOrder(created.order).fulfillment).toBe("PICKUP");
  });
});
