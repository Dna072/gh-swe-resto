import { NextResponse } from "next/server";
import { z } from "zod";
import { ANALYTICS_EVENTS } from "@/domains/analytics/models";
import { clientIpFromRequest } from "@/lib/geo/client-ip";
import { lookupVisitorLocation } from "@/lib/geo/lookup";
import { nowIso } from "@/lib/time";
import { analyticsService, restaurantIdFromEnv } from "@/server/composition";
import { errorResponse } from "@/server/http";

const trackSchema = z.object({
  name: z.enum(ANALYTICS_EVENTS),
  sessionId: z.string().max(80).optional(),
  properties: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
});

export async function POST(request: Request) {
  try {
    const body = trackSchema.parse(await request.json());
    const location = await lookupVisitorLocation(clientIpFromRequest(request));
    const properties = {
      ...(body.properties ?? {}),
      ...(location.country ? { country: location.country } : {}),
      ...(location.region ? { region: location.region } : {}),
      ...(location.city ? { city: location.city } : {}),
    };
    await analyticsService.track({
      name: body.name,
      occurredAt: nowIso(),
      restaurantId: restaurantIdFromEnv(),
      sessionId: body.sessionId,
      properties,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
