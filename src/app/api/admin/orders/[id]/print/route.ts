import { NextResponse } from "next/server";
import { printingService, orderService, restaurantSettings } from "@/server/composition";
import { requireAdmin } from "@/server/admin-auth";
import { errorResponse } from "@/server/http";
import { newId } from "@/lib/ids";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireAdmin(request, "orders:print");
    const { id } = await context.params;
    const order = await orderService.getForStaff(actor, id);
    const idempotencyKey = request.headers.get("Idempotency-Key")?.trim() || `print:${id}:${newId()}`;
    const job = await printingService.enqueue(actor, order, restaurantSettings().name, idempotencyKey);
    return NextResponse.json({ job });
  } catch (error) {
    return errorResponse(error);
  }
}
