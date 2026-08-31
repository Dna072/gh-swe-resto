import { NextResponse } from "next/server";
import { z } from "zod";
import {
  deliveryDispatch,
  orderService,
  paymentService,
} from "@/server/composition";
import { requireAdmin } from "@/server/admin-auth";
import { errorResponse } from "@/server/http";
import { notifyOrder } from "@/server/order-events";
import { toStaffOrder } from "@/server/staff-order";

const schema = z.object({
  amountOre: z.number().int().positive().optional(),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireAdmin(request, "orders:refund");
    const { id } = await context.params;
    const body = schema.parse(await request.json().catch(() => ({})));
    const current = await orderService.getForStaff(actor, id);
    const providerPaymentId = current.paymentProviderId ?? `mock_pay:${current.id}`;
    await paymentService.refund({
      providerPaymentId,
      amountOre: body.amountOre ?? current.totalOre,
      idempotencyKey: `refund:${current.id}`,
    });
    const order = await orderService.refund(actor, id);
    await deliveryDispatch.cancelIfCreated(order);
    await notifyOrder(order);
    return NextResponse.json({ order: toStaffOrder(order) });
  } catch (error) {
    return errorResponse(error);
  }
}
