import { afterEach, describe, expect, it } from "vitest";
import { quoteDelivery, quoteDeliveryOptions, resolveAdvanceDeliverySlot } from "@/server/checkout";
import { orderService, recallGuestToken, rememberGuestToken, restaurantSettings, saveDeliverySettings } from "@/server/composition";
import { defaultDeliverySettings } from "@/domains/delivery/models";
import { toPublicOrder } from "@/server/public-order";
import { createOrderSchema } from "@/lib/validation/checkout";

const jollofLine = {
  menuItemId: "jollof",
  quantity: 1,
  modifiers: [
    { groupId: "protein", optionId: "chicken", quantity: 1 },
    { groupId: "heat", optionId: "hot-shito", quantity: 1 },
  ],
};

const uppsalaAddress = {
  line1: "Svartbäcksgatan 1",
  postalCode: "75322",
  city: "Uppsala",
  country: "SE" as const,
};

describe("Phase 3 checkout", () => {
  afterEach(async () => {
    await saveDeliverySettings(defaultDeliverySettings("uppsala-main"));
  });
  it("quotes provider options with customer fees, not a hardcoded zone table", async () => {
    const quoted = await quoteDeliveryOptions(uppsalaAddress);
    expect(quoted.deliverable).toBe(true);
    expect(quoted.options.map((option) => option.provider).sort()).toEqual(["foodora", "wolt_drive"]);
    const foodora = quoted.options.find((option) => option.provider === "foodora");
    const wolt = quoted.options.find((option) => option.provider === "wolt_drive");
    expect(foodora?.customerDeliveryFeeOre).toBe(7500);
    expect(wolt?.customerDeliveryFeeOre).toBe(7900);
    expect(JSON.stringify(quoted.options)).not.toMatch(/restaurantMarkupOre/);
  });

  it("uses the selected provider quote and stores provider cost separately from the customer fee", async () => {
    const quote = await quoteDelivery(uppsalaAddress, 0, "wolt_drive");
    expect(quote.provider).toBe("wolt_drive");
    expect(quote.providerDeliveryCostOre).toBe(7900);
    expect(quote.customerDeliveryFeeOre).toBe(7900);
    const created = await orderService.create({
      restaurantId: "uppsala-main",
      lines: [jollofLine],
      customer: {
        name: "Ama Mensah",
        email: "ama@example.com",
        phone: "+46700000000",
        guestSessionId: "guest-phase3",
      },
      deliveryAddress: uppsalaAddress,
      deliveryFeeOre: quote.customerDeliveryFeeOre,
      guestSessionId: "guest-phase3",
      idempotencyKey: "phase3-delivery-wolt-1",
      fulfillment: "DELIVERY",
      deliveryProvider: quote.provider,
      deliveryQuoteId: quote.quoteId,
      estimatedDeliveryTime: quote.quotedAt,
      deliveryPricing: {
        provider: quote.provider,
        providerQuoteId: quote.quoteId,
        providerDeliveryCostOre: quote.providerDeliveryCostOre,
        customerDeliveryFeeOre: quote.customerDeliveryFeeOre,
        restaurantMarkupOre: quote.restaurantMarkupOre,
        restaurantSubsidyOre: quote.restaurantSubsidyOre,
        pricingStrategy: quote.pricingStrategy,
        ceilingTriggered: quote.ceilingTriggered,
        quotedAt: quote.quotedAt,
        quoteExpiresAt: quote.expiresAt,
        estimatedDeliveryMinutes: quote.etaMinutes,
      },
    });
    expect(created.order.deliveryFeeOre).toBe(7900);
    expect(created.order.deliveryPricing?.providerDeliveryCostOre).toBe(7900);
    expect(created.order.deliveryPricing?.customerDeliveryFeeOre).toBe(7900);
    expect(created.order.totalOre).toBe(12900 + 7900);
    expect(created.order.publicOrderNumber).toMatch(/^GH\d+$/);
    const publicOrder = toPublicOrder(created.order);
    expect(publicOrder).not.toHaveProperty("accessTokenHash");
    expect(publicOrder.paymentDeferred).toBe(false);
    expect(publicOrder.payable).toBe(true);
    expect(publicOrder.cancellable).toBe(true);
    expect(publicOrder.fulfillment).toBe("DELIVERY");
    rememberGuestToken(created.order.id, "phase3-delivery-wolt-1", created.accessToken);
    expect(recallGuestToken(created.order.id, "phase3-delivery-wolt-1")).toBe(created.accessToken);
    const loaded = await orderService.getForCustomer(created.order.id, created.accessToken);
    expect(loaded.id).toBe(created.order.id);

    await saveDeliverySettings({
      ...defaultDeliverySettings("uppsala-main"),
      pricing: { strategy: "FREE", enabled: true },
    });
    const afterChange = await orderService.getByPublicNumber("uppsala-main", created.order.publicOrderNumber);
    expect(afterChange?.deliveryFeeOre).toBe(7900);
    expect(afterChange?.deliveryPricing?.pricingStrategy).toBe("PASS_THROUGH");
  });

  it("extracts a typed postcode and rejects addresses outside the configured areas", async () => {
    const quoted = await quoteDeliveryOptions({
      line1: "Svartbäcksgatan 1, 75322, Uppsala",
      postalCode: "00000",
      city: "Uppsala",
      country: "SE",
    });
    expect(quoted.deliverable).toBe(true);
    expect(quoted.address.postalCode).toBe("75322");

    const east = await quoteDeliveryOptions({
      line1: "Kantorsgatan 80, 75424, Uppsala",
      postalCode: "00000",
      city: "Uppsala",
      country: "SE",
    });
    expect(east.deliverable).toBe(true);
    expect(east.address.postalCode).toBe("75424");

    await expect(
      quoteDeliveryOptions({
        line1: "Testgatan 1",
        postalCode: "11122",
        city: "Stockholm",
        country: "SE",
      }),
    ).rejects.toMatchObject({ code: "DELIVERY_UNAVAILABLE" });
  });

  it("defaults to the cheaper sandbox provider when none is selected", async () => {
    const quote = await quoteDelivery(uppsalaAddress);
    expect(quote.provider).toBe("foodora");
    expect(quote.feeOre).toBe(7500);
  });

  it("rejects a client-supplied delivery fee on the create-order payload", () => {
    const parsed = createOrderSchema.safeParse({
      restaurantId: "uppsala-main",
      lines: [jollofLine],
      customer: { name: "Ama", email: "ama@example.com", phone: "+46700000000" },
      deliveryAddress: uppsalaAddress,
      deliveryFeeOre: 1,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).not.toHaveProperty("deliveryFeeOre");
    }
  });

  it("resolves a 24-hour advance slot inside kitchen hours", async () => {
    const now = new Date("2026-08-30T10:00:00.000Z");
    expect(resolveAdvanceDeliverySlot("2026-08-31T10:00:00.000Z", now)).toBe("2026-08-31T10:00:00.000Z");
    expect(() => resolveAdvanceDeliverySlot("2026-08-30T14:00:00.000Z", now)).toThrow(/24 hours/i);
  });

  it("creates a pickup order with no delivery fee", async () => {
    const pickup = restaurantSettings().pickup;
    const created = await orderService.create({
      restaurantId: "uppsala-main",
      lines: [jollofLine],
      customer: {
        name: "Jonas Lind",
        email: "jonas@example.com",
        phone: "+46701111111",
        guestSessionId: "guest-pickup",
      },
      deliveryAddress: pickup,
      deliveryFeeOre: 0,
      guestSessionId: "guest-pickup",
      idempotencyKey: "phase3-pickup-1",
      fulfillment: "PICKUP",
    });
    expect(created.order.deliveryStatus).toBe("NOT_REQUESTED");
    expect(created.order.deliveryFeeOre).toBe(0);
    expect(created.order.totalOre).toBe(12900);
    expect(toPublicOrder(created.order).fulfillment).toBe("PICKUP");
  });
});
