export const ANALYTICS_EVENTS = [
  "menu_viewed",
  "item_viewed",
  "item_added",
  "cart_viewed",
  "checkout_started",
  "payment_started",
  "payment_completed",
  "order_created",
  "order_cancelled",
  "order_delivered",
  "reorder_started",
  "promotion_used",
  "review_submitted",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  occurredAt: string;
  restaurantId: string;
  sessionId?: string;
  customerId?: string;
  properties: Record<string, string | number | boolean | null>;
}

export interface ContributionMargin {
  revenueOre: number;
  foodCostOre: number;
  packagingCostOre: number;
  deliveryCostOre: number;
  paymentFeeOre: number;
  discountCostOre: number;
  contributionOre: number;
}
