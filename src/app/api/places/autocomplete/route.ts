import { NextResponse } from "next/server";
import { z } from "zod";
import { getLocale } from "@/lib/i18n/server";
import { mapsPort } from "@/server/composition";
import { errorResponse } from "@/server/http";

const bodySchema = z.object({
  input: z.string().min(1).max(200),
  sessionToken: z.string().max(80).optional(),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const maps = mapsPort();
    const locale = await getLocale();
    const predictions = await maps.autocomplete(body.input, {
      language: locale,
      sessionToken: body.sessionToken,
    });
    return NextResponse.json({ predictions, mapsConfigured: true });
  } catch (error) {
    return errorResponse(error);
  }
}
