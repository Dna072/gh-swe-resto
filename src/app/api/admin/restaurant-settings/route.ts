import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/server/admin-auth";
import {
  ensureRestaurantSettings,
  restaurantIdFromEnv,
  saveRestaurantSettings,
} from "@/server/composition";
import { errorResponse } from "@/server/http";
import { defaultRestaurantSettings } from "@/domains/restaurant/settings";

const schema = z.object({
  orderingPaused: z.boolean(),
});

export async function GET(request: Request) {
  try {
    await requireAdmin(request, "settings:read");
    return NextResponse.json({ settings: await ensureRestaurantSettings() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin(request, "settings:write");
    const body = schema.parse(await request.json());
    const saved = await saveRestaurantSettings({
      ...defaultRestaurantSettings(restaurantIdFromEnv()),
      restaurantId: restaurantIdFromEnv(),
      orderingPaused: body.orderingPaused,
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.json({ settings: saved });
  } catch (error) {
    return errorResponse(error);
  }
}
