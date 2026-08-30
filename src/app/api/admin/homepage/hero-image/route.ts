import { NextResponse } from "next/server";
import { menuAdminService, restaurantIdFromEnv } from "@/server/composition";
import { requireAdmin } from "@/server/admin-auth";
import { errorResponse } from "@/server/http";

export async function POST(request: Request) {
  try {
    await requireAdmin(request, "settings:write");
    const form = await request.formData();
    const file = form.get("file");
    const altText = String(form.get("altText") ?? "").trim();
    const mobile = String(form.get("mobile") ?? "") === "true";
    if (!(file instanceof File) || !altText) {
      return NextResponse.json({ code: "VALIDATION", message: "Photograph and alt text are required." }, { status: 400 });
    }
    const homepage = await menuAdminService.setHeroImage(
      restaurantIdFromEnv(),
      Buffer.from(await file.arrayBuffer()),
      file.type,
      altText,
      mobile,
    );
    return NextResponse.json({ homepage });
  } catch (error) {
    return errorResponse(error);
  }
}
