import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/errors";
import { applyOrderTransition, canTransition } from "./state-machine";
import type { Order } from "./models";

const order = (status: Order["orderStatus"]): Order =>
  ({
    id: "o1",
    restaurantId: "uppsala-main",
    publicOrderNumber: "GH1001",
    accessTokenHash: "hash",
    items: [],
    subtotalOre: 12900,
    deliveryFeeOre: 4900,
    discountTotalOre: 0,
    taxTotalOre: 0,
    totalOre: 17800,
    currency: "SEK",
    paymentStatus: "PAID",
    orderStatus: status,
    deliveryStatus: "SCHEDULED",
    deliveryAddressSnapshot: { line1: "A", postalCode: "75320", city: "Uppsala", country: "SE" },
    customerSnapshot: { name: "Ama", email: "a@b.c", phone: "1" },
    idempotencyKey: "k",
    schemaVersion: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  }) as Order;

describe("OrderStateMachine", () => {
  it("allows the happy-path kitchen flow", () => {
    expect(canTransition("PENDING_PAYMENT", "PAID")).toBe(true);
    expect(canTransition("PAID", "CONFIRMED")).toBe(true);
    expect(canTransition("CONFIRMED", "PREPARING")).toBe(true);
    expect(canTransition("PREPARING", "PACKING")).toBe(true);
    expect(canTransition("PACKING", "READY")).toBe(true);
    expect(canTransition("READY", "COURIER_ASSIGNED")).toBe(true);
    expect(canTransition("READY", "DELIVERED")).toBe(true);
    expect(canTransition("COURIER_ASSIGNED", "OUT_FOR_DELIVERY")).toBe(true);
    expect(canTransition("OUT_FOR_DELIVERY", "DELIVERED")).toBe(true);
  });

  it("rejects skipping kitchen states", () => {
    expect(canTransition("CONFIRMED", "DELIVERED")).toBe(false);
    expect(() => applyOrderTransition(order("CONFIRMED"), "DELIVERED")).toThrow(AppError);
  });

  it("records timestamps and delivery status", () => {
    const next = applyOrderTransition(order("READY"), "COURIER_ASSIGNED");
    expect(next.orderStatus).toBe("COURIER_ASSIGNED");
    expect(next.deliveryStatus).toBe("ASSIGNED");
    expect(next.dispatchedAt).toBeTruthy();
  });

  it("marks delivery failures as attention required", () => {
    const next = applyOrderTransition(order("OUT_FOR_DELIVERY"), "DELIVERY_FAILED");
    expect(next.deliveryStatus).toBe("ATTENTION_REQUIRED");
  });
});
