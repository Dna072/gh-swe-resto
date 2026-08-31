import type { AddressSnapshot } from "@/domains/shared/types";
import type { Ore } from "@/lib/money";
import type { DeliveryPricingConfig, DeliveryPricingStrategy, PricedDelivery } from "./pricing";

export type DeliveryProviderId = "wolt_drive" | "foodora" | "mock";

export interface DeliveryQuoteRequest {
  restaurantId: string;
  pickup: AddressSnapshot;
  dropoff: AddressSnapshot;
  orderValueOre: Ore;
  scheduledFor?: string;
  instructions?: string;
}

export interface DeliveryQuote {
  provider: DeliveryProviderId;
  available: boolean;
  feeOre: Ore;
  providerDeliveryCostOre: Ore;
  currency: "SEK";
  etaMinutes: number;
  pickupEstimate: string;
  deliveryEstimate: string;
  expiresAt?: string;
  quotedAt: string;
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
  instructions?: string;
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

export type DeliverySelectionStrategy =
  | "customer"
  | "cheapest"
  | "fastest"
  | "preferred";

export interface DeliveryProviderSettings {
  id: DeliveryProviderId;
  enabled: boolean;
  displayName: string;
  priority: number;
}

export interface DeliverySettings {
  restaurantId: string;
  providers: DeliveryProviderSettings[];
  customerCanSelect: boolean;
  selectionStrategy: DeliverySelectionStrategy;
  preferredProvider?: DeliveryProviderId;
  pricing: DeliveryPricingConfig;
}

export interface PricedDeliveryOption extends PricedDelivery {
  provider: DeliveryProviderId;
  displayName: string;
  available: true;
  estimatedDeliveryMinutes: number;
  quoteId: string;
  quotedAt: string;
  expiresAt?: string;
  currency: "SEK";
}

export interface DeliveryPricingSnapshot {
  provider: DeliveryProviderId;
  providerQuoteId: string;
  providerDeliveryCostOre: Ore;
  customerDeliveryFeeOre: Ore;
  restaurantMarkupOre: Ore;
  restaurantSubsidyOre: Ore;
  pricingStrategy: DeliveryPricingStrategy;
  markupCeilingOre?: Ore;
  ceilingTriggered: boolean;
  quotedAt: string;
  quoteExpiresAt?: string;
  estimatedDeliveryMinutes: number;
}

export const DEFAULT_PROVIDER_DISPLAY: Record<DeliveryProviderId, string> = {
  wolt_drive: "Wolt",
  foodora: "foodora",
  mock: "Delivery",
};

export function defaultDeliverySettings(restaurantId: string): DeliverySettings {
  return {
    restaurantId,
    providers: [
      { id: "wolt_drive", enabled: true, displayName: "Wolt", priority: 1 },
      { id: "foodora", enabled: true, displayName: "foodora", priority: 2 },
    ],
    customerCanSelect: true,
    selectionStrategy: "customer",
    preferredProvider: "wolt_drive",
    pricing: { strategy: "PASS_THROUGH", enabled: true },
  };
}
