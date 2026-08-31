import type { ProcessedWebhookStore } from "@/domains/payments/service";
import type { Order } from "@/domains/orders/models";
import type { OrderWriteRepository } from "@/domains/orders/repository";
import { applyOrderTransition } from "@/domains/orders/state-machine";
import { logger } from "@/lib/logging/logger";
import type { DeliveryProvider } from "./provider";
import {
  orderStatusFromDelivery,
  shouldApplyDeliveryEvent,
  type NormalizedDeliveryEvent,
} from "./webhooks";

export class DeliveryWebhookProcessor {
  constructor(
    private readonly providers: DeliveryProvider[],
    private readonly orders: OrderWriteRepository,
    private readonly webhooks: ProcessedWebhookStore,
  ) {}

  async process(
    providerId: string,
    rawBody: string,
    headers: Record<string, string | undefined>,
  ): Promise<{ duplicate: boolean; ignored: boolean; event: NormalizedDeliveryEvent; order?: Order }> {
    const provider = this.providers.find((entry) => entry.providerId === providerId);
    if (!provider) {
      throw new Error("Unknown delivery provider.");
    }
    const event = await provider.handleWebhook(rawBody, headers);
    if (await this.webhooks.has(event.eventId)) {
      return { duplicate: true, ignored: true, event };
    }
    await this.webhooks.mark(event.eventId);
    if (event.unknown || !event.status) {
      logger.info("delivery_webhook_unknown", { provider: providerId, eventId: event.eventId });
      return { duplicate: false, ignored: true, event };
    }
    const order = await this.findOrder(event);
    if (!order) {
      logger.info("delivery_webhook_order_missing", { provider: providerId, eventId: event.eventId });
      return { duplicate: false, ignored: true, event };
    }
    if (!shouldApplyDeliveryEvent(order.deliveryStatus, event.status)) {
      return { duplicate: false, ignored: true, event };
    }
    let next: Order = {
      ...order,
      deliveryStatus: event.status,
      trackingUrl: event.trackingUrl ?? order.trackingUrl,
      providerDeliveryId: event.providerDeliveryId || order.providerDeliveryId,
      updatedAt: new Date().toISOString(),
    };
    const orderStatus = orderStatusFromDelivery(event.status);
    if (orderStatus && order.orderStatus !== "CANCELLED" && order.orderStatus !== "REFUNDED") {
      try {
        next = applyOrderTransition(next, orderStatus);
      } catch {
        next.orderStatus = orderStatus;
      }
    }
    await this.orders.update(next);
    return { duplicate: false, ignored: false, event, order: next };
  }

  private async findOrder(event: NormalizedDeliveryEvent): Promise<Order | null> {
    if (event.orderId) {
      const byId = await this.orders.getById(event.orderId);
      if (byId) {
        return byId;
      }
    }
    if (event.providerDeliveryId) {
      return this.orders.getByProviderDeliveryId(event.providerDeliveryId);
    }
    return null;
  }
}
