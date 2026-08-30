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
    const quote = await quoteDelivery(body.address, body.orderValueOre ?? 0);
    return NextResponse.json(quote);
  } catch (error) {
    return errorResponse(error);
  }
}
