import { NextResponse } from "next/server";
import { z } from "zod";
import { customerService } from "@/server/composition";
import { errorResponse } from "@/server/http";
import { assertRateLimit, rateLimitKey } from "@/server/rate-limit";

const schema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    assertRateLimit(rateLimitKey(request, "account-login"), 20, 10 * 60 * 1000);
    const body = schema.parse(await request.json());
    const result = await customerService.login(body.email, body.password);
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
