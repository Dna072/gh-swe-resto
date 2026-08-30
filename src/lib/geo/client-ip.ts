const PRIVATE =
  /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1|localhost|0\.0\.0\.0)/i;

export function clientIpFromRequest(request: Request): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "";
  const first = forwarded.split(",")[0]?.trim();
  if (!first || PRIVATE.test(first)) {
    return undefined;
  }
  return first;
}

export function isPrivateIp(ip: string): boolean {
  return PRIVATE.test(ip);
}
