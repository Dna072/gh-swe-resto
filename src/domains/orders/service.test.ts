import { describe, expect, it } from "vitest";
import { CartService } from "@/domains/cart/service";
import { PricingService } from "@/domains/pricing/service";
import { PromotionService } from "@/domains/promotions/service";
import { InMemoryMenuRepository } from "@/infrastructure/memory/menu-repository";
import { InMemoryOrderRepository } from "@/infrastructure/memory/order-repository";
import { InMemoryPromotionRepository } from "@/infrastructure/memory/supporting-repositories";
import { createMemoryState } from "@/infrastructure/memory/state";
import { InMemoryTransactionRunner } from "@/infrastructure/memory/transaction-runner";
import { OrderService } from "./service";
import {
  RESTAURANT_ID,
  address,
  guest,
  heatGroup,
  inventory,
  jollof,
  proteinGroup,
  tilapia,
  welcomePromo,
} from "../../../tests/unit/fixtures";

function createHarness() {
  const state = createMemoryState({
    items: [jollof, tilapia],
    modifierGroups: [proteinGroup, heatGroup],
    inventory: [inventory("jollof", 30), inventory("tilapia", 1)],
    promotions: [welcomePromo],
  });
  const menu = new InMemoryMenuRepository(state);
  const promotions = new PromotionService();
  const cart = new CartService(
    menu,
    new PricingService(),
    promotions,
    new InMemoryPromotionRepository(state),
    { timeZone: "Europe/Stockholm", weekendDays: ["saturday", "sunday"] },
  );
  const orders = new InMemoryOrderRepository(state);
  const service = new OrderService(orders, cart, new InMemoryTransactionRunner(state), menu);
  return { state, service, orders };
}

const tilapiaLine = [
  {
    menuItemId: "tilapia",
    quantity: 1,
    modifiers: [{ groupId: "heat", optionId: "hot-shito", quantity: 1 }],
  },
];

