export const OPENFREEMAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

export type MapStyleProvider = "custom" | "maptiler" | "openfreemap";

export type MapStyleSource =
  | "NEXT_PUBLIC_MAP_STYLE_URL"
  | "NEXT_PUBLIC_MAPTILER_KEY"
  | "MAPTILER_API_KEY"
  | "openfreemap";

export type MapRuntimeConfig = {
  provider: MapStyleProvider;
  styleUrl: string;
  source: MapStyleSource;
};

export type OsmRasterStyle = ReturnType<typeof osmRasterStyle>;

export type MapEnvSlice = {
  NEXT_PUBLIC_MAP_STYLE_URL?: string;
  NEXT_PUBLIC_MAPTILER_KEY?: string;
  MAPTILER_API_KEY?: string;
};

export function redactMapUrl(url: string): string {
  return url.replace(/([?&](?:key|api_key|apikey)=)[^&]+/gi, "$1REDACTED");
}

export function maptilerStreetsStyleUrl(key: string): string {
  return `https://api.maptiler.com/maps/streets-v2/style.json?key=${key}`;
}

/**
 * Resolve the MapLibre style URL from env.
 * Server routes can pass MAPTILER_API_KEY so Cloud Run keys work without a rebuild.
 * The client bundle only sees NEXT_PUBLIC_* values baked in at `next build`.
 */
export function mapRuntimeConfig(env: MapEnvSlice): MapRuntimeConfig {
  const explicit = env.NEXT_PUBLIC_MAP_STYLE_URL?.trim();
  if (explicit) {
    return { provider: "custom", styleUrl: explicit, source: "NEXT_PUBLIC_MAP_STYLE_URL" };
  }
  const publicKey = env.NEXT_PUBLIC_MAPTILER_KEY?.trim();
  if (publicKey) {
    return {
      provider: "maptiler",
      styleUrl: maptilerStreetsStyleUrl(publicKey),
      source: "NEXT_PUBLIC_MAPTILER_KEY",
    };
  }
  const serverKey = env.MAPTILER_API_KEY?.trim();
  if (serverKey) {
    return {
      provider: "maptiler",
      styleUrl: maptilerStreetsStyleUrl(serverKey),
      source: "MAPTILER_API_KEY",
    };
  }
  return { provider: "openfreemap", styleUrl: OPENFREEMAP_STYLE_URL, source: "openfreemap" };
}

/** Client-only fallback. Prefer `/api/maps/config` so server keys apply at runtime. */
export function mapStyleUrl(): string {
  return mapRuntimeConfig({
    NEXT_PUBLIC_MAP_STYLE_URL: process.env.NEXT_PUBLIC_MAP_STYLE_URL,
    NEXT_PUBLIC_MAPTILER_KEY: process.env.NEXT_PUBLIC_MAPTILER_KEY,
  }).styleUrl;
}

/** Raster OSM fallback when a vector style URL cannot be loaded. */
export function osmRasterStyle(): {
  version: 8;
  sources: Record<string, { type: "raster"; tiles: string[]; tileSize: number; attribution: string }>;
  layers: Array<{ id: string; type: "raster"; source: string }>;
} {
  return {
    version: 8,
    sources: {
      osm: {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "© OpenStreetMap contributors",
      },
    },
    layers: [{ id: "osm", type: "raster", source: "osm" }],
  };
}

export type ResolveMapStyleResult = {
  style: string | OsmRasterStyle;
  requestedUrl: string;
  usedFallback: boolean;
  fetchStatus?: number;
  fetchError?: string;
};

export async function resolveMapStyle(preferredUrl?: string): Promise<ResolveMapStyleResult> {
  const url = preferredUrl ?? mapStyleUrl();
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (response.ok) {
      return { style: url, requestedUrl: url, usedFallback: false, fetchStatus: response.status };
    }
    return {
      style: osmRasterStyle(),
      requestedUrl: url,
      usedFallback: true,
      fetchStatus: response.status,
      fetchError: `style fetch HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      style: osmRasterStyle(),
      requestedUrl: url,
      usedFallback: true,
      fetchError: error instanceof Error ? error.message : "style fetch failed",
    };
  }
}
