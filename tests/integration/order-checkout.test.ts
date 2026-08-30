import { describe, expect, it } from "vitest";
import { CartService } from "@/domains/cart/service";
import { OrderService } from "@/domains/orders/service";
import { PricingService } from "@/domains/pricing/service";
import { PromotionService } from "@/domains/promotions/service";
import { InMemoryMenuRepository } from "@/infrastructure/memory/menu-repository";
import { InMemoryOrderRepository } from "@/infrastructure/memory/order-repository";
import { InMemoryPromotionRepository } from "@/infrastructure/memory/supporting-repositories";
import { InMemoryTransactionRunner } from "@/infrastructure/memory/transaction-runner";
import { createMemoryState } from "@/infrastructure/memory/state";
import {
  RESTAURANT_ID,
  address,
  guest,
  heatGroup,
  inventory,
  jollof,
  proteinGroup,
  welcomePromo,
} from "../unit/fixtures";

describe("checkout integration", () => {
  it("quotes server prices then creates a snapshot that will not change with menu edits", async () => {
    const state = createMemoryState({
      items: [jollof],
      modifierGroups: [proteinGroup, heatGroup],
      inventory: [inventory("jollof", 30)],
      promotions: [welcomePromo],
    });
    const menu = new InMemoryMenuRepository(state);
    const cart = new CartService(
      menu,
      new PricingService(),
      new PromotionService(),
      new InMemoryPromotionRepository(state),
      { timeZone: "Europe/Stockholm", weekendDays: ["saturday", "sunday"] },
    );
    const orders = new InMemoryOrderRepository(state);
    const service = new OrderService(orders, cart, new InMemoryTransactionRunner(state), menu);
    const quote = await cart.quote({
      restaurantId: RESTAURANT_ID,
      lines: [
        {
          menuItemId: "jollof",
          quantity: 1,
          modifiers: [
            { groupId: "protein", optionId: "beef", quantity: 1 },
            { groupId: "heat", optionId: "hot-shito", quantity: 1 },
          ],
        },
      ],
      deliveryFeeOre: 4900,
      promotionCode: "WELCOME10",
      guestSessionId: "guest-1",
      at: new Date("2026-08-31T12:00:00.000Z"),
    });
    expect(quote.subtotalOre).toBe(13900);
    expect(quote.discountTotalOre).toBe(1390);
    expect(quote.totalOre).toBe(17410);

    const { order } = await service.create({
      restaurantId: RESTAURANT_ID,
      lines: [
        {
          menuItemId: "jollof",
          quantity: 1,
          modifiers: [
            { groupId: "protein", optionId: "beef", quantity: 1 },
            { groupId: "heat", optionId: "hot-shito", quantity: 1 },
          ],
        },
      ],
      deliveryFeeOre: 4900,
      promotionCode: "WELCOME10",
      guestSessionId: "guest-1",
      customer: guest,
      deliveryAddress: address,
      idempotencyKey: "checkout-1",
      at: new Date("2026-08-31T12:00:00.000Z"),
    });

    const item = state.items.find((entry) => entry.id === "jollof");
    if (item) {
      item.basePriceOre = 99900;
      item.weekdayPriceOre = 99900;
    }
    expect(order.totalOre).toBe(17410);
    expect(order.items[0]?.unitPriceOre).toBe(12900);
  });
});
