import { NextResponse } from "next/server";
import { z } from "zod";
import { STAFF_ROLES } from "@/lib/security/rbac";
import { requireAdmin } from "@/server/admin-auth";
import { staffService } from "@/server/composition";
import { errorResponse } from "@/server/http";
import { getEnv } from "@/lib/env";

const inviteSchema = z.object({
  email: z.email(),
  displayName: z.string().min(1).max(80),
  role: z.enum(STAFF_ROLES),
});

export async function GET(request: Request) {
  try {
    const actor = await requireAdmin(request, "users:read");
    const staff = await staffService.list(actor);
    return NextResponse.json({
      staff: staff.map((user) => ({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        disabled: user.disabled,
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireAdmin(request, "users:write");
    const body = inviteSchema.parse(await request.json());
    const result = await staffService.invite(actor, body);
    const revealInvite = getEnv().APP_ENV !== "production";
    return NextResponse.json({
      user: {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        role: result.user.role,
      },
      ...(revealInvite ? { inviteUrl: result.inviteUrl } : {}),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
