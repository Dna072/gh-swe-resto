import { logger } from "@/lib/logging/logger";
import type { AnalyticsEvent } from "@/domains/analytics/models";
import type { AnalyticsSink } from "@/domains/analytics/service";

export class InMemoryAnalyticsSink implements AnalyticsSink {
  readonly events: AnalyticsEvent[] = [];

  async publish(event: AnalyticsEvent): Promise<void> {
    this.events.push(event);
  }
}

export class LoggingAnalyticsSink implements AnalyticsSink {
  async publish(event: AnalyticsEvent): Promise<void> {
    logger.info("analytics_event", { name: event.name, restaurantId: event.restaurantId });
  }
}

/**
 * Production sink should publish to Pub/Sub, then BigQuery. Not wired until
 * analytics volume justifies it.
 */
export class PubSubAnalyticsSink implements AnalyticsSink {
  async publish(event: AnalyticsEvent): Promise<void> {
    logger.info("Pub/Sub analytics sink is reserved for later phases", { name: event.name });
  }
}
