import type { AnalyticsRecord, MarketingSignup } from "@/domains/analytics/models";
import type { AnalyticsRepository, MarketingSignupRepository } from "@/domains/analytics/repository";

export class InMemoryAnalyticsRepository implements AnalyticsRepository {
  constructor(private readonly events: AnalyticsRecord[]) {}

  async append(record: AnalyticsRecord): Promise<void> {
    this.events.unshift(record);
  }

  async listRecent(restaurantId: string, limit: number): Promise<AnalyticsRecord[]> {
    return this.events.filter((event) => event.restaurantId === restaurantId).slice(0, limit);
  }
}

export class InMemoryMarketingSignupRepository implements MarketingSignupRepository {
  constructor(private readonly signups: MarketingSignup[]) {}

  async upsert(signup: MarketingSignup): Promise<void> {
    const index = this.signups.findIndex(
      (entry) => entry.restaurantId === signup.restaurantId && entry.email === signup.email,
    );
    if (index >= 0) {
      this.signups[index] = signup;
      return;
    }
    this.signups.push(signup);
  }

  async list(restaurantId: string): Promise<MarketingSignup[]> {
    return this.signups
      .filter((entry) => entry.restaurantId === restaurantId)
      .sort((a, b) => b.consentedAt.localeCompare(a.consentedAt));
  }
}
