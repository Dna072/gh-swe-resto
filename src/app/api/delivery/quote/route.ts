import { NextResponse } from "next/server";
import { deliveryQuoteSchema } from "@/lib/validation/checkout";
import { quoteDelivery } from "@/server/checkout";
import { restaurantIdFromEnv } from "@/server/composition";
import { errorResponse } from "@/server/http";

export async function POST(request: Request) {
  try {
    const body = deliveryQuoteSchema.parse(await request.json());
    if (body.restaurantId !== restaurantIdFromEnv()) {
      return NextResponse.json({ code: "VALIDATION", message: "Unknown restaurant." }, { status: 400 });
    }
    const quote = await quoteDelivery(body.address, body.orderValueOre ?? 0, body.provider);
    return NextResponse.json({
      deliverable: quote.deliverable,
      feeOre: quote.feeOre,
      feeLabel: quote.feeLabel,
      etaMinutes: quote.etaMinutes,
      provider: quote.provider,
      displayName: quote.displayName,
      quoteId: quote.quoteId,
      expiresAt: quote.expiresAt,
      lat: quote.lat,
      lng: quote.lng,
      formattedAddress: quote.formattedAddress,
      customerCanSelect: quote.customerCanSelect,
      options: quote.options,
      selected: {
        provider: quote.provider,
        displayName: quote.displayName,
        estimatedDeliveryMinutes: quote.etaMinutes,
        customerDeliveryFeeOre: quote.customerDeliveryFeeOre,
        feeLabel: quote.feeLabel,
        quoteId: quote.quoteId,
        expiresAt: quote.expiresAt,
        currency: "SEK",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
