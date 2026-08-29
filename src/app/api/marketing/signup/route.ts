import { NextResponse } from "next/server";
import { z } from "zod";
import { nowIso } from "@/lib/time";
import { marketingSignups } from "@/server/composition";
import { errorResponse } from "@/server/http";

const signupSchema = z.object({
  email: z.email(),
  consent: z.literal(true),
  source: z.string().max(40).optional(),
});

export async function POST(request: Request) {
  try {
    const body = signupSchema.parse(await request.json());
    const email = body.email.trim().toLowerCase();
    if (!marketingSignups.some((entry) => entry.email === email)) {
      marketingSignups.push({
        email,
        consentedAt: nowIso(),
        source: body.source,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
