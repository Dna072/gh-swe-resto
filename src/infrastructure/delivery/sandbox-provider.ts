import { newId } from "@/lib/ids";
import type { DeliveryProvider, ProviderCapabilities } from "@/domains/delivery/provider";
import { FULL_SANDBOX_CAPABILITIES } from "@/domains/delivery/provider";
import type {
  CreateDeliveryRequest,
  DeliveryProviderId,
  DeliveryQuote,
  DeliveryQuoteRequest,
  DeliveryRecord,
} from "@/domains/delivery/models";
import { DEFAULT_PROVIDER_DISPLAY } from "@/domains/delivery/models";
import { normalizeWebhookPayload, type NormalizedDeliveryEvent } from "@/domains/delivery/webhooks";
import { assertWebhookSignature } from "./webhook-auth";

/** Approximate Sweden bounding box used only by sandbox adapters (not a delivery polygon). */
const SWEDEN = { minLat: 55.0, maxLat: 69.4, minLng: 10.5, maxLng: 24.3 };

export function coordinatesInSweden(lat?: number, lng?: number): boolean {
  if (typeof lat !== "number" || typeof lng !== "number") {
    return false;
  }
  return lat >= SWEDEN.minLat && lat <= SWEDEN.maxLat && lng >= SWEDEN.minLng && lng <= SWEDEN.maxLng;
}

export type SandboxQuoteProfile = {
  providerId: DeliveryProviderId;
  costOre: number;
  etaMinutes: number;
};

export const SANDBOX_PROFILES: Record<"wolt_drive" | "foodora", SandboxQuoteProfile> = {
  wolt_drive: { providerId: "wolt_drive", costOre: 7900, etaMinutes: 35 },
  foodora: { providerId: "foodora", costOre: 7500, etaMinutes: 30 },
};

/**
 * Local/test adapter. Does not call Wolt or foodora. Used until credentials exist.
 * Availability is a coarse Sweden check so the UI can be exercised — live providers
 * replace this when configured.
 */
export class SandboxDeliveryProvider implements DeliveryProvider {
  readonly capabilities: ProviderCapabilities = FULL_SANDBOX_CAPABILITIES;
  readonly displayName: string;
  readonly providerId: DeliveryProviderId;
  private readonly created = new Map<string, DeliveryRecord>();

  constructor(
    private readonly profile: SandboxQuoteProfile,
    private readonly unavailable = false,
  ) {
    this.providerId = profile.providerId;
    this.displayName = DEFAULT_PROVIDER_DISPLAY[profile.providerId];
  }

  async checkAvailability(request: DeliveryQuoteRequest): Promise<boolean> {
    if (this.unavailable) {
      return false;
    }
    return coordinatesInSweden(request.dropoff.lat, request.dropoff.lng);
  }

  async getQuote(request: DeliveryQuoteRequest): Promise<DeliveryQuote> {
    const available = await this.checkAvailability(request);
    const now = Date.now();
    return {
      provider: this.providerId,
      available,
      feeOre: this.profile.costOre,
      providerDeliveryCostOre: this.profile.costOre,
      currency: "SEK",
      etaMinutes: this.profile.etaMinutes,
      pickupEstimate: new Date(now + 20 * 60_000).toISOString(),
      deliveryEstimate: new Date(now + this.profile.etaMinutes * 60_000).toISOString(),
      expiresAt: new Date(now + 10 * 60_000).toISOString(),
      quotedAt: new Date(now).toISOString(),
      quoteId: `sandbox_${this.providerId}_${now}`,
    };
  }

  async validateDelivery(request: DeliveryQuoteRequest): Promise<boolean> {
    return this.checkAvailability(request);
  }

  async getDeliveryQuote(request: DeliveryQuoteRequest): Promise<DeliveryQuote> {
    return this.getQuote(request);
  }

  async createDelivery(request: CreateDeliveryRequest): Promise<DeliveryRecord> {
    const existing = this.created.get(request.idempotencyKey);
    if (existing) {
      return existing;
    }
    const record: DeliveryRecord = {
      id: newId(),
      orderId: request.orderId,
      provider: this.providerId,
      providerDeliveryId: `${this.providerId}_${request.idempotencyKey}`,
      status: "scheduled",
      trackingUrl: `https://example.invalid/track/${this.providerId}`,
      feeOre: this.profile.costOre,
    };
    this.created.set(request.idempotencyKey, record);
    return record;
  }

  async cancelDelivery(): Promise<void> {
    return;
  }

  async getDeliveryStatus(providerDeliveryId: string): Promise<DeliveryRecord> {
    return {
      id: providerDeliveryId,
      orderId: "",
      provider: this.providerId,
      providerDeliveryId,
      status: "scheduled",
      feeOre: this.profile.costOre,
    };
  }

  async getTrackingUrl(): Promise<string | undefined> {
    return `https://example.invalid/track/${this.providerId}`;
  }

  async handleWebhook(rawBody: string, headers: Record<string, string | undefined>): Promise<NormalizedDeliveryEvent> {
    assertWebhookSignature(rawBody, headers, "sandbox-webhook-secret");
    const payload = JSON.parse(rawBody) as Record<string, unknown>;
    return normalizeWebhookPayload(this.providerId, payload, `sandbox:${Date.now()}`);
  }
}
