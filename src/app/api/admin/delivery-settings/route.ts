import { NextResponse } from "next/server";
import { z } from "zod";
import { DELIVERY_PRICING_STRATEGIES, validateDeliveryPricingConfig } from "@/domains/delivery/pricing";
import { defaultDeliverySettings, type DeliveryProviderId } from "@/domains/delivery/models";
import { requireAdmin } from "@/server/admin-auth";
import {
  ensureDeliverySettings,
  restaurantIdFromEnv,
  saveDeliverySettings,
} from "@/server/composition";
import { errorResponse } from "@/server/http";
import { DeliveryPricingService } from "@/domains/delivery/pricing";

const settingsSchema = z.object({
  providers: z.array(
    z.object({
      id: z.enum(["wolt_drive", "foodora", "mock"]),
      enabled: z.boolean(),
      displayName: z.string().min(1).max(40),
      priority: z.number().int(),
    }),
  ),
  customerCanSelect: z.boolean(),
  selectionStrategy: z.enum(["customer", "cheapest", "fastest", "preferred"]),
  preferredProvider: z.enum(["wolt_drive", "foodora", "mock"]).optional(),
  pricing: z.object({
    strategy: z.enum(DELIVERY_PRICING_STRATEGIES),
    markupType: z.enum(["FIXED", "PERCENTAGE"]).optional(),
    markupValue: z.number().optional(),
    subsidyType: z.enum(["FIXED", "PERCENTAGE"]).optional(),
    subsidyValue: z.number().optional(),
    markupCeilingOre: z.number().int().optional(),
  }),
});

export async function GET(request: Request) {
  try {
    await requireAdmin(request, "settings:read");
    return NextResponse.json({ settings: await ensureDeliverySettings() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin(request, "settings:write");
    const body = settingsSchema.parse(await request.json());
    validateDeliveryPricingConfig(body.pricing);
    const saved = await saveDeliverySettings({
      ...defaultDeliverySettings(restaurantIdFromEnv()),
      ...body,
      restaurantId: restaurantIdFromEnv(),
      preferredProvider: body.preferredProvider as DeliveryProviderId | undefined,
      pricing: body.pricing,
    });
    return NextResponse.json({ settings: saved });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request, "settings:read");
    const body = z
      .object({
        providerCostOre: z.number().int().nonnegative(),
        pricing: settingsSchema.shape.pricing.optional(),
      })
      .parse(await request.json());
    const pricing = body.pricing
      ? validateDeliveryPricingConfig(body.pricing)
      : (await ensureDeliverySettings()).pricing;
    const priced = new DeliveryPricingService().price(body.providerCostOre, pricing);
    return NextResponse.json({ preview: priced });
  } catch (error) {
    return errorResponse(error);
  }
}
