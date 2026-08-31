import { describe, expect, it } from "vitest";
import type { Order } from "@/domains/orders/models";
import { fulfillmentOf, kitchenActions } from "./staff";

const base = {
  id: "o1",
  restaurantId: "uppsala-main",
  publicOrderNumber: "GH1001",
  accessTokenHash: "hash",
  items: [],
  subtotalOre: 12900,
  deliveryFeeOre: 0,
  discountTotalOre: 0,
  taxTotalOre: 0,
  totalOre: 12900,
  currency: "SEK" as const,
  paymentStatus: "PENDING" as const,
  deliveryAddressSnapshot: { line1: "A", postalCode: "75320", city: "Uppsala", country: "SE" },
  customerSnapshot: { name: "Ama", email: "a@b.c", phone: "1" },
  idempotencyKey: "k",
  schemaVersion: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("kitchen actions", () => {
  it("does not offer send-to-kitchen for unpaid guest orders", () => {
    const order = {
      ...base,
      orderStatus: "PENDING_PAYMENT",
      deliveryStatus: "QUOTED",
    } as Order;
    expect(kitchenActions(order).map((action) => action.to)).toEqual(["CANCELLED"]);
  });

  it("offers send-to-kitchen for prepaid online orders", () => {
    const order = {
      ...base,
      orderStatus: "PAID",
      paymentStatus: "PAID",
      deliveryStatus: "QUOTED",
    } as Order;
    expect(kitchenActions(order).map((action) => action.to)).toContain("SEND_TO_KITCHEN");
  });

  it("lets pickup orders finish at ready without a courier", () => {
    const order = {
      ...base,
      orderStatus: "READY",
      deliveryStatus: "NOT_REQUESTED",
    } as Order;
    expect(fulfillmentOf(order)).toBe("PICKUP");
    expect(kitchenActions(order).map((action) => action.to)).toEqual(["CLAIM", "DELIVERED", "CANCELLED"]);
  });
});
