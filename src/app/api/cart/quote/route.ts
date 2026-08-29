import { NextResponse } from "next/server";
import { cartQuoteSchema } from "@/lib/validation/common";
import { cartService, restaurantIdFromEnv } from "@/server/composition";
import { errorResponse } from "@/server/http";

export async function POST(request: Request) {
  try {
    const body = cartQuoteSchema.parse(await request.json());
    if (body.restaurantId !== restaurantIdFromEnv()) {
      return NextResponse.json({ code: "VALIDATION", message: "Unknown restaurant." }, { status: 400 });
    }
    const quote = await cartService.quote(body);
    return NextResponse.json(quote);
  } catch (error) {
    return errorResponse(error);
  }
}
