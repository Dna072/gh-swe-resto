import { NextResponse } from "next/server";
import { z } from "zod";
import { addressSchema } from "@/lib/validation/common";
import { publicDeliveryPayload, quoteDeliveryOptions } from "@/server/checkout";
import { restaurantIdFromEnv } from "@/server/composition";
import { errorResponse } from "@/server/http";

const bodySchema = z.object({
  restaurantId: z.string().min(1),
  address: addressSchema,
  orderValueOre: z.number().int().nonnegative().optional(),
  provider: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    if (body.restaurantId !== restaurantIdFromEnv()) {
      return NextResponse.json({ code: "VALIDATION", message: "Unknown restaurant." }, { status: 400 });
    }
    const quoted = await quoteDeliveryOptions(body.address, body.orderValueOre ?? 0, body.provider);
    return NextResponse.json(publicDeliveryPayload(quoted));
  } catch (error) {
    return errorResponse(error);
  }
}
