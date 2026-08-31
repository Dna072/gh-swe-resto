import { NextResponse } from "next/server";
import { orderService, paymentService } from "@/server/composition";
import { errorResponse } from "@/server/http";
import { notifyOrder } from "@/server/order-events";
import { toPublicOrder } from "@/server/public-order";

function headerMap(request: Request): Record<string, string | undefined> {
  return Object.fromEntries(request.headers.entries());
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const result = await paymentService.processWebhook(rawBody, headerMap(request));
    if (result.duplicate) {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    if (result.event.status !== "succeeded") {
      return NextResponse.json({ ok: true, duplicate: false, status: result.event.status });
    }
    const parsed = JSON.parse(rawBody) as { orderId?: string };
    const found = await orderService.findByPayment(result.event.providerPaymentId, parsed.orderId);
    if (!found) {
      return NextResponse.json({ ok: true, duplicate: false, unmatched: true });
    }
    const paid = await orderService.settlePaid(found, result.event.providerPaymentId);
    await notifyOrder(paid);
    return NextResponse.json({ ok: true, duplicate: false, order: toPublicOrder(paid) });
  } catch (error) {
    return errorResponse(error);
  }
}
