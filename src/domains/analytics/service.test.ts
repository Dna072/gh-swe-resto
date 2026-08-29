import { describe, expect, it } from "vitest";
import { AnalyticsService } from "./service";
import { InMemoryAnalyticsSink } from "@/infrastructure/analytics/sinks";

describe("AnalyticsService", () => {
  it("keeps contribution margin internal and accurate", () => {
    const service = new AnalyticsService(new InMemoryAnalyticsSink());
    const margin = service.contributionMargin({
      revenueOre: 17800,
      foodCostOre: 4200,
      packagingCostOre: 400,
      deliveryCostOre: 3500,
      paymentFeeOre: 500,
      discountCostOre: 1290,
    });
    expect(margin.contributionOre).toBe(7910);
  });
});
