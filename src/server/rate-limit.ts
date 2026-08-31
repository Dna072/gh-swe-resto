import { AppError } from "@/lib/errors";
import { clientIpFromRequest } from "@/lib/geo/client-ip";

const hits = new Map<string, number[]>();

export function rateLimitKey(request: Request, bucket: string): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = clientIpFromRequest(request) ?? forwarded ?? "local";
  return `${bucket}:${ip}`;
}

export function assertRateLimit(key: string, max: number, windowMs: number): void {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((stamp) => now - stamp < windowMs);
  if (recent.length >= max) {
    throw new AppError("RATE_LIMITED", "Too many requests. Please wait a moment.");
  }
  recent.push(now);
  hits.set(key, recent);
}

export function resetRateLimitForTests(): void {
  hits.clear();
}
