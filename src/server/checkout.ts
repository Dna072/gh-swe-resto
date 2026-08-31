import "server-only";

import type { AddressSnapshot } from "@/domains/shared/types";
import { AppError } from "@/lib/errors";
import { formatSek } from "@/lib/money";
import { resolveAdvanceDeliverySlot } from "@/domains/fulfillment/advance-slot";
import { toPublicDeliveryOption } from "@/domains/delivery/public";
import {
  deliverySelector,
  deliveryService,
  ensureDeliverySettings,
  ensureDeliveryZones,
  getDeliverySettings,
  getDeliveryZones,
  mapsPort,
  restaurantIdFromEnv,
  restaurantSettings,
} from "@/server/composition";
import { extractPostalCode } from "@/lib/geo/postal";

export { resolveAdvanceDeliverySlot };

export async function resolveDropoff(dropoff: AddressSnapshot): Promise<AddressSnapshot> {
  const extracted = extractPostalCode(dropoff.line1, dropoff.formatted, dropoff.postalCode);
  const withPostal =
    (!dropoff.postalCode || dropoff.postalCode === "00000") && extracted
      ? { ...dropoff, postalCode: extracted }
      : dropoff;
  const maps = mapsPort();
  if (withPostal.lat != null && withPostal.lng != null) {
    return {
      ...withPostal,
      country: withPostal.country || "SE",
      postalCode: withPostal.postalCode && withPostal.postalCode !== "00000" ? withPostal.postalCode : extracted ?? withPostal.postalCode,
    };
  }
  const place = await maps.geocode(withPostal);
  if (!place) {
    throw new AppError("VALIDATION", "We couldn't find that address. Please try another search.");
  }
  return {
    ...withPostal,
    country: withPostal.country || "SE",
    lat: place.lat,
    lng: place.lng,
    formatted: place.formattedAddress,
    postalCode:
      (withPostal.postalCode && withPostal.postalCode !== "00000" ? withPostal.postalCode : undefined) ??
      extractPostalCode(place.formattedAddress, withPostal.line1) ??
      withPostal.postalCode,
  };
}

export async function quoteDeliveryOptions(dropoff: AddressSnapshot, orderValueOre = 0, selectedProvider?: string) {
  await ensureDeliverySettings();
  await ensureDeliveryZones();
  const resolved = await resolveDropoff(dropoff);
  deliveryService.validateZone(resolved, getDeliveryZones());
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
