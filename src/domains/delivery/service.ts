import { AppError } from "@/lib/errors";
import type { AddressSnapshot } from "@/domains/shared/types";
import type { DeliveryProvider } from "./provider";
import type {
  DeliveryQuote,
  DeliveryQuoteRequest,
  DeliverySelectionRule,
  DeliveryZone,
} from "./models";

export class DeliveryService {
  constructor(
    private readonly providers: DeliveryProvider[],
    private readonly rules: DeliverySelectionRule,
  ) {}

  validateZone(
    address: AddressSnapshot,
    zones: DeliveryZone[],
    options?: { allowCityWide?: boolean },
  ): DeliveryZone {
    const postal = address.postalCode.replace(/\s+/g, "");
    const zone = zones.find(
      (candidate) => candidate.active && candidate.postalCodes.some((code) => code.replace(/\s+/g, "") === postal),
    );
    if (zone) {
      return zone;
    }
    if (options?.allowCityWide) {
      const fallback = zones.find((candidate) => candidate.id === "uppsala-south" && candidate.active)
        ?? zones.find((candidate) => candidate.active);
      if (fallback) {
        return fallback;
      }
    }
    throw new AppError("DELIVERY_UNAVAILABLE", "We do not deliver to this address yet.");
  }

  async quote(request: DeliveryQuoteRequest, zone: DeliveryZone): Promise<DeliveryQuote> {
    const available = this.providers.filter((provider) => zone.providers.includes(provider.providerId));
    if (available.length === 0) {
      throw new AppError("DELIVERY_UNAVAILABLE", "No delivery partner is available for this area.");
    }
    const quotes: DeliveryQuote[] = [];
    for (const provider of available) {
      const valid = await provider.validateDelivery(request);
      if (!valid) {
        continue;
      }
      quotes.push(await provider.getDeliveryQuote(request));
    }
    if (quotes.length === 0) {
      throw new AppError("DELIVERY_UNAVAILABLE", "Delivery is temporarily unavailable. Please try again.");
    }
    return this.selectQuote(quotes);
  }

  selectQuote(quotes: DeliveryQuote[]): DeliveryQuote {
    const preferred = this.rules.preferredProviders;
    const ranked = [...quotes].sort((a, b) => {
      const preferredDelta =
        preferred.indexOf(a.provider === "mock" ? "wolt_drive" : a.provider) -
        preferred.indexOf(b.provider === "mock" ? "wolt_drive" : b.provider);
      if (this.rules.preferCheapest && a.feeOre !== b.feeOre) {
        return a.feeOre - b.feeOre;
      }
      if (preferredDelta !== 0 && preferred.length > 0) {
        return preferredDelta;
      }
      return a.etaMinutes - b.etaMinutes;
    });
    const selected = ranked[0];
    if (!selected) {
      throw new AppError("DELIVERY_UNAVAILABLE", "Delivery is temporarily unavailable.");
    }
    if (this.rules.maxFeeOre !== undefined && selected.feeOre > this.rules.maxFeeOre) {
      throw new AppError("DELIVERY_UNAVAILABLE", "Delivery is temporarily too expensive for this area.");
    }
    return selected;
  }
}
