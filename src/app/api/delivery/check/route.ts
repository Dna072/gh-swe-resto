import { NextResponse } from "next/server";
import { z } from "zod";
import { addressSchema } from "@/lib/validation/common";
import { publicDeliveryPayload, quoteDeliveryOptions } from "@/server/checkout";
import { errorResponse } from "@/server/http";

const checkSchema = z.union([
  addressSchema,
  z.object({
    postalCode: z.string().min(3).max(12),
    city: z.string().max(80).optional(),
    line1: z.string().max(200).optional(),
    formatted: z.string().max(300).optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
  }),
]);

export async function POST(request: Request) {
  try {
    const body = checkSchema.parse(await request.json());
    const quoted = await quoteDeliveryOptions({
      line1: "line1" in body && body.line1 ? body.line1 : "Delivery check",
      postalCode: body.postalCode,
      city: body.city ?? "",
      country: "SE",
      lat: "lat" in body ? body.lat : undefined,
      lng: "lng" in body ? body.lng : undefined,
      formatted: "formatted" in body ? body.formatted : undefined,
    });
    return NextResponse.json(publicDeliveryPayload(quoted));
  } catch (error) {
    return errorResponse(error);
  }
}
