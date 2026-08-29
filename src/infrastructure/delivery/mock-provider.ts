import { newId } from "@/lib/ids";
import type { DeliveryProvider } from "@/domains/delivery/provider";
import type {
  CreateDeliveryRequest,
  DeliveryQuote,
  DeliveryQuoteRequest,
  DeliveryRecord,
  DeliveryZone,
} from "@/domains/delivery/models";

function normalizePostal(value: string): string {
  return value.replace(/\s+/g, "");
}

/**
 * Sandbox delivery provider used until Wolt Drive credentials are configured
 * and the live API has been tested. Fees come from restaurant zone data when
 * provided — never from the browser.
 */
export class MockDeliveryProvider implements DeliveryProvider {
  readonly providerId = "mock" as const;

  constructor(private readonly zones: () => DeliveryZone[] = () => []) {}

  async getDeliveryQuote(request: DeliveryQuoteRequest): Promise<DeliveryQuote> {
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
      feeOre,
      etaMinutes,
      pickupEstimate: new Date(now + 20 * 60_000).toISOString(),
      deliveryEstimate: new Date(now + etaMinutes * 60_000).toISOString(),
      expiresAt: new Date(now + 10 * 60_000).toISOString(),
      quoteId: `quote_${request.restaurantId}_${zone?.id ?? "default"}_${now}`,
    };
  }

  private feeForPostal(postalCode: string): number {
    const postal = normalizePostal(postalCode);
    const zone = this.zones().find(
      (candidate) =>
        candidate.active && candidate.postalCodes.some((code) => normalizePostal(code) === postal),
    );
    return zone?.baseFeeOre ?? 4900;
  }

  async validateDelivery(request: DeliveryQuoteRequest): Promise<boolean> {
    return Boolean(request.dropoff.postalCode);
  }

  async createDelivery(request: CreateDeliveryRequest): Promise<DeliveryRecord> {
    return {
      id: newId(),
      orderId: request.orderId,
      provider: "mock",
      providerDeliveryId: `mockdel_${request.idempotencyKey}`,
      status: "scheduled",
      trackingUrl: "https://example.invalid/track/mock",
      feeOre: this.feeForPostal(request.dropoff.postalCode),
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
      feeOre: this.feeForPostal(""),
    };
  }

  async getTrackingUrl(): Promise<string | undefined> {
    return "https://example.invalid/track/mock";
  }
}
