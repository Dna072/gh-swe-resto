import type {
  CreateDeliveryRequest,
  DeliveryQuote,
  DeliveryQuoteRequest,
  DeliveryRecord,
} from "./models";

export interface ProviderCapabilities {
  supportsAvailabilityCheck: boolean;
  supportsQuote: boolean;
  supportsQuoteExpiration: boolean;
  supportsDeliveryCreation: boolean;
  supportsCancellation: boolean;
  supportsTracking: boolean;
  supportsWebhooks: boolean;
}

export interface DeliveryProvider {
  readonly providerId: DeliveryRecord["provider"];
  readonly displayName: string;
  readonly capabilities: ProviderCapabilities;
  checkAvailability(request: DeliveryQuoteRequest): Promise<boolean>;
  getQuote(request: DeliveryQuoteRequest): Promise<DeliveryQuote>;
  createDelivery(request: CreateDeliveryRequest): Promise<DeliveryRecord>;
  cancelDelivery(providerDeliveryId: string): Promise<void>;
  getDeliveryStatus(providerDeliveryId: string): Promise<DeliveryRecord>;
  getTrackingUrl(providerDeliveryId: string): Promise<string | undefined>;
  handleWebhook(rawBody: string, headers: Record<string, string | undefined>): Promise<import("./webhooks").NormalizedDeliveryEvent>;
  /** @deprecated use checkAvailability */
  validateDelivery(request: DeliveryQuoteRequest): Promise<boolean>;
  /** @deprecated use getQuote */
  getDeliveryQuote(request: DeliveryQuoteRequest): Promise<DeliveryQuote>;
}

export const FULL_SANDBOX_CAPABILITIES: ProviderCapabilities = {
  supportsAvailabilityCheck: true,
  supportsQuote: true,
  supportsQuoteExpiration: true,
  supportsDeliveryCreation: true,
  supportsCancellation: true,
  supportsTracking: true,
  supportsWebhooks: true,
};
