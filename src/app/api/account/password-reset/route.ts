import { NextResponse } from "next/server";
import { z } from "zod";
import { customerService } from "@/server/composition";
import { errorResponse } from "@/server/http";
import { assertRateLimit, rateLimitKey } from "@/server/rate-limit";

const schema = z.object({
  email: z.email(),
});

export async function POST(request: Request) {
  try {
    assertRateLimit(rateLimitKey(request, "account-reset"), 8, 10 * 60 * 1000);
    const body = schema.parse(await request.json());
    await customerService.requestPasswordReset(body.email);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
