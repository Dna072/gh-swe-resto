import { NextResponse } from "next/server";
import { orderService, paymentProvider, paymentService } from "@/server/composition";
import { errorResponse } from "@/server/http";
import { toPublicOrder } from "@/server/public-order";
import { getEnv } from "@/lib/env";
import { MockPaymentProvider } from "@/infrastructure/payments/mock-provider";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const token = new URL(request.url).searchParams.get("token") ?? undefined;
    if (!token) {
      return NextResponse.json({ code: "UNAUTHORIZED", message: "Guest access token is required." }, { status: 401 });
    }
    const order = await orderService.getForCustomer(id, token);
    const session = await paymentService.createPayment({
      orderId: order.id,
      amountOre: order.totalOre,
      currency: "SEK",
      customerEmail: order.customerSnapshot.email,
      idempotencyKey: `pay:${order.id}`,
      returnUrl: `${getEnv().APP_BASE_URL ?? "http://localhost:3000"}/orders/${order.id}`,
    });
    if (session.provider === "mock" && paymentProvider instanceof MockPaymentProvider) {
      paymentProvider.succeed(session.providerPaymentId);
      const paid = await orderService.markPaid(id, token);
      return NextResponse.json({ order: toPublicOrder(paid), payment: { ...session, status: "succeeded" } });
    }
    return NextResponse.json({ order: toPublicOrder(order), payment: session });
  } catch (error) {
    return errorResponse(error);
  }
}
