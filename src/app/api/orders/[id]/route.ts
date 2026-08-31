import { NextResponse } from "next/server";
import { orderService } from "@/server/composition";
import { optionalSession } from "@/server/customer-auth";
import { errorResponse } from "@/server/http";
import { toPublicOrder } from "@/server/public-order";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const token = new URL(request.url).searchParams.get("token") ?? undefined;
    const actor = await optionalSession(request);
    const order = await orderService.getForCustomer(id, token, actor);
    return NextResponse.json(toPublicOrder(order));
  } catch (error) {
    return errorResponse(error);
  }
}
