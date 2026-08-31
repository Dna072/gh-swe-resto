import { timingSafeEqual } from "node:crypto";

/** Compare secrets without leaking length via an early return on the first mismatch. */
export function secretsMatch(provided: string, expected: string): boolean {
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  if (left.length !== right.length) {
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}
