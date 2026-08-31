import { NextResponse } from "next/server";
import { z } from "zod";
import { orderService, reviewService } from "@/server/composition";
import { requireCustomer } from "@/server/customer-auth";
import { errorResponse } from "@/server/http";

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(600).optional(),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireCustomer(request);
    const { id } = await context.params;
    const body = schema.parse(await request.json());
    const order = await orderService.getForCustomer(id, undefined, actor);
    const review = await reviewService.submit(actor, order, body);
    return NextResponse.json({ review });
  } catch (error) {
    return errorResponse(error);
  }
}
