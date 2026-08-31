import { logger } from "@/lib/logging/logger";
import type { Order } from "@/domains/orders/models";
import type { OrderWriteRepository } from "@/domains/orders/repository";
import type { AddressSnapshot } from "@/domains/shared/types";
import type { DeliveryProvider } from "./provider";

const DISPATCH_STATUSES = new Set(["READY", "COURIER_ASSIGNED"]);

export class DeliveryDispatchService {
  constructor(
    private readonly providers: DeliveryProvider[],
    private readonly orders: OrderWriteRepository,
    private readonly pickup: () => AddressSnapshot,
  ) {}

  providerFor(id: string | undefined): DeliveryProvider | undefined {
    return this.providers.find((provider) => provider.providerId === id);
  }

  /** Creates the last-mile delivery once, after kitchen dispatch. Quotes never call this. */
  async dispatchIfReady(order: Order): Promise<Order> {
    if (order.fulfillment === "PICKUP") {
      return order;
    }
    if (order.providerDeliveryId) {
      return order;
    }
    if (!DISPATCH_STATUSES.has(order.orderStatus)) {
      return order;
    }
    const provider = this.providerFor(order.deliveryProvider);
    if (!provider?.capabilities.supportsDeliveryCreation) {
      return order;
    }
    const quoteId = order.deliveryPricing?.providerQuoteId ?? order.deliveryId ?? "";
    try {
      const record = await provider.createDelivery({
        orderId: order.id,
        quoteId,
        pickup: this.pickup(),
        dropoff: order.deliveryAddressSnapshot,
        idempotencyKey: `delivery:${order.id}`,
        customerName: order.customerSnapshot.name,
        customerPhone: order.customerSnapshot.phone,
        instructions: order.specialInstructions,
      });
      return this.orders.update({
        ...order,
        providerDeliveryId: record.providerDeliveryId,
        trackingUrl: record.trackingUrl,
        deliveryStatus: "SCHEDULED",
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      logger.info("delivery_dispatch_skipped", {
        orderId: order.id,
        provider: order.deliveryProvider,
        reason: error instanceof Error ? error.message : "unknown",
      });
      return order;
    }
  }

  async cancelIfCreated(order: Order): Promise<void> {
    if (!order.providerDeliveryId) {
      return;
    }
    const provider = this.providerFor(order.deliveryProvider);
    if (!provider?.capabilities.supportsCancellation) {
      return;
    }
    try {
      await provider.cancelDelivery(order.providerDeliveryId);
    } catch (error) {
      logger.info("delivery_cancel_skipped", {
        orderId: order.id,
        provider: order.deliveryProvider,
        reason: error instanceof Error ? error.message : "unknown",
      });
    }
  }
}
