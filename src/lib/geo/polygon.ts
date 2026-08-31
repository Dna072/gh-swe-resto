export type LatLng = { lat: number; lng: number };

const MAX_VERTICES = 64;

export function uniqueVertices(points: LatLng[]): LatLng[] {
  const cleaned: LatLng[] = [];
  for (const point of points) {
    if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) {
      continue;
    }
    const previous = cleaned[cleaned.length - 1];
    if (previous && previous.lat === point.lat && previous.lng === point.lng) {
      continue;
    }
    cleaned.push({ lat: point.lat, lng: point.lng });
  }
  if (cleaned.length >= 2) {
    const first = cleaned[0];
    const last = cleaned[cleaned.length - 1];
    if (first && last && first.lat === last.lat && first.lng === last.lng) {
      cleaned.pop();
    }
  }
  return cleaned.slice(0, MAX_VERTICES);
}

export function isValidPolygon(points: LatLng[] | undefined): boolean {
  return uniqueVertices(points ?? []).length >= 3;
}

export function toGeoJsonRing(points: LatLng[]): Array<[number, number]> {
  const vertices = uniqueVertices(points);
  if (vertices.length === 0) {
    return [];
  }
  const ring = vertices.map((point) => [point.lng, point.lat] as [number, number]);
  const first = ring[0];
  if (first) {
    ring.push(first);
  }
  return ring;
}

/** Ray-casting. Vertices may be open or closed. */
export function pointInPolygon(point: LatLng, polygon: LatLng[] | undefined): boolean {
  const vertices = uniqueVertices(polygon ?? []);
  if (vertices.length < 3) {
    return false;
  }
  const x = point.lng;
  const y = point.lat;
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i, i += 1) {
    const xi = vertices[i]?.lng ?? 0;
    const yi = vertices[i]?.lat ?? 0;
    const xj = vertices[j]?.lng ?? 0;
    const yj = vertices[j]?.lat ?? 0;
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi || Number.EPSILON) + xi;
    if (intersect) {
      inside = !inside;
    }
  }
  return inside;
}
