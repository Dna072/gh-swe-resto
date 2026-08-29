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
  const service = new OrderService(orders, cart, new InMemoryTransactionRunner(state));
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
});
