import { randomBytes, randomUUID } from "node:crypto";

export function newId(): string {
  return randomUUID();
}

export function newAccessToken(): string {
  return randomBytes(32).toString("base64url");
}

export function formatPublicOrderNumber(sequence: number, prefix = "GH"): string {
  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new Error("order sequence must be a positive integer");
  }
  return `${prefix}${sequence}`;
}
