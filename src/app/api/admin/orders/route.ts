import { NextResponse } from "next/server";
import { ORDER_STATUSES } from "@/domains/orders/models";
import { orderService, restaurantIdFromEnv } from "@/server/composition";
import { requireAdmin } from "@/server/admin-auth";
import { errorResponse } from "@/server/http";
import { toStaffOrder } from "@/server/staff-order";

export async function GET(request: Request) {
  try {
    const actor = await requireAdmin(request, "orders:read");
    const statusParam = new URL(request.url).searchParams.get("status");
    const status = ORDER_STATUSES.find((value) => value === statusParam);
    const page = await orderService.listForStaff(actor, restaurantIdFromEnv(), status);
    return NextResponse.json({ orders: page.items.map(toStaffOrder) });
  } catch (error) {
    return errorResponse(error);
  }
}
