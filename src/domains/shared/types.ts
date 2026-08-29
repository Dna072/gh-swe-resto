import type { CurrencyCode, Ore } from "@/lib/money";
import type { IsoDateTime } from "@/lib/time";

export const SCHEMA_VERSION = 1;

export type RestaurantId = string;

export interface Timestamped {
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface MoneySnapshot {
  currency: CurrencyCode;
  amountOre: Ore;
}

export interface AddressSnapshot {
  line1: string;
  line2?: string;
  postalCode: string;
  city: string;
  country: string;
  lat?: number;
  lng?: number;
  formatted?: string;
}

export interface CustomerSnapshot {
  customerId?: string;
  guestSessionId?: string;
  name: string;
  email: string;
  phone: string;
}

export interface PageQuery {
  restaurantId: RestaurantId;
  cursor?: string;
  limit?: number;
}
