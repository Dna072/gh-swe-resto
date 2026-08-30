import { newId } from "@/lib/ids";
import type { AnalyticsEvent, AnalyticsRecord, ContributionMargin } from "./models";
import type { AnalyticsRepository } from "./repository";

export interface AnalyticsSink {
  publish(event: AnalyticsEvent): Promise<void>;
}

export class AnalyticsService {
  constructor(
    private readonly sink: AnalyticsSink,
    private readonly records?: AnalyticsRepository,
  ) {}

  async track(event: AnalyticsEvent): Promise<void> {
    await this.sink.publish(event);
    if (!this.records) {
      return;
    }
    const record: AnalyticsRecord = {
      ...event,
      id: newId(),
      path: typeof event.properties.path === "string" ? event.properties.path : undefined,
      locale: typeof event.properties.locale === "string" ? event.properties.locale : undefined,
      timezone: typeof event.properties.timezone === "string" ? event.properties.timezone : undefined,
      country: typeof event.properties.country === "string" ? event.properties.country : undefined,
      city: typeof event.properties.city === "string" ? event.properties.city : undefined,
      region: typeof event.properties.region === "string" ? event.properties.region : undefined,
    };
    await this.records.append(record);
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
