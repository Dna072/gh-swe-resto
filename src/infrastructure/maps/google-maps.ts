import "server-only";

import type { AddressSnapshot } from "@/domains/shared/types";
import type { GeocodedPlace, MapsPort, PlacePrediction, RouteStatus } from "@/domains/delivery/maps-port";
import { AppError } from "@/lib/errors";
import { getEnv } from "@/lib/env";

const GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";
const MATRIX_URL = "https://maps.googleapis.com/maps/api/distancematrix/json";
const AUTOCOMPLETE_URL = "https://maps.googleapis.com/maps/api/place/autocomplete/json";
const DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json";
const UPPSALA_BIAS = { lat: 59.8586, lng: 17.6389 };

export function googleMapsServerKey(): string | undefined {
  const env = getEnv();
  const key = env.GOOGLE_MAPS_SERVER_KEY || env.GOOGLE_MAPS_API_KEY;
  return key?.trim() || undefined;
}

function requireKey(): string {
  const key = googleMapsServerKey();
  if (!key) {
    throw new AppError("DELIVERY_UNAVAILABLE", "Address search is not configured.");
  }
  return key;
}

async function mapsGet(url: URL): Promise<Record<string, unknown>> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new AppError("DELIVERY_UNAVAILABLE", "We could not verify this address.");
  }
  return (await response.json()) as Record<string, unknown>;
}

function formatAddress(address: AddressSnapshot): string {
  return (
    address.formatted ??
    [address.line1, address.line2, address.postalCode, address.city, address.country ?? "SE"]
      .filter(Boolean)
      .join(", ")
  );
}

type GoogleComponent = { long_name?: string; short_name?: string; types?: string[] };

function readComponents(raw: unknown): GeocodedPlace["addressComponents"] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.map((entry) => {
    const component = entry as GoogleComponent;
    return {
      longName: component.long_name ?? "",
      shortName: component.short_name ?? "",
      types: Array.isArray(component.types) ? component.types.map(String) : [],
    };
  });
}

function readGeometry(raw: unknown): { lat: number; lng: number } | null {
  const location = (raw as { location?: { lat?: number; lng?: number } } | undefined)?.location;
  if (typeof location?.lat !== "number" || typeof location?.lng !== "number") {
    return null;
  }
  return { lat: location.lat, lng: location.lng };
}

export async function geocodeAddress(address: AddressSnapshot): Promise<GeocodedPlace | null> {
  const url = new URL(GEOCODE_URL);
  url.searchParams.set("address", formatAddress(address));
  url.searchParams.set("components", "country:SE");
  url.searchParams.set("language", "sv");
  url.searchParams.set("region", "se");
  url.searchParams.set("key", requireKey());
  const body = await mapsGet(url);
  if (body.status !== "OK" || !Array.isArray(body.results) || body.results.length === 0) {
    return null;
  }
  const first = body.results[0] as {
    formatted_address?: string;
    types?: string[];
    address_components?: unknown;
    geometry?: unknown;
  };
  const geometry = readGeometry(first.geometry);
  if (!geometry) {
    return null;
  }
  return {
    formattedAddress: first.formatted_address ?? formatAddress(address),
    lat: geometry.lat,
    lng: geometry.lng,
    types: Array.isArray(first.types) ? first.types.map(String) : [],
    addressComponents: readComponents(first.address_components),
  };
}

export async function distanceMatrixStatus(
  origin: AddressSnapshot,
  destination: { lat: number; lng: number },
): Promise<RouteStatus> {
  const url = new URL(MATRIX_URL);
  url.searchParams.set("origins", formatAddress(origin));
  url.searchParams.set("destinations", `${destination.lat},${destination.lng}`);
  url.searchParams.set("mode", "driving");
  url.searchParams.set("region", "se");
  url.searchParams.set("key", requireKey());
  const body = await mapsGet(url);
  if (body.status !== "OK" || !Array.isArray(body.rows)) {
    return "unavailable";
  }
  const element = (body.rows[0] as { elements?: Array<{ status?: string }> } | undefined)?.elements?.[0];
  const status = element?.status;
  if (status === "OK") {
    return "ok";
  }
  if (status === "ZERO_RESULTS" || status === "NOT_FOUND") {
    return "out_of_zone";
  }
  return "unavailable";
}

export async function autocompletePlaces(
  input: string,
  options: { language: string; sessionToken?: string },
): Promise<PlacePrediction[]> {
  const trimmed = input.trim();
  if (trimmed.length < 3) {
    return [];
  }
  const url = new URL(AUTOCOMPLETE_URL);
  url.searchParams.set("input", trimmed);
  url.searchParams.set("components", "country:se");
  url.searchParams.set("location", `${UPPSALA_BIAS.lat},${UPPSALA_BIAS.lng}`);
  url.searchParams.set("radius", "30000");
  url.searchParams.set("strictbounds", "true");
  url.searchParams.set("types", "address");
  url.searchParams.set("language", options.language === "en" ? "en" : "sv");
  url.searchParams.set("key", requireKey());
  if (options.sessionToken) {
    url.searchParams.set("sessiontoken", options.sessionToken);
  }
  const body = await mapsGet(url);
  if (body.status !== "OK" && body.status !== "ZERO_RESULTS") {
    return [];
  }
  const predictions = Array.isArray(body.predictions) ? body.predictions : [];
  return predictions.map((entry) => {
    const prediction = entry as { place_id?: string; description?: string };
    return {
      placeId: prediction.place_id ?? "",
      description: prediction.description ?? "",
    };
  }).filter((entry) => entry.placeId);
}

export async function placeDetails(
  placeId: string,
  options: { language: string; sessionToken?: string },
): Promise<(AddressSnapshot & { types: string[]; addressComponents: GeocodedPlace["addressComponents"] }) | null> {
  const url = new URL(DETAILS_URL);
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "address_component,formatted_address,geometry,type");
  url.searchParams.set("language", options.language === "en" ? "en" : "sv");
  url.searchParams.set("key", requireKey());
  if (options.sessionToken) {
    url.searchParams.set("sessiontoken", options.sessionToken);
  }
  const body = await mapsGet(url);
  if (body.status !== "OK" || !body.result || typeof body.result !== "object") {
    return null;
  }
  const result = body.result as {
    formatted_address?: string;
    types?: string[];
    address_components?: unknown;
    geometry?: unknown;
  };
  const geometry = readGeometry(result.geometry);
  if (!geometry) {
    return null;
  }
  const addressComponents = readComponents(result.address_components);
  const value = (type: string) => addressComponents.find((entry) => entry.types.includes(type))?.longName ?? "";
  const line1 = [value("route"), value("street_number")].filter(Boolean).join(" ") || result.formatted_address || "";
  const postalCode = value("postal_code").replace(/\s+/g, "");
  const city = value("postal_town") || value("locality") || "Uppsala";
  return {
    line1,
    postalCode: postalCode || "00000",
    city,
    country: "SE",
    lat: geometry.lat,
    lng: geometry.lng,
    formatted: result.formatted_address,
    types: Array.isArray(result.types) ? result.types.map(String) : [],
    addressComponents,
  };
}

export function createGoogleMapsPort(): MapsPort | null {
  if (!googleMapsServerKey()) {
    return null;
  }
  return {
    geocode: geocodeAddress,
    routeStatus: distanceMatrixStatus,
    autocomplete: autocompletePlaces,
    placeDetails,
  };
}
