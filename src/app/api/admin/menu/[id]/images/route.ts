import { NextResponse } from "next/server";
import { menuAdminService, restaurantIdFromEnv } from "@/server/composition";
import { requireAdmin } from "@/server/admin-auth";
import { errorResponse } from "@/server/http";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request, "menu:write");
    const { id } = await context.params;
    const form = await request.formData();
    const file = form.get("file");
    const altText = String(form.get("altText") ?? "").trim();
    if (!(file instanceof File)) {
      return NextResponse.json({ code: "VALIDATION", message: "Choose a photograph." }, { status: 400 });
    }
    if (!altText) {
      return NextResponse.json({ code: "VALIDATION", message: "Describe the meal in alt text." }, { status: 400 });
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    const item = await menuAdminService.addImage(
      restaurantIdFromEnv(),
      id,
      bytes,
      file.type,
      altText,
    );
    return NextResponse.json({ item });
  } catch (error) {
    return errorResponse(error);
  }
}
