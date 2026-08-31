import type { DeliveryStatus } from "@/domains/orders/models";
import type { DeliveryProviderId } from "./models";

export type NormalizedDeliveryEvent = {
  eventId: string;
  provider: DeliveryProviderId;
  providerDeliveryId: string;
  orderId?: string;
  status?: DeliveryStatus;
  trackingUrl?: string;
  occurredAt?: string;
  unknown: boolean;
};

const STATUS_RANK: Record<DeliveryStatus, number> = {
  NOT_REQUESTED: 0,
  QUOTED: 1,
  SCHEDULED: 2,
  ASSIGNED: 3,
  PICKED_UP: 4,
  IN_TRANSIT: 5,
  DELIVERED: 6,
  FAILED: 90,
  ATTENTION_REQUIRED: 91,
};

const STATUS_WORDS: Record<string, DeliveryStatus> = {
  scheduled: "SCHEDULED",
  created: "SCHEDULED",
  assigned: "ASSIGNED",
  courier_assigned: "ASSIGNED",
  picked_up: "PICKED_UP",
  pickup: "PICKED_UP",
  pickedup: "PICKED_UP",
  in_transit: "IN_TRANSIT",
  intransit: "IN_TRANSIT",
  delivering: "IN_TRANSIT",
  out_for_delivery: "IN_TRANSIT",
  delivered: "DELIVERED",
  completed: "DELIVERED",
  failed: "FAILED",
  cancelled: "FAILED",
  canceled: "FAILED",
  rejected: "FAILED",
};

export function rankDeliveryStatus(status: DeliveryStatus): number {
  return STATUS_RANK[status];
}

/** Ignore older progress events; failed/attention always apply. */
export function shouldApplyDeliveryEvent(current: DeliveryStatus, incoming: DeliveryStatus): boolean {
  if (incoming === "FAILED" || incoming === "ATTENTION_REQUIRED") {
    return true;
  }
  if (current === "FAILED" || current === "DELIVERED") {
    return incoming === current;
  }
  return rankDeliveryStatus(incoming) >= rankDeliveryStatus(current);
}

export function mapProviderStatusWord(value: unknown): DeliveryStatus | undefined {
  if (typeof value !== "string" || value.trim().length === 0) {
    return undefined;
  }
  const key = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return STATUS_WORDS[key];
}

function readString(payload: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }
  return undefined;
}

/**
 * Conservative JSON mapping used by webhook adapters.
 * Only reads identifier/status/tracking fields when they are present.
 * Does not assume undocumented Wolt or foodora schemas.
 */
export function normalizeWebhookPayload(
  provider: DeliveryProviderId,
  payload: Record<string, unknown>,
  fallbackEventId: string,
): NormalizedDeliveryEvent {
  const nested =
    payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)
      ? (payload.data as Record<string, unknown>)
      : payload;
  const providerDeliveryId =
    readString(nested, ["id", "delivery_id", "deliveryId", "wolt_order_reference_id", "shipment_id"]) ??
    readString(payload, ["id", "delivery_id", "deliveryId"]);
  const eventId =
    readString(payload, ["event_id", "eventId", "id"]) ??
    (providerDeliveryId ? `${provider}:${providerDeliveryId}:${readString(payload, ["status"]) ?? "event"}` : fallbackEventId);
  const status = mapProviderStatusWord(nested.status ?? payload.status ?? payload.event_type ?? payload.type);
  const trackingUrl = readString(nested, ["tracking_url", "trackingUrl", "url"]);
  const orderId = readString(nested, [
    "merchant_order_reference_id",
    "order_id",
    "orderId",
    "merchantOrderReferenceId",
  ]);
  const occurredAt = readString(payload, ["occurred_at", "occurredAt", "timestamp", "created_at"]);
  return {
    eventId,
    provider,
    providerDeliveryId: providerDeliveryId ?? "",
    orderId,
    status,
    trackingUrl,
    occurredAt,
    unknown: !status,
  };
}

export function orderStatusFromDelivery(status: DeliveryStatus): "COURIER_ASSIGNED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "DELIVERY_FAILED" | undefined {
  if (status === "ASSIGNED") {
    return "COURIER_ASSIGNED";
  }
  if (status === "PICKED_UP" || status === "IN_TRANSIT") {
    return "OUT_FOR_DELIVERY";
  }
  if (status === "DELIVERED") {
    return "DELIVERED";
  }
  if (status === "FAILED") {
    return "DELIVERY_FAILED";
  }
  return undefined;
}
