import { NextResponse } from "next/server";
import { z } from "zod";
import { menuAdminService, restaurantIdFromEnv } from "@/server/composition";
import { requireAdmin } from "@/server/admin-auth";
import { errorResponse } from "@/server/http";

const homepageSchema = z.object({
  hero: z.object({
    eyebrow: z.string().max(40),
    title: z.string().min(1).max(160),
    subtitle: z.string().max(300),
    primaryCta: z.object({ label: z.string().min(1).max(40), href: z.string().min(1).max(200) }),
    secondaryCta: z.object({ label: z.string().min(1).max(40), href: z.string().min(1).max(200) }),
  }),
  featuredMealIds: z.array(z.string()).max(8),
  story: z.object({
    eyebrow: z.string().max(40),
    title: z.string().min(1).max(160),
    body: z.string().min(1).max(2000),
  }),
  delivery: z.object({
    eyebrow: z.string().max(40),
    title: z.string().min(1).max(160),
    body: z.string().min(1).max(1000),
  }),
  promotional: z.object({
    eyebrow: z.string().max(40),
    title: z.string().min(1).max(160),
    body: z.string().min(1).max(1000),
  }),
});

export async function GET(request: Request) {
  try {
    await requireAdmin(request, "settings:read");
    const homepage = await menuAdminService.getHomepage(restaurantIdFromEnv());
    return NextResponse.json({ homepage });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin(request, "settings:write");
    const body = homepageSchema.parse(await request.json());
    const current = await menuAdminService.getHomepage(restaurantIdFromEnv());
    const homepage = await menuAdminService.saveHomepage({
      ...current,
      ...body,
      hero: { ...current.hero, ...body.hero },
    });
    return NextResponse.json({ homepage });
  } catch (error) {
    return errorResponse(error);
  }
}
