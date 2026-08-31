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
