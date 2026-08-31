import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function hashesEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

export function hmacSha256Hex(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/** Compare a webhook signature header to an expected hex HMAC. Accepts an optional `sha256=` prefix. */
export function signatureMatches(provided: string | undefined, expectedHex: string): boolean {
  if (!provided) {
    return false;
  }
  const cleaned = provided.replace(/^sha256=/i, "").trim();
  if (!/^[0-9a-f]+$/i.test(cleaned) || cleaned.length !== expectedHex.length) {
    return false;
  }
  return hashesEqual(cleaned.toLowerCase(), expectedHex.toLowerCase());
}
