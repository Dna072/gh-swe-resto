import { NextResponse } from "next/server";
import { orderService } from "@/server/composition";
import { errorResponse } from "@/server/http";
import { toPublicOrder } from "@/server/public-order";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const token = new URL(request.url).searchParams.get("token") ?? undefined;
    const order = await orderService.cancel(id, token);
    return NextResponse.json(toPublicOrder(order));
  } catch (error) {
    return errorResponse(error);
  }
}
