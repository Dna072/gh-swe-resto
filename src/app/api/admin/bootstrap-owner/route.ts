import { NextResponse } from "next/server";
import { z } from "zod";
import { adminTokenFromRequest } from "@/server/admin-auth";
import { adminBootstrapService } from "@/server/composition";
import { errorResponse } from "@/server/http";
import { getEnv } from "@/lib/env";
import { assertRateLimit, rateLimitKey } from "@/server/rate-limit";
import { suppressFirebaseDefaultEmails } from "@/infrastructure/firebase/auth-emails";

const bodySchema = z.object({
  email: z.email(),
  displayName: z.string().min(1).max(80),
});

export async function GET() {
  try {
    return NextResponse.json({ available: await adminBootstrapService.isAvailable() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    assertRateLimit(rateLimitKey(request, "admin-bootstrap"), 5, 15 * 60 * 1000);
    const body = bodySchema.parse(await request.json());
    const result = await adminBootstrapService.createFirstOwner(adminTokenFromRequest(request), body);
    void suppressFirebaseDefaultEmails();
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
