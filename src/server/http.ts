import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError, publicErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logging/logger";

const STATUS_BY_CODE: Record<string, number> = {
  VALIDATION: 400,
  PROMOTION_INVALID: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INSUFFICIENT_INVENTORY: 409,
  INVALID_TRANSITION: 409,
  IDEMPOTENCY_CONFLICT: 409,
  DELIVERY_UNAVAILABLE: 422,
  OUT_OF_ZONE: 422,
  SLOT_UNAVAILABLE: 422,
  PAYMENT_FAILED: 402,
  RATE_LIMITED: 429,
  INTERNAL: 500,
};

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    const first = error.issues[0];
    return NextResponse.json(
      {
        code: "VALIDATION",
        message: first ? `${first.path.join(".") || "request"}: ${first.message}` : "Invalid request.",
      },
      { status: 400 },
    );
  }
  if (error instanceof AppError) {
    return NextResponse.json(
      { code: error.code, message: error.message },
      { status: STATUS_BY_CODE[error.code] ?? 400 },
    );
  }
  logger.error("unhandled_api_error", { message: error instanceof Error ? error.message : "unknown" });
  return NextResponse.json({ code: "INTERNAL", message: publicErrorMessage(error) }, { status: 500 });
}
