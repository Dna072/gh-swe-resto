import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError } from "@/lib/errors";
import { ORDER_STATUSES } from "@/domains/orders/models";
import { deliveryDispatch, orderService, printingService, restaurantSettings } from "@/server/composition";
import { requireAdmin } from "@/server/admin-auth";
import { errorResponse } from "@/server/http";
import { notifyOrder } from "@/server/order-events";
import { toStaffOrder } from "@/server/staff-order";

const patchSchema = z.object({
  action: z.enum(["send_to_kitchen", "transition", "claim"]).default("transition"),
  to: z.enum(ORDER_STATUSES).optional(),
});

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireAdmin(request, "orders:read");
    const { id } = await context.params;
    const order = await orderService.getForStaff(actor, id);
    return NextResponse.json({ order: toStaffOrder(order) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return PATCH(request, context);
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireAdmin(request, "orders:transition");
    const { id } = await context.params;
    const body = patchSchema.parse(await request.json());
    if (body.action === "send_to_kitchen") {
      const order = await orderService.sendToKitchen(actor, id);
      const job = await printingService.enqueue(
        actor,
        order,
        restaurantSettings().name,
        `print:${id}:confirm`,
      );
      await notifyOrder(order);
      return NextResponse.json({ order: toStaffOrder(order), job });
    }
    if (body.action === "claim") {
      const order = await orderService.claim(actor, id);
      return NextResponse.json({ order: toStaffOrder(order) });
    }
    if (!body.to) {
      throw new AppError("VALIDATION", "A target status is required.");
    }
    let order =
      body.to === "CANCELLED"
        ? await orderService.cancel(id, undefined, actor)
        : await orderService.transition(actor, id, body.to);
    if (body.to === "CANCELLED") {
      await deliveryDispatch.cancelIfCreated(order);
    } else if (body.to === "READY" || body.to === "COURIER_ASSIGNED") {
      order = await deliveryDispatch.dispatchIfReady(order);
    }
    await notifyOrder(order);
    return NextResponse.json({ order: toStaffOrder(order) });
  } catch (error) {
    return errorResponse(error);
  }
}
