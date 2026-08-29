import type { Timestamped } from "@/domains/shared/types";

export type MembershipStatus = "NONE" | "ACTIVE" | "PAUSED" | "CANCELLED";

export interface Plan extends Timestamped {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  benefitIds: string[];
}

export type BenefitType =
  | "FREE_DELIVERY"
  | "MEAL_DISCOUNT"
  | "EXCLUSIVE_MEALS"
  | "PRIORITY_ORDERING"
  | "LOYALTY_BONUS";

export interface Benefit {
  id: string;
  type: BenefitType;
  percentOff?: number;
}

export interface Membership extends Timestamped {
  id: string;
  customerId: string;
  restaurantId: string;
  planId: string;
  status: MembershipStatus;
}

export interface LoyaltyPreview {
  pointsBalance: number;
  pendingRewards: number;
}
