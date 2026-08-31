import type { AddressSnapshot } from "@/domains/shared/types";
import type { PriceQuote } from "@/domains/pricing/models";

export interface CartModifierSelection {
  groupId: string;
  optionId: string;
  quantity: number;
}

export interface CartLineInput {
  menuItemId: string;
  quantity: number;
  modifiers: CartModifierSelection[];
  notes?: string;
}

export interface CartQuoteRequest {
  restaurantId: string;
  lines: CartLineInput[];
  deliveryAddress?: AddressSnapshot;
  deliveryFeeOre?: number;
  promotionCode?: string;
  customerId?: string;
  guestSessionId?: string;
  isMember?: boolean;
  isFirstOrder?: boolean;
  orderingPaused?: boolean;
  at?: Date;
}

export interface CartQuote extends PriceQuote {
  restaurantId: string;
  quotedAt: string;
  expiresAt: string;
}
