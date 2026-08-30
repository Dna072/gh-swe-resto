import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import { createOrderSchema } from "@/lib/validation/checkout";
import { quoteDelivery, resolveAdvanceDeliverySlot } from "@/server/checkout";
import {
  orderService,
  recallGuestToken,
  rememberGuestToken,
  restaurantIdFromEnv,
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
    const quote = await quoteDelivery(body.deliveryAddress, 0);
    const deliveryAddress = quote.address ?? body.deliveryAddress;

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
      deliveryFeeOre: quote.feeOre,
      promotionCode: body.promotionCode,
      guestSessionId: body.guestSessionId,
      idempotencyKey,
      specialInstructions: body.specialInstructions,
      fulfillment: "DELIVERY",
      deliveryProvider: quote.provider,
      deliveryQuoteId: quote.quoteId,
      estimatedDeliveryTime: scheduledFor,
      scheduledFor,
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
