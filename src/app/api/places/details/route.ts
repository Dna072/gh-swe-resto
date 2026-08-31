import { NextResponse } from "next/server";
import { z } from "zod";
import { getLocale } from "@/lib/i18n/server";
import { mapsPort } from "@/server/composition";
import { errorResponse } from "@/server/http";

const bodySchema = z.object({
  placeId: z.string().min(1).max(300),
  sessionToken: z.string().max(80).optional(),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const maps = mapsPort();
    const locale = await getLocale();
    const address = await maps.placeDetails(body.placeId, {
      language: locale,
      sessionToken: body.sessionToken,
    });
    return NextResponse.json({ address, mapsConfigured: true });
  } catch (error) {
    return errorResponse(error);
  }
}
