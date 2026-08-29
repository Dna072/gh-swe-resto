import { NextResponse } from "next/server";
import { menuDraftSchema } from "@/lib/validation/admin-menu";
import { menuAdminService, menuService, restaurantIdFromEnv } from "@/server/composition";
import { requireAdmin } from "@/server/admin-auth";
import { errorResponse } from "@/server/http";

export async function GET(request: Request) {
  try {
    await requireAdmin(request, "menu:read");
    const restaurantId = restaurantIdFromEnv();
    const items = await menuAdminService.listItems(restaurantId);
    const categories = await menuService.listPublicCategories(restaurantId);
    const groupIds = [...new Set(items.flatMap((item) => item.modifierGroupIds))];
    const modifierGroups = await menuService.getModifierGroups(restaurantId, groupIds);
    return NextResponse.json({ items, categories, modifierGroups });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request, "menu:write");
    const draft = menuDraftSchema.parse(await request.json());
    const item = await menuAdminService.saveItem(restaurantIdFromEnv(), {
      ...draft,
      allergens: draft.allergens as never,
      dietaryTags: draft.dietaryTags as never,
    });
    return NextResponse.json({ item });
  } catch (error) {
    return errorResponse(error);
  }
}
