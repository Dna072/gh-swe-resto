import { NextResponse } from "next/server";
import { z } from "zod";
import { customerService } from "@/server/composition";
import { errorResponse } from "@/server/http";
import { assertRateLimit, rateLimitKey } from "@/server/rate-limit";

const schema = z.object({
  email: z.email(),
  password: z.string().min(8),
  name: z.string().min(1).max(80),
  phone: z.string().min(6).max(30).optional(),
  marketingOptIn: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    assertRateLimit(rateLimitKey(request, "account-register"), 8, 10 * 60 * 1000);
    const body = schema.parse(await request.json());
    const result = await customerService.register(body);
    return NextResponse.json({
      customer: {
        id: result.customer.id,
        email: result.customer.email,
        name: result.customer.name,
        phone: result.customer.phone,
      },
      localToken: result.localToken,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
