import { NextResponse } from "next/server";
import { orderService } from "@/server/composition";
import { errorResponse } from "@/server/http";
import { toPublicDelivery } from "@/server/public-delivery";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const token = new URL(request.url).searchParams.get("token") ?? undefined;
    const order = await orderService.getDeliveryForCustomer(id, token);
    return NextResponse.json(toPublicDelivery(order));
  } catch (error) {
    return errorResponse(error);
  }
}
