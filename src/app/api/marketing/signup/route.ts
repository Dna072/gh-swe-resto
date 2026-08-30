import { NextResponse } from "next/server";
import { z } from "zod";
import { sha256Hex } from "@/lib/hash";
import { clientIpFromRequest } from "@/lib/geo/client-ip";
import { lookupVisitorLocation } from "@/lib/geo/lookup";
import { nowIso } from "@/lib/time";
import {
  analyticsService,
  marketingSignupRepository,
  restaurantIdFromEnv,
} from "@/server/composition";
import { errorResponse } from "@/server/http";

const signupSchema = z.object({
  email: z.email(),
  consent: z.literal(true),
  source: z.string().max(40).optional(),
  locale: z.string().max(8).optional(),
});

export async function POST(request: Request) {
  try {
    const body = signupSchema.parse(await request.json());
    const email = body.email.trim().toLowerCase();
    const restaurantId = restaurantIdFromEnv();
    const location = await lookupVisitorLocation(clientIpFromRequest(request));
    await marketingSignupRepository.upsert({
      id: sha256Hex(`${restaurantId}:${email}`).slice(0, 40),
      restaurantId,
      email,
      consentedAt: nowIso(),
      source: body.source,
      locale: body.locale,
      country: location.country,
      city: location.city,
    });
    await analyticsService.track({
      name: "marketing_signup",
      occurredAt: nowIso(),
      restaurantId,
      properties: {
        source: body.source ?? "unknown",
        country: location.country ?? null,
        city: location.city ?? null,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
