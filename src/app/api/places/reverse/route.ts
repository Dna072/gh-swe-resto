import { NextResponse } from "next/server";
import { z } from "zod";
import { getLocale } from "@/lib/i18n/server";
import { mapsPort } from "@/server/composition";
import { errorResponse } from "@/server/http";

const bodySchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const maps = mapsPort();
    if (!maps.reverseGeocode) {
      return NextResponse.json({ address: null });
    }
    const locale = await getLocale();
    const address = await maps.reverseGeocode(body.lat, body.lng, locale);
    return NextResponse.json({ address });
  } catch (error) {
    return errorResponse(error);
  }
}
