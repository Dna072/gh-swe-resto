import { describe, expect, it } from "vitest";
import { PricingService } from "./service";
import { heatGroup, jollof, proteinGroup } from "../../../tests/unit/fixtures";

const pricing = new PricingService();

describe("PricingService", () => {
  it("uses weekday and weekend prices from data, not UI logic", () => {
    const monday = new Date("2026-08-31T12:00:00.000Z");
    const saturday = new Date("2026-08-29T12:00:00.000Z");
    expect(pricing.resolveItemPrice(jollof, monday)).toBe(12900);
    expect(pricing.resolveItemPrice(jollof, saturday)).toBe(14900);
  });

  it("prices modifiers and line totals on the server", () => {
    const modifiers = pricing.priceModifiers(
      [proteinGroup, heatGroup],
      [
        { groupId: "protein", optionId: "extra-chicken", quantity: 2 },
        { groupId: "heat", optionId: "hot-shito", quantity: 1 },
      ],
    );
    const line = pricing.priceLine({
      item: jollof,
      quantity: 2,
      modifiers,
      at: new Date("2026-08-31T12:00:00.000Z"),
    });
    expect(line.modifierTotalOre).toBe(5000);
    expect(line.lineTotalOre).toBe(35800);
  });

  it("never returns a negative total after discounts", () => {
    const line = pricing.priceLine({
      item: jollof,
      quantity: 1,
      modifiers: [],
      at: new Date("2026-08-31T12:00:00.000Z"),
    });
    const quote = pricing.quote({
      lines: [line],
      deliveryFeeOre: 4900,
      discountOre: 999999,
    });
    expect(quote.totalOre).toBe(0);
    expect(quote.discountTotalOre).toBe(17800);
  });

  it("rejects incomplete required modifier groups", () => {
    expect(() => pricing.priceModifiers([proteinGroup], [])).toThrow(/choose options/i);
  });
});
