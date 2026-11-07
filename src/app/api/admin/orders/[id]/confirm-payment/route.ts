import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/admin-auth";
import { orderService } from "@/server/composition";
import { errorResponse } from "@/server/http";
import { notifyOrder } from "@/server/order-events";
import { toStaffOrder } from "@/server/staff-order";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireAdmin(request, "payments:confirm");
    const { id } = await context.params;
    const order = await orderService.confirmManualPayment(actor, id);
    await notifyOrder(order);
    return NextResponse.json({ order: toStaffOrder(order) });
  } catch (error) {
    return errorResponse(error);
  }
}
