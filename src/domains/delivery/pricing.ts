import { AppError } from "@/lib/errors";
import { assertOre, clampNonNegativeOre, percentOfOre, type Ore } from "@/lib/money";

export const DELIVERY_PRICING_STRATEGIES = [
  "PASS_THROUGH",
  "SUBSIDIZED",
  "FREE",
  "MARKUP",
  "MARKUP_WITH_CEILING",
] as const;

export type DeliveryPricingStrategy = (typeof DELIVERY_PRICING_STRATEGIES)[number];
export type DeliveryAmountType = "FIXED" | "PERCENTAGE";

export interface DeliveryPricingConfig {
  strategy: DeliveryPricingStrategy;
  enabled?: boolean;
  markupType?: DeliveryAmountType;
  markupValue?: number;
  subsidyType?: DeliveryAmountType;
  subsidyValue?: number;
  markupCeilingOre?: Ore;
}

export interface PricedDelivery {
  providerDeliveryCostOre: Ore;
  customerDeliveryFeeOre: Ore;
  restaurantMarkupOre: Ore;
  restaurantSubsidyOre: Ore;
  pricingStrategy: DeliveryPricingStrategy;
  ceilingTriggered: boolean;
}

function requireNonNegative(value: number | undefined, label: string): number {
  if (value === undefined || !Number.isFinite(value) || value < 0) {
    throw new AppError("VALIDATION", `${label} must be a non-negative number.`);
  }
  return value;
}

export function validateDeliveryPricingConfig(config: DeliveryPricingConfig): DeliveryPricingConfig {
  if (!DELIVERY_PRICING_STRATEGIES.includes(config.strategy)) {
    throw new AppError("VALIDATION", "Unknown delivery pricing strategy.");
  }
  if (config.strategy === "MARKUP" || config.strategy === "MARKUP_WITH_CEILING") {
    if (config.markupType !== "FIXED" && config.markupType !== "PERCENTAGE") {
      throw new AppError("VALIDATION", "Markup type is required for this strategy.");
    }
    requireNonNegative(config.markupValue, "Markup");
    if (config.markupType === "FIXED") {
      assertOre(config.markupValue ?? 0, "markupValue");
    }
  }
  if (config.strategy === "MARKUP_WITH_CEILING") {
    const ceiling = requireNonNegative(config.markupCeilingOre, "Provider-cost ceiling");
    assertOre(ceiling, "markupCeilingOre");
  }
  if (config.strategy === "SUBSIDIZED") {
    if (config.subsidyType !== "FIXED" && config.subsidyType !== "PERCENTAGE") {
      throw new AppError("VALIDATION", "Subsidy type is required for this strategy.");
    }
    requireNonNegative(config.subsidyValue, "Subsidy");
    if (config.subsidyType === "FIXED") {
      assertOre(config.subsidyValue ?? 0, "subsidyValue");
    }
  }
  return config;
}

function applyAmount(baseOre: Ore, type: DeliveryAmountType | undefined, value: number | undefined): Ore {
  if (type === "PERCENTAGE") {
    return percentOfOre(baseOre, value ?? 0);
  }
  return assertOre(value ?? 0, "amount");
}

export class DeliveryPricingService {
  price(providerDeliveryCostOre: Ore, config: DeliveryPricingConfig): PricedDelivery {
    const cost = assertOre(providerDeliveryCostOre, "providerDeliveryCostOre");
    if (cost < 0) {
      throw new AppError("VALIDATION", "Provider delivery cost cannot be negative.");
    }
    const validated = validateDeliveryPricingConfig(config);

    if (validated.strategy === "FREE") {
      return {
        providerDeliveryCostOre: cost,
        customerDeliveryFeeOre: 0,
        restaurantMarkupOre: 0,
        restaurantSubsidyOre: cost,
        pricingStrategy: "FREE",
        ceilingTriggered: false,
      };
    }

    if (validated.strategy === "PASS_THROUGH") {
      return {
        providerDeliveryCostOre: cost,
        customerDeliveryFeeOre: cost,
        restaurantMarkupOre: 0,
        restaurantSubsidyOre: 0,
        pricingStrategy: "PASS_THROUGH",
        ceilingTriggered: false,
      };
    }

    if (validated.strategy === "SUBSIDIZED") {
      const subsidy = applyAmount(cost, validated.subsidyType, validated.subsidyValue);
      const customer = clampNonNegativeOre(cost - subsidy);
      return {
        providerDeliveryCostOre: cost,
        customerDeliveryFeeOre: customer,
        restaurantMarkupOre: 0,
        restaurantSubsidyOre: cost - customer,
        pricingStrategy: "SUBSIDIZED",
        ceilingTriggered: false,
      };
    }

    const ceiling = validated.markupCeilingOre ?? 0;
    const ceilingTriggered =
      validated.strategy === "MARKUP_WITH_CEILING" && cost > ceiling;

    if (ceilingTriggered) {
      return {
        providerDeliveryCostOre: cost,
        customerDeliveryFeeOre: cost,
        restaurantMarkupOre: 0,
        restaurantSubsidyOre: 0,
        pricingStrategy: "MARKUP_WITH_CEILING",
        ceilingTriggered: true,
      };
    }

    const markup = applyAmount(cost, validated.markupType, validated.markupValue);
    return {
      providerDeliveryCostOre: cost,
      customerDeliveryFeeOre: cost + markup,
      restaurantMarkupOre: markup,
      restaurantSubsidyOre: 0,
      pricingStrategy: validated.strategy,
      ceilingTriggered: false,
    };
  }
}
