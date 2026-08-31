import { NextResponse } from "next/server";
import { z } from "zod";
import { newId } from "@/lib/ids";
import { parsePostalCodes } from "@/lib/geo/postal";
import type { DeliveryZone } from "@/domains/delivery/models";
import { requireAdmin } from "@/server/admin-auth";
import { ensureDeliveryZones, restaurantIdFromEnv, saveDeliveryZones } from "@/server/composition";
import { errorResponse } from "@/server/http";
import { AppError } from "@/lib/errors";

const zoneSchema = z.object({
  id: z.string().min(1).max(80).optional(),
  name: z.string().min(1).max(80),
  postalCodes: z.union([z.string(), z.array(z.string())]),
  active: z.boolean().default(true),
  baseFeeOre: z.number().int().nonnegative().optional(),
  etaMinutes: z.number().int().positive().optional(),
});

const bodySchema = z.object({
  zones: z.array(zoneSchema),
});

function toZone(input: z.infer<typeof zoneSchema>, restaurantId: string, existing?: DeliveryZone): DeliveryZone {
  const postalCodes = parsePostalCodes(
    Array.isArray(input.postalCodes) ? input.postalCodes.join("\n") : input.postalCodes,
  );
  if (postalCodes.length === 0) {
    throw new AppError("VALIDATION", "Each area needs at least one five-digit postcode.");
  }
  return {
    id: existing?.id ?? input.id ?? newId(),
    restaurantId,
    name: input.name.trim(),
    postalCodes,
    baseFeeOre: input.baseFeeOre ?? existing?.baseFeeOre ?? 4900,
    etaMinutes: input.etaMinutes ?? existing?.etaMinutes ?? 40,
    active: input.active,
    providers: existing?.providers ?? ["wolt_drive", "foodora", "mock"],
  };
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request, "settings:read");
    return NextResponse.json({ zones: await ensureDeliveryZones() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin(request, "settings:write");
    const body = bodySchema.parse(await request.json());
    if (body.zones.length === 0) {
      throw new AppError("VALIDATION", "Add at least one delivery area with postcodes.");
    }
    const restaurantId = restaurantIdFromEnv();
    const current = await ensureDeliveryZones();
    const byId = new Map(current.map((zone) => [zone.id, zone]));
    const zones = body.zones.map((zone) => toZone(zone, restaurantId, zone.id ? byId.get(zone.id) : undefined));
    const saved = await saveDeliveryZones(zones);
    return NextResponse.json({ zones: saved });
  } catch (error) {
    return errorResponse(error);
  }
}
