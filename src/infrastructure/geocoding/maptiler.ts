import type { AddressSnapshot } from "@/domains/shared/types";
import type { GeocodingService } from "@/domains/delivery/geocoding";
import type { GeocodedPlace, MapsPort, PlacePrediction, RouteStatus } from "@/domains/delivery/maps-port";

/**
 * MapTiler Geocoding API — OSM-compatible production geocoder.
 * https://docs.maptiler.com/cloud/api/geocoding/
 */
const UPPSALA = { lat: 59.8586, lng: 17.6389 };

type MapTilerFeature = {
  id?: string;
  place_name?: string;
  center?: [number, number];
  text?: string;
  address?: string;
  properties?: { ref?: string };
  context?: Array<{ id?: string; text?: string }>;
};

function contextValue(feature: MapTilerFeature, prefix: string): string {
  return feature.context?.find((entry) => entry.id?.startsWith(prefix))?.text ?? "";
}

function toAddress(feature: MapTilerFeature): AddressSnapshot | null {
  const center = feature.center;
  if (!center) {
    return null;
  }
  const [lng, lat] = center;
  const house = feature.address ?? "";
  const street = feature.text ?? "";
  const line1 = [street, house].filter(Boolean).join(" ") || feature.place_name || "";
  const postalCode = contextValue(feature, "postal_code").replace(/\s+/g, "") || contextValue(feature, "postcode").replace(/\s+/g, "");
  const city = contextValue(feature, "place") || contextValue(feature, "locality") || "Uppsala";
  const municipality = contextValue(feature, "municipality") || contextValue(feature, "district") || undefined;
  return {
    line1,
    postalCode: postalCode || "00000",
    city,
    municipality,
    country: "SE",
    lat,
    lng,
    formatted: feature.place_name,
  };
}

export class MapTilerGeocodingService implements GeocodingService, MapsPort {
  constructor(private readonly apiKey: string) {}

  private async request(path: string, params: Record<string, string>): Promise<MapTilerFeature[]> {
    const url = new URL(`https://api.maptiler.com/geocoding/${path}`);
    url.searchParams.set("key", this.apiKey);
    url.searchParams.set("language", "sv");
    url.searchParams.set("proximity", `${UPPSALA.lng},${UPPSALA.lat}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      return [];
    }
    const body = (await response.json()) as { features?: MapTilerFeature[] };
    return Array.isArray(body.features) ? body.features : [];
  }

  async searchAddress(query: string): Promise<PlacePrediction[]> {
    const features = await this.request(`${encodeURIComponent(query)}.json`, { limit: "8" });
    return features.flatMap((feature) => {
      const address = toAddress(feature);
      if (!address) {
        return [];
      }
      return [{ placeId: `maptiler:${feature.id ?? `${address.lng}:${address.lat}`}`, description: address.formatted ?? address.line1 }];
    });
  }

  async geocodeAddress(address: AddressSnapshot): Promise<GeocodedPlace | null> {
    const query = address.formatted ?? [address.line1, address.postalCode, address.city].filter(Boolean).join(" ");
    const features = await this.request(`${encodeURIComponent(query)}.json`, { limit: "1" });
    const mapped = features[0] ? toAddress(features[0]) : null;
    if (!mapped?.lat || !mapped.lng) {
      return null;
    }
    return {
      formattedAddress: mapped.formatted ?? mapped.line1,
      lat: mapped.lat,
      lng: mapped.lng,
      types: [],
      addressComponents: [],
    };
  }

  async reverseGeocode(lat: number, lng: number): Promise<AddressSnapshot | null> {
    const features = await this.request(`${lng},${lat}.json`, { limit: "1" });
    const mapped = features[0] ? toAddress(features[0]) : null;
    return mapped ? { ...mapped, lat, lng } : null;
  }

  async placeDetails(placeId: string): Promise<(AddressSnapshot & { types: string[]; addressComponents: GeocodedPlace["addressComponents"] }) | null> {
    const id = placeId.replace(/^maptiler:/, "");
    const features = await this.request(`${encodeURIComponent(id)}.json`, { limit: "1" });
    const mapped = features[0] ? toAddress(features[0]) : null;
    return mapped ? { ...mapped, types: [], addressComponents: [] } : null;
  }

  async autocomplete(input: string): Promise<PlacePrediction[]> {
    return this.searchAddress(input);
  }

  async geocode(address: AddressSnapshot): Promise<GeocodedPlace | null> {
    return this.geocodeAddress(address);
  }

  async routeStatus(): Promise<RouteStatus> {
    return "ok";
  }
}