describe("OrderService", () => {
  it("creates a guest order with a public number and access token", async () => {
    const { service } = createHarness();
    const { order, accessToken } = await service.create({
      restaurantId: RESTAURANT_ID,
      lines: [
        {
          menuItemId: "jollof",
          quantity: 1,
          modifiers: [
            { groupId: "protein", optionId: "chicken", quantity: 1 },
            { groupId: "heat", optionId: "hot-shito", quantity: 1 },
          ],
        },
      ],
      customer: guest,
      deliveryAddress: address,
      idempotencyKey: "guest-checkout-1",
      guestSessionId: "guest-1",
      deliveryFeeOre: 4900,
    });
    expect(order.publicOrderNumber).toMatch(/^GH\d+$/);
    expect(order.customerId).toBeUndefined();
    expect(order.items[0]?.modifiers[0]?.optionName).toBe("Chicken");
    expect(accessToken).toHaveLength(43);
    const loaded = await service.getForCustomer(order.id, accessToken);
    expect(loaded.id).toBe(order.id);
  });

  it("marks a pending guest order as paid", async () => {
    const { service } = createHarness();
    const { order, accessToken } = await service.create({
      restaurantId: RESTAURANT_ID,
      lines: [
        {
          menuItemId: "jollof",
          quantity: 1,
          modifiers: [
            { groupId: "protein", optionId: "chicken", quantity: 1 },
            { groupId: "heat", optionId: "hot-shito", quantity: 1 },
          ],
        },
      ],
      customer: guest,
      deliveryAddress: address,
      idempotencyKey: "pay-1",
      guestSessionId: "guest-pay",
    });
    const paid = await service.markPaid(order.id, accessToken);
    expect(paid.orderStatus).toBe("PAID");
    expect(paid.paymentStatus).toBe("PAID");
  });

  it("is idempotent when the same checkout key is reused", async () => {
    const { service } = createHarness();
    const first = await service.create({
      restaurantId: RESTAURANT_ID,
      lines: tilapiaLine,
      customer: guest,
      deliveryAddress: address,
      idempotencyKey: "same-key",
      guestSessionId: "guest-1",
    });
    const second = await service.create({
      restaurantId: RESTAURANT_ID,
      lines: tilapiaLine,
      customer: guest,
      deliveryAddress: address,
      idempotencyKey: "same-key",
      guestSessionId: "guest-1",
    });
    expect(second.order.id).toBe(first.order.id);
  });

  it("lets only one concurrent order take the last tilapia portion", async () => {
    const { service, state } = createHarness();
    const request = {
      restaurantId: RESTAURANT_ID,
      lines: tilapiaLine,
      customer: guest,
      deliveryAddress: address,
      guestSessionId: "guest-1",
    };
    const results = await Promise.allSettled([
      service.create({ ...request, idempotencyKey: "a" }),
      service.create({ ...request, idempotencyKey: "b" }),
    ]);
    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(state.inventory.find((item) => item.sku === "tilapia")?.availableQuantity).toBe(0);
  });

  it("does not expose an order without a token or matching customer", async () => {
    const { service } = createHarness();
    const { order } = await service.create({
      restaurantId: RESTAURANT_ID,
      lines: [
        {
          menuItemId: "jollof",
          quantity: 1,
          modifiers: [
            { groupId: "protein", optionId: "chicken", quantity: 1 },
            { groupId: "heat", optionId: "mild-shito", quantity: 1 },
          ],
        },
      ],
      customer: guest,
      deliveryAddress: address,
      idempotencyKey: "hidden",
      guestSessionId: "guest-1",
    });
    await expect(service.getForCustomer(order.id, "wrong-token")).rejects.toThrow(/cannot view/i);
  });

  it("cancels a pending guest order and restores inventory", async () => {
    const { service, state } = createHarness();
    const created = await service.create({
      restaurantId: RESTAURANT_ID,
      lines: tilapiaLine,
      customer: guest,
      deliveryAddress: address,
      idempotencyKey: "cancel-me",
      guestSessionId: "guest-1",
    });
    expect(state.inventory.find((item) => item.sku === "tilapia")?.availableQuantity).toBe(0);
    const cancelled = await service.cancel(created.order.id, created.accessToken);
    expect(cancelled.orderStatus).toBe("CANCELLED");
    expect(state.inventory.find((item) => item.sku === "tilapia")?.availableQuantity).toBe(1);
  });

  it("lets kitchen staff accept a prepaid online order and persist CONFIRMED", async () => {
    const { service, orders } = createHarness();
    const created = await service.create({
      restaurantId: RESTAURANT_ID,
      lines: [
        {
          menuItemId: "jollof",
          quantity: 1,
          modifiers: [
            { groupId: "protein", optionId: "chicken", quantity: 1 },
            { groupId: "heat", optionId: "mild-shito", quantity: 1 },
          ],
        },
      ],
      customer: guest,
      deliveryAddress: address,
      idempotencyKey: "kitchen-accept",
      guestSessionId: "guest-1",
    });
    await service.markPaid(created.order.id, created.accessToken);
    const kitchen = { uid: "cook-1", role: "KITCHEN" as const };
    const confirmed = await service.sendToKitchen(kitchen, created.order.id);
    expect(confirmed.orderStatus).toBe("CONFIRMED");
    expect(confirmed.paymentStatus).toBe("PAID");
    const stored = await orders.getById(created.order.id);
    expect(stored?.orderStatus).toBe("CONFIRMED");
    const preparing = await service.transition(kitchen, created.order.id, "PREPARING");
    expect(preparing.preparingAt).toBeTruthy();
    const claimed = await service.claim(
      { uid: "cook-2", role: "KITCHEN", email: "kofi@mfcuisine.se", displayName: "Kofi" },
      created.order.id,
    );
    expect(claimed.assignedKitchenStaffId).toBe("cook-2");
    expect(claimed.assignedKitchenStaffName).toBe("Kofi");
  });

  it("rejects sending an unpaid order to the kitchen", async () => {
    const { service } = createHarness();
    const created = await service.create({
      restaurantId: RESTAURANT_ID,
      lines: [
        {
          menuItemId: "jollof",
          quantity: 1,
          modifiers: [
            { groupId: "protein", optionId: "chicken", quantity: 1 },
            { groupId: "heat", optionId: "mild-shito", quantity: 1 },
          ],
        },
      ],
      customer: guest,
      deliveryAddress: address,
      idempotencyKey: "kitchen-unpaid",
      guestSessionId: "guest-1",
    });
    const kitchen = { uid: "cook-1", role: "KITCHEN" as const };
    await expect(service.sendToKitchen(kitchen, created.order.id)).rejects.toMatchObject({
      code: "INVALID_TRANSITION",
    });
  });

  it("settles payment idempotently and stores the provider payment id", async () => {
    const { service } = createHarness();
    const created = await service.create({
      restaurantId: RESTAURANT_ID,
      lines: [
        {
          menuItemId: "jollof",
          quantity: 1,
          modifiers: [
            { groupId: "protein", optionId: "chicken", quantity: 1 },
            { groupId: "heat", optionId: "mild-shito", quantity: 1 },
          ],
        },
      ],
      customer: guest,
      deliveryAddress: address,
      idempotencyKey: "settle-pay",
      guestSessionId: "guest-1",
    });
    const paid = await service.markPaid(created.order.id, created.accessToken, {
      providerPaymentId: `mock_pay:${created.order.id}`,
    });
    expect(paid.paymentProviderId).toBe(`mock_pay:${created.order.id}`);
    const again = await service.settlePaid(paid, `mock_pay:${created.order.id}`);
    expect(again.orderStatus).toBe("PAID");
  });

  it("refunds a paid order for finance staff", async () => {
    const { service } = createHarness();
    const created = await service.create({
      restaurantId: RESTAURANT_ID,
      lines: [
        {
          menuItemId: "jollof",
          quantity: 1,
          modifiers: [
            { groupId: "protein", optionId: "chicken", quantity: 1 },
            { groupId: "heat", optionId: "mild-shito", quantity: 1 },
          ],
        },
      ],
      customer: guest,
      deliveryAddress: address,
      idempotencyKey: "refund-me",
      guestSessionId: "guest-1",
    });
    await service.markPaid(created.order.id, created.accessToken, { providerPaymentId: "mock_pay:refund-me" });
    const finance = { uid: "fin-1", role: "FINANCE" as const };
    const refunded = await service.refund(finance, created.order.id);
    expect(refunded.orderStatus).toBe("REFUNDED");
    expect(refunded.paymentStatus).toBe("REFUNDED");
  });
});
