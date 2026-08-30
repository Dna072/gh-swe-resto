import type { AnalyticsRecord, MarketingSignup } from "./models";

export interface AnalyticsRepository {
  append(record: AnalyticsRecord): Promise<void>;
  listRecent(restaurantId: string, limit: number): Promise<AnalyticsRecord[]>;
}

export interface MarketingSignupRepository {
  upsert(signup: MarketingSignup): Promise<void>;
  list(restaurantId: string): Promise<MarketingSignup[]>;
}
