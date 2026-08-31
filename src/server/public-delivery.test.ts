import { describe, expect, it } from "vitest";
import type { Order } from "@/domains/orders/models";
import { toPublicDelivery } from "./public-delivery";

describe("toPublicDelivery", () => {
  it("exposes status and tracking without guest tokens", () => {
    const order = {
      id: "o1",
      publicOrderNumber: "GH1001",
      deliveryStatus: "IN_TRANSIT",
      orderStatus: "OUT_FOR_DELIVERY",
      trackingUrl: "https://track.example/o1",
      estimatedDeliveryTime: "2026-09-02T12:00:00.000Z",
      scheduledFor: "2026-09-02T12:00:00.000Z",
      deliveryProvider: "wolt_drive",
    } as Order;
    expect(toPublicDelivery(order)).toEqual({
      orderId: "o1",
      publicOrderNumber: "GH1001",
      deliveryStatus: "IN_TRANSIT",
      orderStatus: "OUT_FOR_DELIVERY",
      trackingUrl: "https://track.example/o1",
      estimatedDeliveryTime: "2026-09-02T12:00:00.000Z",
      scheduledFor: "2026-09-02T12:00:00.000Z",
      deliveryProviderName: "wolt_drive",
    });
  });
});
