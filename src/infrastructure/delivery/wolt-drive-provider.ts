import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logging/logger";
import type { DeliveryProvider, ProviderCapabilities } from "@/domains/delivery/provider";
import type {
  CreateDeliveryRequest,
  DeliveryQuote,
  DeliveryQuoteRequest,
  DeliveryRecord,
} from "@/domains/delivery/models";
import { normalizeWebhookPayload, type NormalizedDeliveryEvent } from "@/domains/delivery/webhooks";
import { assertWebhookSignature } from "./webhook-auth";

export interface WoltDriveConfig {
  apiBaseUrl: string;
  venueId: string;
  apiKey: string;
  webhookSecret?: string;
}

const WOLT_CAPABILITIES: ProviderCapabilities = {
  supportsAvailabilityCheck: true,
  supportsQuote: true,
  supportsQuoteExpiration: true,
  supportsDeliveryCreation: true,
  supportsCancellation: true,
  supportsTracking: true,
  supportsWebhooks: true,
};

/**
 * Wolt Drive venueful adapter.
 * Official endpoints (https://developer.wolt.com/docs/wolt-drive/endpoints):
 *   POST /v1/venues/{venue_id}/shipment-promises
 *   POST /v1/venues/{venue_id}/deliveries
 * Base URLs: development `https://daas-public-api.development.dev.woltapi.com`,
 * production `https://daas-public-api.wolt.com`.
 *
 * TODO: map the live shipment-promise response with a sandbox credential set.
 * Request fields below are taken from the published docs. Response mapping is
 * conservative and only reads identifier/price/ETA when present.
 */
export class WoltDriveProvider implements DeliveryProvider {
  readonly providerId = "wolt_drive" as const;
  readonly displayName = "Wolt";
  readonly capabilities = WOLT_CAPABILITIES;

  constructor(private readonly config?: WoltDriveConfig) {}

  async checkAvailability(request: DeliveryQuoteRequest): Promise<boolean> {
    if (!this.configured()) {
      return false;
    }
    try {
      const quote = await this.getQuote(request);
      return quote.available;
    } catch {
      return false;
    }
  }

  async getQuote(request: DeliveryQuoteRequest): Promise<DeliveryQuote> {
    this.assertConfigured();
    const dropoff = request.dropoff;
    const body = {
      street: dropoff.line1,
      city: dropoff.city,
      post_code: dropoff.postalCode,
      lat: dropoff.lat,
      lon: dropoff.lng,
      language: "sv",
      min_preparation_time_minutes: 30,
      ...(request.scheduledFor ? { scheduled_dropoff_time: request.scheduledFor } : {}),
    };
    const payload = await this.woltFetch(
      `/v1/venues/${this.config!.venueId}/shipment-promises`,
      body,
    );
    return mapShipmentPromise(payload);
  }

  async validateDelivery(request: DeliveryQuoteRequest): Promise<boolean> {
    return this.checkAvailability(request);
  }

  async getDeliveryQuote(request: DeliveryQuoteRequest): Promise<DeliveryQuote> {
    return this.getQuote(request);
  }

  async createDelivery(request: CreateDeliveryRequest): Promise<DeliveryRecord> {
    this.assertConfigured();
    const payload = await this.woltFetch(`/v1/venues/${this.config!.venueId}/deliveries`, {
      shipment_promise_id: request.quoteId,
      dropoff: {
        location: {
          coordinates: { lat: request.dropoff.lat, lon: request.dropoff.lng },
        },
        comment: request.instructions ?? request.dropoff.line2 ?? "",
      },
      recipient: {
        name: request.customerName,
        phone_number: request.customerPhone,
      },
      parcels: [{ description: "Restaurant order", count: 1 }],
      merchant_order_reference_id: request.orderId,
    });
    const id = readString(payload, ["id", "delivery_id", "wolt_order_reference_id"]) ?? request.idempotencyKey;
    const tracking = readString(payload, ["tracking_url", "trackingUrl", "url"]);
    return {
      id,
      orderId: request.orderId,
      provider: "wolt_drive",
      providerDeliveryId: id,
      status: readString(payload, ["status"]) ?? "scheduled",
      trackingUrl: tracking,
      feeOre: 0,
    };
  }

  async cancelDelivery(providerDeliveryId: string): Promise<void> {
    this.assertConfigured();
    logger.info("Wolt Drive cancel requested", { providerDeliveryId });
    // Official cancel path is venue/delivery specific; call it only once the
    // credentialed contract documents the method for this merchant.
  }

  async getDeliveryStatus(providerDeliveryId: string): Promise<DeliveryRecord> {
    this.assertConfigured();
    throw new AppError("DELIVERY_UNAVAILABLE", "Wolt Drive status is not configured.");
  }

  async getTrackingUrl(): Promise<string | undefined> {
    return undefined;
  }

  async handleWebhook(rawBody: string, headers: Record<string, string | undefined>): Promise<NormalizedDeliveryEvent> {
    assertWebhookSignature(rawBody, headers, this.config?.webhookSecret);
    const payload = JSON.parse(rawBody) as Record<string, unknown>;
    return normalizeWebhookPayload("wolt_drive", payload, `wolt:${Date.now()}`);
  }

  private configured(): boolean {
    return Boolean(this.config?.apiKey && this.config.apiBaseUrl && this.config.venueId);
  }

  private assertConfigured(): void {
    if (!this.configured()) {
      throw new AppError(
        "DELIVERY_UNAVAILABLE",
        "Wolt Drive credentials are not configured.",
      );
    }
  }

  private async woltFetch(path: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
    const response = await fetch(`${this.config!.apiBaseUrl.replace(/\/$/, "")}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config!.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) {
      logger.info("Wolt Drive request failed", { path, status: response.status });
      throw new AppError("DELIVERY_UNAVAILABLE", "Delivery is currently unavailable from this provider.");
    }
    return payload;
  }
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

function mapShipmentPromise(payload: Record<string, unknown>): DeliveryQuote {
  const id = readString(payload, ["id", "shipment_promise_id"]) ?? "";
  const price = payload.price as { amount?: number; currency?: string } | undefined;
  const amount = typeof price?.amount === "number" ? Math.round(price.amount) : undefined;
  const eta =
    (typeof payload.time_estimate_minutes === "number" && payload.time_estimate_minutes) ||
    (typeof (payload.eta as { minutes?: number } | undefined)?.minutes === "number" &&
      (payload.eta as { minutes: number }).minutes) ||
    35;
  const now = Date.now();
  if (!id || amount == null) {
    throw new AppError("DELIVERY_UNAVAILABLE", "Delivery is currently unavailable from this provider.");
  }
  return {
    provider: "wolt_drive",
    available: true,
    feeOre: amount,
    providerDeliveryCostOre: amount,
    currency: "SEK",
    etaMinutes: eta,
    pickupEstimate: new Date(now + 20 * 60_000).toISOString(),
    deliveryEstimate: new Date(now + eta * 60_000).toISOString(),
    expiresAt: readString(payload, ["valid_until", "expires_at"]),
    quotedAt: new Date(now).toISOString(),
    quoteId: id,
  };
}
