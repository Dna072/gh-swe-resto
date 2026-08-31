const OPENFREEMAP = "https://tiles.openfreemap.org/styles/liberty";

/** Client map style. OpenFreeMap works with no key; MapTiler is optional. */
export function mapStyleUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_MAP_STYLE_URL?.trim();
  if (explicit) {
    return explicit;
  }
  const maptiler = process.env.NEXT_PUBLIC_MAPTILER_KEY?.trim();
  if (maptiler) {
    return `https://api.maptiler.com/maps/streets-v2/style.json?key=${maptiler}`;
  }
  return OPENFREEMAP;
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

export async function resolveMapStyle(): Promise<string | ReturnType<typeof osmRasterStyle>> {
  const url = mapStyleUrl();
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (response.ok) {
      return url;
    }
  } catch {
    /* use raster tiles */
  }
  return osmRasterStyle();
}
