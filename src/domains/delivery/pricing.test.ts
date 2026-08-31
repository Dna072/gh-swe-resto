import { describe, expect, it } from "vitest";
import { DeliveryPricingService, validateDeliveryPricingConfig } from "./pricing";

const pricing = new DeliveryPricingService();

describe("DeliveryPricingService", () => {
  it("PASS_THROUGH charges the provider cost for any provider", () => {
    for (const cost of [7900, 7500]) {
      const priced = pricing.price(cost, { strategy: "PASS_THROUGH" });
      expect(priced.customerDeliveryFeeOre).toBe(cost);
      expect(priced.restaurantMarkupOre).toBe(0);
      expect(priced.restaurantSubsidyOre).toBe(0);
    }
  });

  it("FREE makes the customer pay 0 and the restaurant absorb the provider cost", () => {
    const priced = pricing.price(7900, { strategy: "FREE" });
    expect(priced.customerDeliveryFeeOre).toBe(0);
    expect(priced.restaurantSubsidyOre).toBe(7900);
  });

  it("MARKUP percentage 20% turns 79 SEK into 94.80 SEK", () => {
    const priced = pricing.price(7900, {
      strategy: "MARKUP",
      markupType: "PERCENTAGE",
      markupValue: 20,
    });
    expect(priced.customerDeliveryFeeOre).toBe(9480);
    expect(priced.restaurantMarkupOre).toBe(1580);
  });

  it("MARKUP fixed adds öre", () => {
    const priced = pricing.price(7900, {
      strategy: "MARKUP",
      markupType: "FIXED",
      markupValue: 2000,
    });
    expect(priced.customerDeliveryFeeOre).toBe(9900);
  });

  it("SUBSIDIZED fixed and percentage", () => {
    expect(
      pricing.price(7900, { strategy: "SUBSIDIZED", subsidyType: "FIXED", subsidyValue: 2000 })
        .customerDeliveryFeeOre,
    ).toBe(5900);
    expect(
      pricing.price(7900, { strategy: "SUBSIDIZED", subsidyType: "PERCENTAGE", subsidyValue: 20 })
        .customerDeliveryFeeOre,
    ).toBe(6320);
  });

  it("MARKUP_WITH_CEILING follows the spec examples", () => {
    const config = {
      strategy: "MARKUP_WITH_CEILING" as const,
      markupType: "PERCENTAGE" as const,
      markupValue: 20,
      markupCeilingOre: 10000,
    };
    expect(pricing.price(6000, config).customerDeliveryFeeOre).toBe(7200);
    expect(pricing.price(8000, config).customerDeliveryFeeOre).toBe(9600);
    expect(pricing.price(10000, config).customerDeliveryFeeOre).toBe(12000);
    expect(pricing.price(10000, config).ceilingTriggered).toBe(false);
    expect(pricing.price(12000, config)).toMatchObject({
      customerDeliveryFeeOre: 12000,
      restaurantMarkupOre: 0,
      ceilingTriggered: true,
    });
    expect(pricing.price(15000, config)).toMatchObject({
      customerDeliveryFeeOre: 15000,
      ceilingTriggered: true,
    });
  });

  it("rejects negative costs and invalid configuration", () => {
    expect(() => pricing.price(-1, { strategy: "PASS_THROUGH" })).toThrow();
    expect(() => validateDeliveryPricingConfig({ strategy: "MARKUP" })).toThrow(/markup type/i);
    expect(() =>
      validateDeliveryPricingConfig({
        strategy: "MARKUP",
        markupType: "PERCENTAGE",
        markupValue: -1,
      }),
    ).toThrow();
  });
});
