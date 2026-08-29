import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import { createOrderSchema } from "@/lib/validation/checkout";
import { quoteDelivery } from "@/server/checkout";
import {
  orderService,
  recallGuestToken,
  rememberGuestToken,
  restaurantIdFromEnv,
  restaurantSettings,
} from "@/server/composition";
import { errorResponse } from "@/server/http";
import { toPublicOrder } from "@/server/public-order";

export async function POST(request: Request) {
  try {
    const idempotencyKey = request.headers.get("Idempotency-Key")?.trim() ?? "";
    if (!idempotencyKey) {
      throw new AppError("VALIDATION", "An idempotency key is required.");
    }
    const body = createOrderSchema.parse(await request.json());
    if (body.restaurantId !== restaurantIdFromEnv()) {
      return NextResponse.json({ code: "VALIDATION", message: "Unknown restaurant." }, { status: 400 });
    }

    const pickup = restaurantSettings().pickup;
    let deliveryFeeOre = 0;
    let deliveryAddress = pickup;
    let deliveryProvider: string | undefined;
    let deliveryQuoteId: string | undefined;
    let estimatedDeliveryTime: string | undefined;

    if (body.fulfillment === "DELIVERY") {
      if (!body.deliveryAddress) {
        throw new AppError("VALIDATION", "A delivery address is required.");
      }
      const quote = await quoteDelivery(body.deliveryAddress, 0);
      deliveryFeeOre = quote.feeOre;
      deliveryAddress = body.deliveryAddress;
      deliveryProvider = quote.provider;
      deliveryQuoteId = quote.quoteId;
      estimatedDeliveryTime = quote.deliveryEstimate;
    }

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
      deliveryFeeOre,
      promotionCode: body.promotionCode,
      guestSessionId: body.guestSessionId,
      idempotencyKey,
      specialInstructions: body.specialInstructions,
      fulfillment: body.fulfillment,
      deliveryProvider,
      deliveryQuoteId,
      estimatedDeliveryTime,
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
