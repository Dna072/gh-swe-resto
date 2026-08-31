import { NextResponse } from "next/server";
import { z } from "zod";
import { newId } from "@/lib/ids";
import type { Promotion, PromotionType } from "@/domains/promotions/models";
import { requireAdmin } from "@/server/admin-auth";
import { promotionRepository, restaurantIdFromEnv } from "@/server/composition";
import { errorResponse } from "@/server/http";

const TYPES = ["PERCENTAGE", "FIXED", "FREE_DELIVERY"] as const satisfies readonly PromotionType[];

const promotionSchema = z.object({
  id: z.string().min(1).max(80).optional(),
  code: z.string().min(2).max(40),
  type: z.enum(TYPES),
  percentOff: z.number().min(0).max(100).optional(),
  amountOffOre: z.number().int().nonnegative().optional(),
  minimumOrderOre: z.number().int().nonnegative().optional(),
  firstOrderOnly: z.boolean().default(false),
  memberOnly: z.boolean().default(false),
  active: z.boolean().default(true),
  startsAt: z.string().max(40).optional(),
  expiresAt: z.string().max(40).optional(),
});

function toPromotion(input: z.infer<typeof promotionSchema>, existing?: Promotion): Promotion {
  const now = new Date().toISOString();
  return {
    id: existing?.id ?? input.id ?? newId(),
    restaurantId: restaurantIdFromEnv(),
    code: input.code.trim().toUpperCase(),
    type: input.type,
    percentOff: input.type === "PERCENTAGE" ? input.percentOff : undefined,
    amountOffOre: input.type === "FIXED" ? input.amountOffOre : undefined,
    minimumOrderOre: input.minimumOrderOre,
    firstOrderOnly: input.firstOrderOnly,
    memberOnly: input.memberOnly,
    startsAt: input.startsAt,
    expiresAt: input.expiresAt,
    redemptionCount: existing?.redemptionCount ?? 0,
    stackable: existing?.stackable ?? false,
    active: input.active,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request, "promotions:read");
    const promotions = await promotionRepository.list(restaurantIdFromEnv());
    return NextResponse.json({ promotions });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request, "promotions:write");
    const body = promotionSchema.parse(await request.json());
    const saved = await promotionRepository.save(toPromotion(body));
    return NextResponse.json({ promotion: saved });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin(request, "promotions:write");
    const body = promotionSchema.parse(await request.json());
    if (!body.id) {
      const saved = await promotionRepository.save(toPromotion(body));
      return NextResponse.json({ promotion: saved });
    }
    const existing = await promotionRepository.getById(restaurantIdFromEnv(), body.id);
    const saved = await promotionRepository.save(toPromotion(body, existing ?? undefined));
    return NextResponse.json({ promotion: saved });
  } catch (error) {
    return errorResponse(error);
  }
}
