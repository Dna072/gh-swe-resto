import { newId } from "@/lib/ids";
import type { DeliveryProvider } from "@/domains/delivery/provider";
import type {
  CreateDeliveryRequest,
  DeliveryQuote,
  DeliveryQuoteRequest,
  DeliveryRecord,
} from "@/domains/delivery/models";

/**
 * Sandbox delivery provider used until Wolt Drive credentials are configured
 * and the live API has been tested.
 */
export class MockDeliveryProvider implements DeliveryProvider {
  readonly providerId = "mock" as const;

  async getDeliveryQuote(request: DeliveryQuoteRequest): Promise<DeliveryQuote> {
    const now = Date.now();
    return {
      provider: "mock",
      feeOre: 4900,
      etaMinutes: 35,
      pickupEstimate: new Date(now + 20 * 60_000).toISOString(),
      deliveryEstimate: new Date(now + 35 * 60_000).toISOString(),
      expiresAt: new Date(now + 10 * 60_000).toISOString(),
      quoteId: `quote_${request.restaurantId}_${now}`,
    };
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
}
