import type { MapsPort } from "@/domains/delivery/maps-port";
import { createGoogleMapsPort } from "@/infrastructure/maps/google-maps";
import { getEnv } from "@/lib/env";
import { MockGeocodingService } from "./mock";
import { PhotonGeocodingService } from "./photon";
import { MapTilerGeocodingService } from "./maptiler";

/**
 * OSM-compatible geocoding. Prefer MapTiler when a key exists, then an explicit
 * Google key, then public Photon for low-volume local use.
 */
export function createGeocodingPort(): MapsPort {
  const env = getEnv();
  const provider = env.GEOCODER_PROVIDER;
  if (provider === "mock" || env.NODE_ENV === "test") {
    return new MockGeocodingService();
  }
  if (provider === "google") {
    return createGoogleMapsPort() ?? new PhotonGeocodingService();
  }
  if (provider === "maptiler" && env.MAPTILER_API_KEY) {
    return new MapTilerGeocodingService(env.MAPTILER_API_KEY);
  }
  if (!provider && env.MAPTILER_API_KEY) {
    return new MapTilerGeocodingService(env.MAPTILER_API_KEY);
  }
  if (provider === "photon" || provider === "osm") {
    return new PhotonGeocodingService();
  }
  if (env.GOOGLE_MAPS_SERVER_KEY) {
    return createGoogleMapsPort() ?? new PhotonGeocodingService();
  }
  return env.MAPTILER_API_KEY
    ? new MapTilerGeocodingService(env.MAPTILER_API_KEY)
    : new PhotonGeocodingService();
}
