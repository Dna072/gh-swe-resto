import { describe, expect, it } from "vitest";
import type { AnalyticsRecord } from "@/domains/analytics/models";
import type { Order } from "@/domains/orders/models";
import { salesFromOrders, sessionsFromEvents } from "./service";

const baseOrder = {
  id: "o1",
  restaurantId: "uppsala-main",
  publicOrderNumber: "GH1001",
  accessTokenHash: "h",
  items: [],
  subtotalOre: 12900,
  deliveryFeeOre: 4900,
  discountTotalOre: 0,
  taxTotalOre: 0,
  totalOre: 17800,
  currency: "SEK" as const,
  deliveryAddressSnapshot: { line1: "A", postalCode: "75320", city: "Uppsala", country: "SE" },
  customerSnapshot: { name: "Ama", email: "a@b.c", phone: "1" },
  idempotencyKey: "k",
  schemaVersion: 1,
  createdAt: "2026-08-30T10:00:00.000Z",
  updatedAt: "2026-08-30T10:00:00.000Z",
};

describe("salesFromOrders", () => {
  it("sums paid orders and keeps pending separate", () => {
    const paid = {
      ...baseOrder,
      paymentStatus: "PAID",
      orderStatus: "PAID",
    } as unknown as Order;
    const pending = {
      ...baseOrder,
      id: "o2",
      paymentStatus: "PENDING",
      orderStatus: "PENDING_PAYMENT",
      totalOre: 10000,
    } as unknown as Order;
    const totals = salesFromOrders([paid, pending], new Date("2026-08-30T12:00:00.000Z"));
    expect(totals.paidCount).toBe(1);
    expect(totals.paidTotalOre).toBe(17800);
    expect(totals.todayPaidOre).toBe(17800);
    expect(totals.pendingCount).toBe(1);
    expect(totals.pendingTotalOre).toBe(10000);
    expect(totals.averagePaidOre).toBe(17800);
  });
});

describe("sessionsFromEvents", () => {
  it("groups actions by session and city", () => {
    const events: AnalyticsRecord[] = [
      {
        id: "1",
        name: "page_viewed",
        occurredAt: "2026-08-30T10:00:00.000Z",
        restaurantId: "uppsala-main",
        sessionId: "s1",
        properties: {},
        path: "/menu",
        city: "Uppsala",
        country: "Sweden",
      },
      {
        id: "2",
        name: "item_added",
        occurredAt: "2026-08-30T10:05:00.000Z",
        restaurantId: "uppsala-main",
        sessionId: "s1",
        properties: {},
        path: "/menu/jollof-rice",
        city: "Uppsala",
        country: "Sweden",
      },
    ];
    const sessions = sessionsFromEvents(events, []);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.actionCount).toBe(2);
    expect(sessions[0]?.lastAction).toBe("item_added");
    expect(sessions[0]?.city).toBe("Uppsala");
  });
});
