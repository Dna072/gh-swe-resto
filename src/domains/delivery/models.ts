import type { AddressSnapshot } from "@/domains/shared/types";
import type { Ore } from "@/lib/money";

export type DeliveryProviderId = "wolt_drive" | "foodora" | "mock";

export interface DeliveryQuoteRequest {
  restaurantId: string;
  pickup: AddressSnapshot;
  dropoff: AddressSnapshot;
  orderValueOre: Ore;
}

export interface DeliveryQuote {
  provider: DeliveryProviderId;
  feeOre: Ore;
  etaMinutes: number;
  pickupEstimate: string;
  deliveryEstimate: string;
  expiresAt: string;
  quoteId: string;
}

export interface CreateDeliveryRequest {
  orderId: string;
  quoteId: string;
  pickup: AddressSnapshot;
  dropoff: AddressSnapshot;
  idempotencyKey: string;
  customerName: string;
  customerPhone: string;
}

export interface DeliveryRecord {
  id: string;
  orderId: string;
  provider: DeliveryProviderId;
  providerDeliveryId: string;
  status: string;
  trackingUrl?: string;
  feeOre: Ore;
}

export interface DeliveryZone {
  id: string;
  restaurantId: string;
  name: string;
  postalCodes: string[];
  polygon?: Array<{ lat: number; lng: number }>;
  baseFeeOre: Ore;
  etaMinutes: number;
  active: boolean;
  providers: DeliveryProviderId[];
}

export interface DeliverySelectionRule {
  preferCheapest: boolean;
  maxFeeOre?: Ore;
  preferredProviders: DeliveryProviderId[];
}
