import type { AddressSnapshot } from "@/domains/shared/types";
import type { GeocodingService } from "@/domains/delivery/geocoding";
import type { GeocodedPlace, MapsPort, PlacePrediction, RouteStatus } from "@/domains/delivery/maps-port";

const PHOTON_API = "https://photon.komoot.io";
const USER_AGENT = "MeridianFusionCuisine/1.0 (restaurant-address-search)";
const UPPSALA = { lat: 59.8586, lng: 17.6389 };

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    osm_id?: number;
    osm_type?: string;
    name?: string;
    housenumber?: string;
    street?: string;
    postcode?: string;
    city?: string;
    district?: string;
    county?: string;
    municipality?: string;
    country?: string;
    countrycode?: string;
  };
};

function encodePlaceId(lon: number, lat: number, osmId?: number): string {
  return `photon:${lon}:${lat}:${osmId ?? 0}`;
}

function decodePlaceId(placeId: string): { lon: number; lat: number } | null {
  const parts = placeId.split(":");
  if (parts[0] !== "photon" || parts.length < 3) {
    return null;
  }
  const lon = Number(parts[1]);
  const lat = Number(parts[2]);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
    return null;
  }
  return { lon, lat };
}

function toAddress(feature: PhotonFeature): AddressSnapshot | null {
  const coords = feature.geometry?.coordinates;
  const props = feature.properties;
  if (!coords || !props) {
    return null;
  }
  const [lng, lat] = coords;
  const street = [props.street ?? props.name, props.housenumber].filter(Boolean).join(" ");
  const city = props.city || props.district || props.county || "";
  const municipality = props.county || props.district || undefined;
  const postalCode = (props.postcode ?? "").replace(/\s+/g, "");
  if (!street && !city) {
    return null;
  }
  const formatted = [street, postalCode, city].filter(Boolean).join(", ");
  return {
    line1: street || formatted,
    postalCode: postalCode || "00000",
    city: city || "Uppsala",
    municipality,
    country: (props.countrycode ?? "SE").slice(0, 2).toUpperCase(),
    lat,
    lng,
    formatted,
  };
}

async function photonGet(path: string, params: Record<string, string>): Promise<PhotonFeature[]> {
  const url = new URL(path, PHOTON_API);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) {
    return [];
  }
  const body = (await response.json()) as { features?: PhotonFeature[] };
  return Array.isArray(body.features) ? body.features : [];
}

export class PhotonGeocodingService implements GeocodingService, MapsPort {
  async searchAddress(query: string, options: { language: string }): Promise<PlacePrediction[]> {
    const features = await photonGet("/api/", {
      q: query,
      lang: options.language === "en" ? "en" : "sv",
      limit: "8",
      lat: String(UPPSALA.lat),
      lon: String(UPPSALA.lng),
    });
    return features.flatMap((feature) => {
      const address = toAddress(feature);
      const coords = feature.geometry?.coordinates;
      if (!address || !coords) {
        return [];
      }
      return [
        {
          placeId: encodePlaceId(coords[0], coords[1], feature.properties?.osm_id),
          description: address.formatted ?? address.line1,
        },
      ];
    });
  }

  async geocodeAddress(address: AddressSnapshot): Promise<GeocodedPlace | null> {
    const query = address.formatted ?? [address.line1, address.postalCode, address.city].filter(Boolean).join(" ");
    const features = await photonGet("/api/", { q: query, limit: "1", lang: "sv" });
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

  async reverseGeocode(lat: number, lng: number, language = "sv"): Promise<AddressSnapshot | null> {
    const features = await photonGet("/reverse", {
      lat: String(lat),
      lon: String(lng),
      lang: language === "en" ? "en" : "sv",
    });
    const mapped = features[0] ? toAddress(features[0]) : null;
    if (!mapped) {
      return null;
    }
    return { ...mapped, lat, lng };
  }

  async placeDetails(placeId: string): Promise<(AddressSnapshot & { types: string[]; addressComponents: GeocodedPlace["addressComponents"] }) | null> {
    const decoded = decodePlaceId(placeId);
    if (!decoded) {
      return null;
    }
    const address = await this.reverseGeocode(decoded.lat, decoded.lon);
    if (!address) {
      return null;
    }
    return { ...address, types: [], addressComponents: [] };
  }

  async autocomplete(input: string, options: { language: string }): Promise<PlacePrediction[]> {
    return this.searchAddress(input, options);
  }

  async geocode(address: AddressSnapshot): Promise<GeocodedPlace | null> {
    return this.geocodeAddress(address);
  }

  async routeStatus(): Promise<RouteStatus> {
    return "ok";
  }
}
