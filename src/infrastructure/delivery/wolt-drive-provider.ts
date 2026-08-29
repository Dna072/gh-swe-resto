import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logging/logger";
import type { DeliveryProvider } from "@/domains/delivery/provider";
import type {
  CreateDeliveryRequest,
  DeliveryQuote,
  DeliveryQuoteRequest,
  DeliveryRecord,
} from "@/domains/delivery/models";

export interface WoltDriveConfig {
  apiBaseUrl: string;
  merchantId: string;
  apiKey: string;
}

/**
 * Wolt Drive adapter boundary. Methods throw until credentials exist and the
 * vendor contract has been tested. Core order logic must keep using DeliveryService.
 */
export class WoltDriveProvider implements DeliveryProvider {
  readonly providerId = "wolt_drive" as const;

  constructor(private readonly config?: WoltDriveConfig) {}

  async getDeliveryQuote(request: DeliveryQuoteRequest): Promise<DeliveryQuote> {
    this.assertConfigured();
    logger.info("Wolt Drive quote requested", { restaurantId: request.restaurantId });
    throw new AppError("DELIVERY_UNAVAILABLE", "Wolt Drive is not enabled in this environment.");
  }

  async validateDelivery(): Promise<boolean> {
    return Boolean(this.config?.apiKey);
  }

  async createDelivery(request: CreateDeliveryRequest): Promise<DeliveryRecord> {
    this.assertConfigured();
    logger.info("Wolt Drive delivery create requested", { orderId: request.orderId });
    throw new AppError("DELIVERY_UNAVAILABLE", "Wolt Drive is not enabled in this environment.");
  }

  async cancelDelivery(): Promise<void> {
    this.assertConfigured();
  }

  async getDeliveryStatus(): Promise<DeliveryRecord> {
    this.assertConfigured();
    throw new AppError("DELIVERY_UNAVAILABLE", "Wolt Drive is not enabled in this environment.");
  }

  async getTrackingUrl(): Promise<string | undefined> {
    return undefined;
  }

  private assertConfigured(): void {
    if (!this.config?.apiKey || !this.config.apiBaseUrl || !this.config.merchantId) {
      throw new AppError(
        "DELIVERY_UNAVAILABLE",
        "Wolt Drive credentials are not configured. Use the mock provider in development.",
      );
    }
  }
}
