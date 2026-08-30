import { NextResponse } from "next/server";
import { menuAdminService, restaurantIdFromEnv } from "@/server/composition";
import { requireAdmin } from "@/server/admin-auth";
import { errorResponse } from "@/server/http";

export async function POST(request: Request) {
  try {
    await requireAdmin(request, "menu:write");
    const result = await menuAdminService.cleanupRetiredImages(restaurantIdFromEnv());
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
