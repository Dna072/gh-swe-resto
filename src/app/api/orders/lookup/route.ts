import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import { orderService, restaurantIdFromEnv } from "@/server/composition";
import { errorResponse } from "@/server/http";
import { toPublicOrder } from "@/server/public-order";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const number = url.searchParams.get("number")?.trim() ?? "";
    const token = url.searchParams.get("token")?.trim() ?? "";
    if (!number || !token) {
      throw new AppError("VALIDATION", "Order number and access token are required.");
    }
    const found = await orderService.getByPublicNumber(restaurantIdFromEnv(), number);
    if (!found) {
      throw new AppError("NOT_FOUND", "Order not found.");
    }
    const order = await orderService.getForCustomer(found.id, token);
    return NextResponse.json(toPublicOrder(order));
  } catch (error) {
    return errorResponse(error);
  }
}
