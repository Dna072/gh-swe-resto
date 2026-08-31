import { describe, expect, it } from "vitest";
import { CartService } from "@/domains/cart/service";
import { DeliveryService } from "@/domains/delivery/service";
import { PricingService } from "@/domains/pricing/service";
import { seedDeliveryZones, seedMenuItems, seedPricingCalendar } from "@/infrastructure/seed/ghana-menu";
import { loadPublicCatalog, loadPublicItem } from "@/server/catalog";
import { cartService, deliveryService, deliveryZones } from "@/server/composition";

describe("Phase 2 seeded catalog", () => {
  it("resolves display prices on the server for weekday and weekend", async () => {
    const pricing = new PricingService();
    const jollof = seedMenuItems.find((item) => item.id === "jollof");
    expect(jollof).toBeTruthy();
    const monday = new Date("2026-08-31T12:00:00.000Z");
    const saturday = new Date("2026-08-29T12:00:00.000Z");
    expect(pricing.resolveItemPrice(jollof!, monday, seedPricingCalendar)).toBe(12900);
    expect(pricing.resolveItemPrice(jollof!, saturday, seedPricingCalendar)).toBe(14900);
  });

  it("exposes public items with server display prices and modifiers", async () => {
    const catalog = await loadPublicCatalog();
    expect(catalog.seedSource).toBe("demo-seed");
    expect(catalog.orderingPaused).toBe(false);
    expect(catalog.categories.map((category) => category.slug)).toEqual(["plates", "sides", "drinks"]);
    const jollof = catalog.items.find((item) => item.slug === "jollof-rice");
    expect(jollof?.modifierGroups.some((group) => group.id === "protein" && group.required)).toBe(true);
    expect(jollof?.displayPriceOre).toBeGreaterThan(0);
    expect(jollof?.hasPhotograph).toBe(false);
    expect(jollof?.imageUrl).toBeNull();
    const kenkey = catalog.items.find((item) => item.slug === "kenkey-fish");
    expect(kenkey?.availability).toBe("LOW_STOCK");
    expect(kenkey?.remainingPortions).toBe(2);
  });

  it("loads a meal by slug", async () => {
    const item = await loadPublicItem("banku-tilapia");
    expect(item.name).toContain("Tilapia");
    expect(item.remainingPortions).toBe(10);
  });

  it("quotes a cart from the seed catalog", async () => {
    const quote = await cartService.quote({
      restaurantId: "uppsala-main",
      at: new Date("2026-08-31T12:00:00.000Z"),
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
    });
    expect(quote.subtotalOre).toBe(12900);
    expect(quote.totalOre).toBe(12900);
    expect(quote.lines[0]?.name).toBe("Jollof Rice");
  });

  it("applies the seeded WELCOME10 promotion on a cart quote", async () => {
    const quote = await cartService.quote({
      restaurantId: "uppsala-main",
      at: new Date("2026-08-31T12:00:00.000Z"),
      promotionCode: "WELCOME10",
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
    });
    expect(quote.discountTotalOre).toBe(1290);
    expect(quote.promotionCode).toBe("WELCOME10");
  });

  it("refuses a quote while ordering is paused", async () => {
    await expect(
      cartService.quote({
        restaurantId: "uppsala-main",
        orderingPaused: true,
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
      }),
    ).rejects.toMatchObject({ code: "ORDERING_PAUSED" });
  });

  it("validates Uppsala delivery zones from seed data", () => {
    const zone = deliveryService.validateZone(
      { line1: "Test", postalCode: "75322", city: "Uppsala", country: "SE" },
      deliveryZones(),
    );
    expect(zone.name).toBe("Uppsala centrum");
    expect(zone.baseFeeOre).toBe(4900);
    expect(() =>
      new DeliveryService([], { preferCheapest: true, preferredProviders: ["mock"] }).validateZone(
        { line1: "Test", postalCode: "11122", city: "Stockholm", country: "SE" },
        seedDeliveryZones,
      ),
    ).toThrow(/do not deliver/i);
  });
});

describe("CartService type export sanity", () => {
  it("keeps the service constructable", () => {
    expect(CartService.name).toBe("CartService");
  });
});
