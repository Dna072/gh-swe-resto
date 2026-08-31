import { AppError } from "@/lib/errors";
import type { DeliveryProvider } from "./provider";
import type {
  DeliveryQuote,
  DeliveryQuoteRequest,
  DeliverySettings,
  PricedDeliveryOption,
} from "./models";
import { DeliveryPricingService } from "./pricing";

export class DeliveryProviderSelector {
  constructor(
    private readonly providers: DeliveryProvider[],
    private readonly settings: () => DeliverySettings,
    private readonly pricing = new DeliveryPricingService(),
  ) {}

  enabledProviders(): DeliveryProvider[] {
    const enabled = new Set(
      this.settings()
        .providers.filter((entry) => entry.enabled)
        .map((entry) => entry.id),
    );
    return this.providers.filter((provider) => enabled.has(provider.providerId));
  }

  async options(request: DeliveryQuoteRequest): Promise<PricedDeliveryOption[]> {
    const settings = this.settings();
    const enabled = this.enabledProviders();
    const priced: PricedDeliveryOption[] = [];
    let hardFailures = 0;
    for (const provider of enabled) {
      try {
        const available = provider.capabilities.supportsAvailabilityCheck
          ? await provider.checkAvailability(request)
          : false;
        if (!available || !provider.capabilities.supportsQuote) {
          continue;
        }
        const quote = await provider.getQuote(request);
        if (!quote.available) {
          continue;
        }
        const money = this.pricing.price(quote.providerDeliveryCostOre, settings.pricing);
        priced.push({
          ...money,
          provider: quote.provider,
          displayName: settings.providers.find((entry) => entry.id === quote.provider)?.displayName ?? provider.displayName,
          available: true,
          estimatedDeliveryMinutes: quote.etaMinutes,
          quoteId: quote.quoteId,
          quotedAt: quote.quotedAt,
          expiresAt: quote.expiresAt,
          currency: quote.currency,
        });
      } catch (error) {
        if (error instanceof AppError && error.code === "DELIVERY_UNAVAILABLE") {
          continue;
        }
        hardFailures += 1;
      }
    }
    if (priced.length === 0 && enabled.length > 0 && hardFailures === enabled.length) {
      throw new AppError(
        "QUOTE_FAILED",
        "We couldn't calculate the delivery cost right now. Please try again.",
      );
    }
    return this.sortOptions(priced, settings);
  }

  pick(options: PricedDeliveryOption[], selectedProvider?: string): PricedDeliveryOption {
    const settings = this.settings();
    if (selectedProvider) {
      const match = options.find((option) => option.provider === selectedProvider);
      if (!match) {
        throw new AppError("DELIVERY_UNAVAILABLE", "Delivery is currently unavailable from this provider.");
      }
      return match;
    }
    if (settings.customerCanSelect && options.length === 1 && options[0]) {
      return options[0];
    }
    const ranked = this.sortOptions(options, settings);
    const first = ranked[0];
    if (!first) {
      throw new AppError("DELIVERY_UNAVAILABLE", "Sorry, we currently can't deliver to this address.");
    }
    return first;
  }

  private sortOptions(options: PricedDeliveryOption[], settings: DeliverySettings): PricedDeliveryOption[] {
    const preferred = settings.preferredProvider;
    return [...options].sort((a, b) => {
      if (settings.selectionStrategy === "fastest") {
        return a.estimatedDeliveryMinutes - b.estimatedDeliveryMinutes;
      }
      if (settings.selectionStrategy === "preferred" && preferred) {
        if (a.provider === preferred) {
          return -1;
        }
        if (b.provider === preferred) {
          return 1;
        }
      }
      if (a.customerDeliveryFeeOre !== b.customerDeliveryFeeOre) {
        return a.customerDeliveryFeeOre - b.customerDeliveryFeeOre;
      }
      return a.estimatedDeliveryMinutes - b.estimatedDeliveryMinutes;
    });
  }
}

export async function quoteFromProviders(
  selector: DeliveryProviderSelector,
  request: DeliveryQuoteRequest,
  selectedProvider?: string,
): Promise<{ options: PricedDeliveryOption[]; selected: PricedDeliveryOption | null; quote: DeliveryQuote | null }> {
  const options = await selector.options(request);
  if (options.length === 0) {
    return { options, selected: null, quote: null };
  }
  const selected = selector.pick(options, selectedProvider);
  return {
    options,
    selected,
    quote: {
      provider: selected.provider,
      available: true,
      feeOre: selected.customerDeliveryFeeOre,
      providerDeliveryCostOre: selected.providerDeliveryCostOre,
      currency: "SEK",
      etaMinutes: selected.estimatedDeliveryMinutes,
      pickupEstimate: selected.quotedAt,
      deliveryEstimate: selected.expiresAt ?? selected.quotedAt,
      expiresAt: selected.expiresAt,
      quotedAt: selected.quotedAt,
      quoteId: selected.quoteId,
    },
  };
}
