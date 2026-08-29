import { AppError } from "@/lib/errors";
import type { DeliveryProvider } from "@/domains/delivery/provider";
import type { DeliveryQuote, DeliveryRecord } from "@/domains/delivery/models";

/**
 * Reserved Foodora adapter. Not implemented in V1 Phase 0.
 */
export class FoodoraProvider implements DeliveryProvider {
  readonly providerId = "foodora" as const;

  async getDeliveryQuote(): Promise<DeliveryQuote> {
    throw new AppError("DELIVERY_UNAVAILABLE", "Foodora delivery is not implemented yet.");
  }

  async validateDelivery(): Promise<boolean> {
    return false;
  }

  async createDelivery(): Promise<DeliveryRecord> {
    throw new AppError("DELIVERY_UNAVAILABLE", "Foodora delivery is not implemented yet.");
  }

  async cancelDelivery(): Promise<void> {
    throw new AppError("DELIVERY_UNAVAILABLE", "Foodora delivery is not implemented yet.");
  }

  async getDeliveryStatus(): Promise<DeliveryRecord> {
    throw new AppError("DELIVERY_UNAVAILABLE", "Foodora delivery is not implemented yet.");
  }

  async getTrackingUrl(): Promise<string | undefined> {
    return undefined;
  }
}
