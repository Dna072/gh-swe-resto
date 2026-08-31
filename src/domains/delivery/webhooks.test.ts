import { describe, expect, it } from "vitest";
import { hmacSha256Hex } from "@/lib/hash";
import {
  mapProviderStatusWord,
  normalizeWebhookPayload,
  shouldApplyDeliveryEvent,
} from "./webhooks";
import { DeliveryWebhookProcessor } from "./webhook-processor";
import { SandboxDeliveryProvider, SANDBOX_PROFILES } from "@/infrastructure/delivery/sandbox-provider";
import { InMemoryOrderRepository } from "@/infrastructure/memory/order-repository";
import { createMemoryState } from "@/infrastructure/memory/state";
import type { Order } from "@/domains/orders/models";

describe("delivery webhook normalization", () => {
  it("maps known status words and ignores unknown events", () => {
    expect(mapProviderStatusWord("picked_up")).toBe("PICKED_UP");
    expect(mapProviderStatusWord("out-for-delivery")).toBe("IN_TRANSIT");
    expect(mapProviderStatusWord("totally-new-event")).toBeUndefined();
    const unknown = normalizeWebhookPayload("wolt_drive", { ping: true }, "fallback");
    expect(unknown.unknown).toBe(true);
  });

  it("drops out-of-order progress but applies failure", () => {
    expect(shouldApplyDeliveryEvent("IN_TRANSIT", "SCHEDULED")).toBe(false);
    expect(shouldApplyDeliveryEvent("IN_TRANSIT", "DELIVERED")).toBe(true);
    expect(shouldApplyDeliveryEvent("IN_TRANSIT", "FAILED")).toBe(true);
  });
});

describe("DeliveryWebhookProcessor", () => {
  it("is idempotent and ignores duplicates", async () => {
    const state = createMemoryState({
      categories: [],
      items: [],
      modifierGroups: [],
      inventory: [],
    });
    const orders = new InMemoryOrderRepository(state);
    const order: Order = {
      id: "ord_hook",
      restaurantId: "uppsala-main",
      publicOrderNumber: "GH1",
      accessTokenHash: "hash",
      items: [],
      subtotalOre: 1000,
      deliveryFeeOre: 7500,
      discountTotalOre: 0,
      taxTotalOre: 0,
      totalOre: 8500,
      currency: "SEK",
      paymentStatus: "PAID",
      orderStatus: "READY",
      deliveryStatus: "SCHEDULED",
      fulfillment: "DELIVERY",
      deliveryProvider: "foodora",
      providerDeliveryId: "del_1",
      deliveryAddressSnapshot: {
        line1: "Kungsängsgatan 1",
        postalCode: "75322",
        city: "Uppsala",
        country: "SE",
      },
      customerSnapshot: { name: "Ama", email: "a@example.com", phone: "+46700000000" },
      idempotencyKey: "k",
      schemaVersion: 1,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    await orders.create(order);
    const seen = new Set<string>();
    const processor = new DeliveryWebhookProcessor(
      [new SandboxDeliveryProvider(SANDBOX_PROFILES.foodora)],
      orders,
      {
        has: async (id) => seen.has(id),
        mark: async (id) => {
          seen.add(id);
        },
      },
    );
    const body = JSON.stringify({ id: "del_1", status: "delivered", event_id: "evt_dup" });
    const signature = hmacSha256Hex("sandbox-webhook-secret", body);
    const first = await processor.process("foodora", body, { "x-signature": signature });
    const second = await processor.process("foodora", body, { "x-signature": signature });
    expect(first.duplicate).toBe(false);
    expect(second.duplicate).toBe(true);
    const stored = await orders.getById("ord_hook");
    expect(stored?.deliveryStatus).toBe("DELIVERED");
  });
});
