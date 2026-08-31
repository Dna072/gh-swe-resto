import { formatSek } from "@/lib/money";
import type { PricedDeliveryOption } from "./models";

export type PublicDeliveryOption = {
  provider: string;
  displayName: string;
  estimatedDeliveryMinutes: number;
  customerDeliveryFeeOre: number;
  feeLabel: string;
  quoteId: string;
  expiresAt?: string;
  currency: "SEK";
};

export function toPublicDeliveryOption(option: PricedDeliveryOption): PublicDeliveryOption {
  return {
    provider: option.provider,
    displayName: option.displayName,
    estimatedDeliveryMinutes: option.estimatedDeliveryMinutes,
    customerDeliveryFeeOre: option.customerDeliveryFeeOre,
    feeLabel: formatSek(option.customerDeliveryFeeOre),
    quoteId: option.quoteId,
    expiresAt: option.expiresAt,
    currency: option.currency,
  };
}
