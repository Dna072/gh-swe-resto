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

/**
 * foodora last-mile adapter.
 *
 * Public foodora developer docs (developer.foodora.com) describe marketplace
 * Partner API / incoming orders — not a Wolt-style quote + create-delivery
 * DaaS. Until the restaurant has a commercial last-mile contract and official
 * quote/availability endpoints, this adapter stays disabled and does not
 * invent HTTP calls.
 *
 * TODO: replace with the official foodora last-mile API once credentials and
 * documented quote/availability methods are supplied.
 */
export class FoodoraProvider implements DeliveryProvider {
  readonly providerId = "foodora" as const;
  readonly displayName = "foodora";
  readonly capabilities: ProviderCapabilities = {
    supportsAvailabilityCheck: false,
    supportsQuote: false,
    supportsQuoteExpiration: false,
    supportsDeliveryCreation: false,
    supportsCancellation: false,
    supportsTracking: false,
    supportsWebhooks: true,
  };

  constructor(
    private readonly apiKey?: string,
    private readonly webhookSecret?: string,
  ) {}

  async checkAvailability(): Promise<boolean> {
    return false;
  }

  async getQuote(_request: DeliveryQuoteRequest): Promise<DeliveryQuote> {
    logger.info("foodora quote skipped; last-mile API is not documented for this merchant");
    throw new AppError("DELIVERY_UNAVAILABLE", "Delivery is currently unavailable from this provider.");
  }

  async validateDelivery(): Promise<boolean> {
    return false;
  }

  async getDeliveryQuote(request: DeliveryQuoteRequest): Promise<DeliveryQuote> {
    return this.getQuote(request);
  }

  async createDelivery(_request: CreateDeliveryRequest): Promise<DeliveryRecord> {
    throw new AppError("DELIVERY_UNAVAILABLE", "Delivery is currently unavailable from this provider.");
  }

  async cancelDelivery(): Promise<void> {
    return;
  }

  async getDeliveryStatus(): Promise<DeliveryRecord> {
    throw new AppError("DELIVERY_UNAVAILABLE", "Delivery is currently unavailable from this provider.");
  }

  async getTrackingUrl(): Promise<string | undefined> {
    return undefined;
  }

  async handleWebhook(rawBody: string, headers: Record<string, string | undefined>): Promise<NormalizedDeliveryEvent> {
    assertWebhookSignature(rawBody, headers, this.webhookSecret);
    const payload = JSON.parse(rawBody) as Record<string, unknown>;
    return normalizeWebhookPayload("foodora", payload, `foodora:${Date.now()}`);
  }
}
