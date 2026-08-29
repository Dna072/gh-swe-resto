import { describe, expect, it } from "vitest";
import { PromotionService } from "./service";
import { welcomePromo } from "../../../tests/unit/fixtures";

const promotions = new PromotionService();

describe("PromotionService", () => {
  it("applies a percentage discount", () => {
    const result = promotions.evaluate({
      promotion: welcomePromo,
      usage: null,
      context: {
        restaurantId: "uppsala-main",
        isMember: false,
        isFirstOrder: true,
      },
      subtotalOre: 12900,
      deliveryFeeOre: 4900,
    });
    expect(result.discountOre).toBe(1290);
    expect(result.freeDelivery).toBe(false);
  });

  it("rejects member-only codes for guests", () => {
    expect(() =>
      promotions.evaluate({
        promotion: { ...welcomePromo, memberOnly: true },
        usage: null,
        context: { restaurantId: "uppsala-main", isMember: false, isFirstOrder: true },
        subtotalOre: 12900,
        deliveryFeeOre: 4900,
      }),
    ).toThrow(/members only/i);
  });

  it("enforces per-customer usage limits", () => {
    expect(() =>
      promotions.evaluate({
        promotion: { ...welcomePromo, perCustomerLimit: 1 },
        usage: { id: "u", promotionId: "welcome", customerKey: "guest-1", count: 1 },
        context: { restaurantId: "uppsala-main", isMember: false, isFirstOrder: false },
        subtotalOre: 12900,
        deliveryFeeOre: 4900,
      }),
    ).toThrow(/already used/i);
  });
});
