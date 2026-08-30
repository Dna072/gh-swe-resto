export type ErrorCode =
  | "VALIDATION"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INSUFFICIENT_INVENTORY"
  | "INVALID_TRANSITION"
  | "PAYMENT_FAILED"
  | "DELIVERY_UNAVAILABLE"
  | "OUT_OF_ZONE"
  | "SLOT_UNAVAILABLE"
  | "PROMOTION_INVALID"
  | "IDEMPOTENCY_CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL";

export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function publicErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  if (process.env.APP_ENV !== "production" && error instanceof Error && error.message) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}
