import { NextResponse } from "next/server";
import { orderService, reviewService } from "@/server/composition";
import { requireCustomer } from "@/server/customer-auth";
import { errorResponse } from "@/server/http";
import { toPublicOrder } from "@/server/public-order";

export async function GET(request: Request) {
  try {
    const actor = await requireCustomer(request);
    const page = await orderService.listForCustomer(actor);
    const reviews = await reviewService.listForCustomer(actor);
    const reviewed = new Set(reviews.map((review) => review.orderId));
    return NextResponse.json({
      orders: page.items.map((order) => ({
        ...toPublicOrder(order),
        reviewed: reviewed.has(order.id),
        review: reviews.find((review) => review.orderId === order.id) ?? null,
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
