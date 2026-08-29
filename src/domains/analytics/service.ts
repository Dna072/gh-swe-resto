import type { AnalyticsEvent, ContributionMargin } from "./models";

export interface AnalyticsSink {
  publish(event: AnalyticsEvent): Promise<void>;
}

export class AnalyticsService {
  constructor(private readonly sink: AnalyticsSink) {}

  track(event: AnalyticsEvent): Promise<void> {
    return this.sink.publish(event);
  }

  contributionMargin(input: Omit<ContributionMargin, "contributionOre">): ContributionMargin {
    const contributionOre =
      input.revenueOre -
      input.foodCostOre -
      input.packagingCostOre -
      input.deliveryCostOre -
      input.paymentFeeOre -
      input.discountCostOre;
    return { ...input, contributionOre };
  }
}
