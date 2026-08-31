import { newId } from "@/lib/ids";
import type { DeliveryProvider, ProviderCapabilities } from "@/domains/delivery/provider";
import { FULL_SANDBOX_CAPABILITIES } from "@/domains/delivery/provider";
import type {
  CreateDeliveryRequest,
  DeliveryQuote,
  DeliveryQuoteRequest,
  DeliveryRecord,
  DeliveryZone,
} from "@/domains/delivery/models";
import { normalizeWebhookPayload, type NormalizedDeliveryEvent } from "@/domains/delivery/webhooks";
import { assertWebhookSignature } from "./webhook-auth";

function normalizePostal(value: string): string {
  return value.replace(/\s+/g, "");
}

/**
 * Legacy sandbox used by older zone tests. Prefer SandboxDeliveryProvider for
 * Wolt/foodora-shaped quotes.
 */
export class MockDeliveryProvider implements DeliveryProvider {
  readonly providerId = "mock" as const;
  readonly displayName = "Delivery";
  readonly capabilities: ProviderCapabilities = FULL_SANDBOX_CAPABILITIES;

  constructor(private readonly zones: () => DeliveryZone[] = () => []) {}

  async checkAvailability(request: DeliveryQuoteRequest): Promise<boolean> {
    return Boolean(request.dropoff.postalCode);
  }

  async getQuote(request: DeliveryQuoteRequest): Promise<DeliveryQuote> {
    const now = Date.now();
    const postal = normalizePostal(request.dropoff.postalCode);
    const zone = this.zones().find(
      (candidate) =>
        candidate.active && candidate.postalCodes.some((code) => normalizePostal(code) === postal),
    );
    const feeOre = zone?.baseFeeOre ?? 4900;
    const etaMinutes = zone?.etaMinutes ?? 35;
    return {
      provider: "mock",
      available: true,
      feeOre,
      providerDeliveryCostOre: feeOre,
      currency: "SEK",
      etaMinutes,
      pickupEstimate: new Date(now + 20 * 60_000).toISOString(),
      deliveryEstimate: new Date(now + etaMinutes * 60_000).toISOString(),
      expiresAt: new Date(now + 10 * 60_000).toISOString(),
      quotedAt: new Date(now).toISOString(),
      quoteId: `quote_${request.restaurantId}_${zone?.id ?? "default"}_${now}`,
    };
  }

  async validateDelivery(request: DeliveryQuoteRequest): Promise<boolean> {
    return this.checkAvailability(request);
  }

  async getDeliveryQuote(request: DeliveryQuoteRequest): Promise<DeliveryQuote> {
    return this.getQuote(request);
  }

  async createDelivery(request: CreateDeliveryRequest): Promise<DeliveryRecord> {
    return {
      id: newId(),
      orderId: request.orderId,
      provider: "mock",
      providerDeliveryId: `mockdel_${request.idempotencyKey}`,
      status: "scheduled",
      trackingUrl: "https://example.invalid/track/mock",
      feeOre: 4900,
    };
  }

  async cancelDelivery(): Promise<void> {
    return;
  }

  async getDeliveryStatus(providerDeliveryId: string): Promise<DeliveryRecord> {
    return {
      id: providerDeliveryId,
      orderId: "",
      provider: "mock",
      providerDeliveryId,
      status: "scheduled",
      feeOre: 4900,
    };
  }

  async getTrackingUrl(): Promise<string | undefined> {
    return "https://example.invalid/track/mock";
  }

  async handleWebhook(rawBody: string, headers: Record<string, string | undefined>): Promise<NormalizedDeliveryEvent> {
    assertWebhookSignature(rawBody, headers, "mock-webhook-secret");
    return normalizeWebhookPayload("mock", JSON.parse(rawBody) as Record<string, unknown>, `mock:${Date.now()}`);
  }
}
