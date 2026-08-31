import type { MessageKey, Translator } from "./messages";

const BY_CODE: Record<string, MessageKey> = {
  DELIVERY_UNAVAILABLE: "delivery.no",
  QUOTE_FAILED: "delivery.quoteFail",
  OUT_OF_ZONE: "delivery.no",
  SLOT_UNAVAILABLE: "checkout.needSlot",
  NOT_FOUND: "errors.notFound",
  VALIDATION: "errors.validation",
  INSUFFICIENT_INVENTORY: "errors.inventory",
  FORBIDDEN: "errors.forbidden",
  UNAUTHORIZED: "errors.forbidden",
  INTERNAL: "errors.generic",
  IDEMPOTENCY_CONFLICT: "checkout.placeError",
  INVALID_TRANSITION: "order.cancelError",
  PROMOTION_INVALID: "errors.validation",
};

export function customerErrorMessage(
  code: string | undefined,
  t: Translator,
  fallback: MessageKey = "errors.generic",
): string {
  return t(code && BY_CODE[code] ? BY_CODE[code] : fallback);
}
