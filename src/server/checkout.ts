import "server-only";

import type { AddressSnapshot } from "@/domains/shared/types";
import { resolveUppsalaDropoff } from "@/domains/delivery/uppsala-zone";
import { resolveAdvanceDeliverySlot } from "@/domains/fulfillment/advance-slot";
import { formatSek } from "@/lib/money";
import {
  deliveryService,
  deliveryZones,
  mapsPort,
  restaurantIdFromEnv,
  restaurantSettings,
} from "@/server/composition";

export { resolveAdvanceDeliverySlot };

export async function quoteDelivery(dropoff: AddressSnapshot, orderValueOre = 0) {
  const maps = mapsPort();
  const resolved = await resolveUppsalaDropoff(dropoff, maps);
  const zone = deliveryService.validateZone(resolved, deliveryZones(), {
    allowCityWide: Boolean(maps && resolved.lat != null && resolved.lng != null),
  });
  const quote = await deliveryService.quote(
    {
      restaurantId: restaurantIdFromEnv(),
      pickup: restaurantSettings().pickup,
      dropoff: resolved,
      orderValueOre,
    },
    zone,
  );
  return {
    deliverable: true as const,
    zoneId: zone.id,
    zoneName: zone.name,
    feeOre: quote.feeOre,
    feeLabel: formatSek(quote.feeOre),
    etaMinutes: quote.etaMinutes,
    provider: quote.provider,
    quoteId: quote.quoteId,
    pickupEstimate: quote.pickupEstimate,
    deliveryEstimate: quote.deliveryEstimate,
    expiresAt: quote.expiresAt,
    lat: resolved.lat,
    lng: resolved.lng,
    formattedAddress: resolved.formatted,
    address: resolved,
  };
}
