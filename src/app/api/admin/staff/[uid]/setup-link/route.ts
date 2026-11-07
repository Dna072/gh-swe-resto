import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/admin-auth";
import { staffService } from "@/server/composition";
import { errorResponse } from "@/server/http";

export async function POST(request: Request, context: { params: Promise<{ uid: string }> }) {
  try {
    const actor = await requireAdmin(request, "users:write");
    const { uid } = await context.params;
    const result = await staffService.createSetupLink(actor, uid);
    return NextResponse.json({
      email: result.email,
      inviteUrl: result.inviteUrl,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
