import { NextResponse } from "next/server";
import { z } from "zod";
import { menuDraftSchema } from "@/lib/validation/admin-menu";
import { menuAdminService, restaurantIdFromEnv } from "@/server/composition";
import { requireAdmin } from "@/server/admin-auth";
import { errorResponse } from "@/server/http";

const archiveSchema = z.object({
  archived: z.boolean(),
});

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request, "menu:read");
    const { id } = await context.params;
    const item = await menuAdminService.getItem(restaurantIdFromEnv(), id);
    return NextResponse.json({ item });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request, "menu:write");
    const { id } = await context.params;
    const draft = menuDraftSchema.parse(await request.json());
    const item = await menuAdminService.saveItem(restaurantIdFromEnv(), {
      ...draft,
      id,
      allergens: draft.allergens as never,
      dietaryTags: draft.dietaryTags as never,
    });
    return NextResponse.json({ item });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request, "menu:write");
    const { id } = await context.params;
    const body = archiveSchema.parse(await request.json());
    const item = await menuAdminService.setArchived(restaurantIdFromEnv(), id, body.archived);
    return NextResponse.json({ item });
  } catch (error) {
    return errorResponse(error);
  }
}
