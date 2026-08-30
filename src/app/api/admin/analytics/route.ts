import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/admin-auth";
import { reportsService, restaurantIdFromEnv } from "@/server/composition";
import { errorResponse } from "@/server/http";

export async function GET(request: Request) {
  try {
    const actor = await requireAdmin(request, "reports:read");
    const overview = await reportsService.overview(actor, restaurantIdFromEnv());
    return NextResponse.json(overview);
  } catch (error) {
    return errorResponse(error);
  }
}
