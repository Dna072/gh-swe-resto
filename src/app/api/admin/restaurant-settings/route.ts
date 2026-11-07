import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/server/admin-auth";
import {
  ensureRestaurantSettings,
  restaurantIdFromEnv,
  saveRestaurantSettings,
} from "@/server/composition";
import { errorResponse } from "@/server/http";

const schema = z.object({
  orderingPaused: z.boolean(),
  swishPayee: z.string().trim().max(40).optional(),
  swishQrUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined))
    .refine((value) => value === undefined || /^https?:\/\//i.test(value), {
      message: "Swish QR URL must start with http:// or https://",
    }),
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
    const current = await ensureRestaurantSettings();
    const saved = await saveRestaurantSettings({
      ...current,
      restaurantId: restaurantIdFromEnv(),
      orderingPaused: body.orderingPaused,
      swishPayee: body.swishPayee?.trim() || current.swishPayee,
      swishQrUrl: body.swishQrUrl,
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.json({ settings: saved });
  } catch (error) {
    return errorResponse(error);
  }
}
