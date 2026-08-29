import { NextResponse } from "next/server";
import { z } from "zod";
import { ANALYTICS_EVENTS } from "@/domains/analytics/models";
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
    await analyticsService.track({
      name: body.name,
      occurredAt: nowIso(),
      restaurantId: restaurantIdFromEnv(),
      sessionId: body.sessionId,
      properties: body.properties ?? {},
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
