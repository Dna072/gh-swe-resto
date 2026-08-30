import "server-only";

import type { VisitorLocation } from "@/domains/analytics/models";

const cache = new Map<string, { at: number; location: VisitorLocation }>();
const TTL_MS = 6 * 60 * 60 * 1000;

export async function lookupVisitorLocation(ip: string | undefined): Promise<VisitorLocation> {
  if (!ip) {
    return {};
  }
  const cached = cache.get(ip);
  if (cached && Date.now() - cached.at < TTL_MS) {
    return cached.location;
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 800);
    const response = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
    if (!response.ok) {
      return {};
    }
    const body = (await response.json()) as {
      success?: boolean;
      country?: string;
      region?: string;
      city?: string;
    };
    if (body.success === false) {
      return {};
    }
    const location: VisitorLocation = {
      country: body.country || undefined,
      region: body.region || undefined,
      city: body.city || undefined,
    };
    cache.set(ip, { at: Date.now(), location });
    return location;
  } catch {
    return {};
  }
}
