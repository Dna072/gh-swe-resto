import type {
  CreateDeliveryRequest,
  DeliveryQuote,
  DeliveryQuoteRequest,
  DeliveryRecord,
} from "./models";

export interface DeliveryProvider {
  readonly providerId: DeliveryRecord["provider"];
  getDeliveryQuote(request: DeliveryQuoteRequest): Promise<DeliveryQuote>;
  validateDelivery(request: DeliveryQuoteRequest): Promise<boolean>;
  createDelivery(request: CreateDeliveryRequest): Promise<DeliveryRecord>;
  cancelDelivery(providerDeliveryId: string): Promise<void>;
  getDeliveryStatus(providerDeliveryId: string): Promise<DeliveryRecord>;
  getTrackingUrl(providerDeliveryId: string): Promise<string | undefined>;
}
