import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import { createOrderSchema } from "@/lib/validation/checkout";
import { quoteDelivery, resolveAdvanceDeliverySlot } from "@/server/checkout";
import {
  getDeliverySettings,
  ensureRestaurantSettings,
  orderService,
  recallGuestToken,
  rememberGuestToken,
  restaurantIdFromEnv,
} from "@/server/composition";
import { errorResponse } from "@/server/http";
import { toPublicOrder } from "@/server/public-order";
import { assertRateLimit, rateLimitKey } from "@/server/rate-limit";

export async function POST(request: Request) {
  try {
    assertRateLimit(rateLimitKey(request, "orders"), 20, 10 * 60 * 1000);
    const idempotencyKey = request.headers.get("Idempotency-Key")?.trim() ?? "";
    if (!idempotencyKey) {
      throw new AppError("VALIDATION", "An idempotency key is required.");
    }
    const body = createOrderSchema.parse(await request.json());
    if (body.restaurantId !== restaurantIdFromEnv()) {
      return NextResponse.json({ code: "VALIDATION", message: "Unknown restaurant." }, { status: 400 });
    }

    if (body.fulfillment === "PICKUP") {
      throw new AppError("VALIDATION", "Orders are delivery only.");
    }
    if (!body.deliveryAddress) {
      throw new AppError("VALIDATION", "A delivery address is required.");
    }
    if (!body.scheduledFor) {
      throw new AppError("SLOT_UNAVAILABLE", "Choose a delivery date and time.");
    }

    const scheduledFor = resolveAdvanceDeliverySlot(body.scheduledFor);
    const quote = await quoteDelivery(body.deliveryAddress, 0, body.deliveryProvider);
    const deliveryAddress = {
      ...(quote.address ?? body.deliveryAddress),
      apartment: body.deliveryAddress.apartment,
      line2: body.deliveryAddress.line2,
      municipality: body.deliveryAddress.municipality ?? quote.address?.municipality,
    };
    const settings = getDeliverySettings();
    const restaurant = await ensureRestaurantSettings();

    const created = await orderService.create({
      restaurantId: body.restaurantId,
      lines: body.lines,
      customer: {
        name: body.customer.name,
        email: body.customer.email,
        phone: body.customer.phone,
        guestSessionId: body.guestSessionId,
      },
      deliveryAddress,
      deliveryFeeOre: quote.customerDeliveryFeeOre,
      promotionCode: body.promotionCode,
      guestSessionId: body.guestSessionId,
      idempotencyKey,
      specialInstructions: body.specialInstructions,
      fulfillment: "DELIVERY",
      deliveryProvider: quote.provider,
      deliveryQuoteId: quote.quoteId,
      estimatedDeliveryTime: scheduledFor,
      scheduledFor,
      orderingPaused: restaurant.orderingPaused,
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
        markupCeilingOre: settings.pricing.markupCeilingOre,
      },
    });

    rememberGuestToken(created.order.id, idempotencyKey, created.accessToken);
    const accessToken = created.accessToken || recallGuestToken(created.order.id, idempotencyKey);

    return NextResponse.json({
      order: toPublicOrder(created.order),
      accessToken,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
