import type { Ore } from "@/lib/money";
import type { Timestamped } from "@/domains/shared/types";

export type PromotionType =
  | "PERCENTAGE"
  | "FIXED"
  | "FREE_DELIVERY"
  | "ITEM"
  | "CATEGORY";

export interface Promotion extends Timestamped {
  id: string;
  restaurantId: string;
  code: string;
  type: PromotionType;
  percentOff?: number;
  amountOffOre?: Ore;
  itemId?: string;
  categoryId?: string;
  minimumOrderOre?: Ore;
  firstOrderOnly: boolean;
  memberOnly: boolean;
  startsAt?: string;
  expiresAt?: string;
  maxRedemptions?: number;
  perCustomerLimit?: number;
  redemptionCount: number;
  stackable: boolean;
  active: boolean;
}

export interface PromotionUsage {
  id: string;
  promotionId: string;
  customerKey: string;
  count: number;
}

export interface PromotionContext {
  restaurantId: string;
  customerId?: string;
  guestSessionId?: string;
  isMember: boolean;
  isFirstOrder: boolean;
  at?: Date;
}

export interface DiscountResult {
  promotionId?: string;
  code?: string;
  discountOre: Ore;
  freeDelivery: boolean;
}
