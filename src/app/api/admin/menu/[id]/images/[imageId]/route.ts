import { NextResponse } from "next/server";
import { z } from "zod";
import { menuAdminService, restaurantIdFromEnv } from "@/server/composition";
import { requireAdmin } from "@/server/admin-auth";
import { errorResponse } from "@/server/http";

const patchSchema = z.object({
  action: z.enum(["primary", "remove", "focus"]),
  focalPointX: z.number().min(0).max(1).optional(),
  focalPointY: z.number().min(0).max(1).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; imageId: string }> },
) {
  try {
    await requireAdmin(request, "menu:write");
    const { id, imageId } = await context.params;
    const body = patchSchema.parse(await request.json());
    const restaurantId = restaurantIdFromEnv();
    if (body.action === "remove") {
      return NextResponse.json({ item: await menuAdminService.removeImage(restaurantId, id, imageId) });
    }
    if (body.action === "primary") {
      return NextResponse.json({ item: await menuAdminService.setPrimaryImage(restaurantId, id, imageId) });
    }
    if (body.focalPointX === undefined || body.focalPointY === undefined) {
      return NextResponse.json({ code: "VALIDATION", message: "Focal point is required." }, { status: 400 });
    }
    return NextResponse.json({
      item: await menuAdminService.setImageFocus(restaurantId, id, imageId, body.focalPointX, body.focalPointY),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string; imageId: string }> },
) {
  try {
    await requireAdmin(request, "menu:write");
    const { id, imageId } = await context.params;
    const form = await request.formData();
    const file = form.get("file");
    const altText = String(form.get("altText") ?? "").trim();
    if (!(file instanceof File) || !altText) {
      return NextResponse.json({ code: "VALIDATION", message: "Photograph and alt text are required." }, { status: 400 });
    }
    const item = await menuAdminService.replaceImage(
      restaurantIdFromEnv(),
      id,
      imageId,
      Buffer.from(await file.arrayBuffer()),
      file.type,
      altText,
    );
    return NextResponse.json({ item });
  } catch (error) {
    return errorResponse(error);
  }
}
