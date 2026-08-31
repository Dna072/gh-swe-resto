import { AppError } from "@/lib/errors";
import { hmacSha256Hex, signatureMatches } from "@/lib/hash";

function header(headers: Record<string, string | undefined>, name: string): string | undefined {
  const match = Object.entries(headers).find(([key]) => key.toLowerCase() === name.toLowerCase());
  return match?.[1];
}

export function readWebhookSignature(headers: Record<string, string | undefined>): string | undefined {
  return (
    header(headers, "wolt-signature") ??
    header(headers, "x-wolt-signature") ??
    header(headers, "x-foodora-signature") ??
    header(headers, "x-signature") ??
    header(headers, "x-webhook-signature")
  );
}

export function assertWebhookSignature(
  rawBody: string,
  headers: Record<string, string | undefined>,
  secret: string | undefined,
): void {
  if (!secret) {
    throw new AppError("UNAUTHORIZED", "Delivery webhook is not configured.");
  }
  const provided = readWebhookSignature(headers);
  const expected = hmacSha256Hex(secret, rawBody);
  if (!signatureMatches(provided, expected)) {
    throw new AppError("UNAUTHORIZED", "Invalid webhook signature.");
  }
}
