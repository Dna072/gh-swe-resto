export const ANALYTICS_EVENTS = [
  "page_viewed",
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
  "delivery_checked",
  "marketing_signup",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

export type VisitorLocation = {
  country?: string;
  region?: string;
  city?: string;
};

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  occurredAt: string;
  restaurantId: string;
  sessionId?: string;
  customerId?: string;
  properties: Record<string, string | number | boolean | null>;
}

export interface AnalyticsRecord extends AnalyticsEvent, VisitorLocation {
  id: string;
  path?: string;
  locale?: string;
  timezone?: string;
}

export interface MarketingSignup {
  id: string;
  restaurantId: string;
  email: string;
  consentedAt: string;
  source?: string;
  locale?: string;
  country?: string;
  city?: string;
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

export type VisitorSession = {
  sessionId: string;
  firstSeen: string;
  lastSeen: string;
  actionCount: number;
  lastAction: AnalyticsEventName;
  path?: string;
  locale?: string;
  country?: string;
  city?: string;
  signedUp: boolean;
};

export type SalesTotals = {
  paidCount: number;
  paidTotalOre: number;
  pendingCount: number;
  pendingTotalOre: number;
  todayPaidOre: number;
  weekPaidOre: number;
  averagePaidOre: number;
};

export type AnalyticsOverview = {
  visitorsToday: number;
  visitorsWeek: number;
  uniqueSessions: number;
  byCountry: Array<{ country: string; count: number }>;
  recentVisitors: VisitorSession[];
  recentActions: AnalyticsRecord[];
  signups: MarketingSignup[];
  signupCount: number;
  sales: SalesTotals;
};
