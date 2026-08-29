import "server-only";

import type { AddressSnapshot } from "@/domains/shared/types";
import { formatSek } from "@/lib/money";
import {
  deliveryService,
  deliveryZones,
  restaurantIdFromEnv,
  restaurantSettings,
} from "@/server/composition";

export async function quoteDelivery(dropoff: AddressSnapshot, orderValueOre = 0) {
  const zone = deliveryService.validateZone(dropoff, deliveryZones());
  const quote = await deliveryService.quote(
    {
      restaurantId: restaurantIdFromEnv(),
      pickup: restaurantSettings().pickup,
      dropoff,
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
  };
}
