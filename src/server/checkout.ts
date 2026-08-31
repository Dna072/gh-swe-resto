import "server-only";

import type { AddressSnapshot } from "@/domains/shared/types";
import { AppError } from "@/lib/errors";
import { formatSek } from "@/lib/money";
import { resolveAdvanceDeliverySlot } from "@/domains/fulfillment/advance-slot";
import { toPublicDeliveryOption } from "@/domains/delivery/public";
import {
  deliverySelector,
  ensureDeliverySettings,
  getDeliverySettings,
  mapsPort,
  restaurantIdFromEnv,
  restaurantSettings,
} from "@/server/composition";

export { resolveAdvanceDeliverySlot };

export async function resolveDropoff(dropoff: AddressSnapshot): Promise<AddressSnapshot> {
  const maps = mapsPort();
  if (dropoff.lat != null && dropoff.lng != null) {
    return { ...dropoff, country: dropoff.country || "SE" };
  }
  const place = await maps.geocode(dropoff);
  if (!place) {
    throw new AppError("VALIDATION", "We couldn't find that address. Please try another search.");
  }
  return {
    ...dropoff,
    country: dropoff.country || "SE",
    lat: place.lat,
    lng: place.lng,
    formatted: place.formattedAddress,
  };
}

export async function quoteDeliveryOptions(dropoff: AddressSnapshot, orderValueOre = 0, selectedProvider?: string) {
  await ensureDeliverySettings();
  const resolved = await resolveDropoff(dropoff);
  const pickup = {
    ...restaurantSettings().pickup,
    country: "SE" as const,
    lat: 59.8581,
    lng: 17.646,
  };
  const result = await deliverySelector.options({
    restaurantId: restaurantIdFromEnv(),
    pickup,
    dropoff: resolved,
    orderValueOre,
  });
  const selected = result.length === 0 ? null : deliverySelector.pick(result, selectedProvider);
  const publicOptions = result.map(toPublicDeliveryOption);
  return {
    deliverable: result.length > 0,
    address: resolved,
    lat: resolved.lat,
    lng: resolved.lng,
    formattedAddress: resolved.formatted,
    customerCanSelect: getDeliverySettings().customerCanSelect,
    options: publicOptions,
    selected,
    selectedPublic: selected ? toPublicDeliveryOption(selected) : null,
  };
}

export async function quoteDelivery(dropoff: AddressSnapshot, orderValueOre = 0, selectedProvider?: string) {
  const quoted = await quoteDeliveryOptions(dropoff, orderValueOre, selectedProvider);
  if (!quoted.selected) {
    throw new AppError("DELIVERY_UNAVAILABLE", "Sorry, we currently can't deliver to this address.");
  }
  const option = quoted.selected;
  return {
    deliverable: true as const,
    feeOre: option.customerDeliveryFeeOre,
    feeLabel: formatSek(option.customerDeliveryFeeOre),
    etaMinutes: option.estimatedDeliveryMinutes,
    provider: option.provider,
    displayName: option.displayName,
    quoteId: option.quoteId,
    expiresAt: option.expiresAt,
    quotedAt: option.quotedAt,
    providerDeliveryCostOre: option.providerDeliveryCostOre,
    customerDeliveryFeeOre: option.customerDeliveryFeeOre,
    restaurantMarkupOre: option.restaurantMarkupOre,
    restaurantSubsidyOre: option.restaurantSubsidyOre,
    pricingStrategy: option.pricingStrategy,
    ceilingTriggered: option.ceilingTriggered,
    lat: quoted.lat,
    lng: quoted.lng,
    formattedAddress: quoted.formattedAddress,
    address: quoted.address,
    customerCanSelect: quoted.customerCanSelect,
    options: quoted.options,
  };
}

export function publicDeliveryPayload(quoted: Awaited<ReturnType<typeof quoteDeliveryOptions>>) {
  return {
    deliverable: quoted.deliverable,
    address: quoted.address,
    lat: quoted.lat,
    lng: quoted.lng,
    formattedAddress: quoted.formattedAddress,
    customerCanSelect: quoted.customerCanSelect,
    options: quoted.options,
    selected: quoted.selectedPublic,
  };
}
