import { NextResponse } from "next/server";
import { z } from "zod";
import { formatSek } from "@/lib/money";
import { deliveryService, deliveryZones } from "@/server/composition";
import { errorResponse } from "@/server/http";

const checkSchema = z.object({
  postalCode: z.string().min(3).max(12),
  city: z.string().max(80).optional(),
});

export async function POST(request: Request) {
  try {
    const body = checkSchema.parse(await request.json());
    const zone = deliveryService.validateZone(
      {
        line1: "Delivery area check",
        postalCode: body.postalCode,
        city: body.city ?? "Uppsala",
        country: "SE",
      },
      deliveryZones(),
    );
    return NextResponse.json({
      deliverable: true,
      zoneId: zone.id,
      zoneName: zone.name,
      feeOre: zone.baseFeeOre,
      feeLabel: formatSek(zone.baseFeeOre),
      etaMinutes: zone.etaMinutes,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
