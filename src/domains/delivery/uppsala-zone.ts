import { AppError } from "@/lib/errors";
import type { AddressSnapshot } from "@/domains/shared/types";
import type { GeocodedPlace, MapsPort } from "./maps-port";

const UPPSALA_NAME = /uppsala/i;
const UPPSALA_POSTAL = /^75\d{3}$/;
const UPPSALA_KOMMUN = /uppsala\s+(kommun|municipality)/i;

function component(
  place: Pick<GeocodedPlace, "addressComponents">,
  type: string,
): string {
  return (
    place.addressComponents.find((entry) => entry.types.includes(type))?.longName ??
    ""
  );
}

export function looksLikeUppsala(address: AddressSnapshot): boolean {
  const city = address.city.trim();
  const postal = address.postalCode.replace(/\s+/g, "");
  if (UPPSALA_NAME.test(city)) {
    return true;
  }
  return UPPSALA_POSTAL.test(postal);
}

export function isUppsalaPlace(place: GeocodedPlace): boolean {
  const locality = component(place, "locality");
  const postalTown = component(place, "postal_town");
  const admin2 = component(place, "administrative_area_level_2");
  const postal = component(place, "postal_code").replace(/\s+/g, "");

  if (UPPSALA_KOMMUN.test(admin2)) {
    return true;
  }
  if (UPPSALA_NAME.test(locality) || UPPSALA_NAME.test(postalTown)) {
    return true;
  }
  if (UPPSALA_POSTAL.test(postal) && UPPSALA_NAME.test(place.formattedAddress)) {
    return true;
  }
  if (place.types.includes("locality") && UPPSALA_NAME.test(place.formattedAddress) && !/län|county/i.test(admin2)) {
    return UPPSALA_NAME.test(locality) || UPPSALA_NAME.test(place.formattedAddress.split(",")[0] ?? "");
  }
  return false;
}

export async function resolveUppsalaDropoff(
  address: AddressSnapshot,
  maps?: MapsPort | null,
): Promise<AddressSnapshot> {
  if (!maps) {
    if (!looksLikeUppsala(address)) {
      throw new AppError("OUT_OF_ZONE", "Delivery is only available in Uppsala.");
    }
    return address;
  }

  const place = await maps.geocode(address);
  if (!place) {
    throw new AppError("OUT_OF_ZONE", "Delivery is only available in Uppsala.");
  }
  if (!isUppsalaPlace(place)) {
    throw new AppError("OUT_OF_ZONE", "Delivery is only available in Uppsala.");
  }

  const routed = await maps.routeStatus(
    { line1: "Kungsängsgatan 1", postalCode: "75322", city: "Uppsala", country: "SE" },
    { lat: place.lat, lng: place.lng },
  );
  if (routed === "out_of_zone") {
    throw new AppError("OUT_OF_ZONE", "Delivery is only available in Uppsala.");
  }
  if (routed === "unavailable") {
    throw new AppError("DELIVERY_UNAVAILABLE", "We could not verify this address.");
  }

  const postal = component(place, "postal_code").replace(/\s+/g, "") || address.postalCode.replace(/\s+/g, "");
  const city = component(place, "postal_town") || component(place, "locality") || address.city;
  const route = component(place, "route");
  const streetNumber = component(place, "street_number");
  const line1 = [route, streetNumber].filter(Boolean).join(" ") || address.line1;

  return {
    ...address,
    line1,
    postalCode: postal,
    city,
    country: "SE",
    lat: place.lat,
    lng: place.lng,
    formatted: place.formattedAddress,
  };
}
