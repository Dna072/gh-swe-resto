import { logger } from "@/lib/logging/logger";
import type { NotificationEvent } from "@/domains/notifications/models";
import type { Order, OrderStatus } from "@/domains/orders/models";
import { notificationService } from "@/server/composition";

export function notificationEventForStatus(status: OrderStatus): NotificationEvent | undefined {
  switch (status) {
    case "PAID":
      return "ORDER_CONFIRMED";
    case "PREPARING":
      return "ORDER_PREPARING";
    case "PACKING":
    case "READY":
      return "ORDER_PACKED";
    case "COURIER_ASSIGNED":
      return "COURIER_ASSIGNED";
    case "OUT_FOR_DELIVERY":
      return "OUT_FOR_DELIVERY";
    case "DELIVERED":
      return "DELIVERED";
    case "CANCELLED":
      return "ORDER_CANCELLED";
    case "PAYMENT_FAILED":
      return "PAYMENT_FAILED";
    default:
      return undefined;
  }
}

export async function notifyOrder(order: Order, status: OrderStatus = order.orderStatus): Promise<void> {
  const event = notificationEventForStatus(status);
  const to = order.customerSnapshot.email?.trim();
  if (!event || !to) {
    return;
  }
  try {
    await notificationService.notify({
      event,
      to,
      orderId: order.id,
      idempotencyKey: `notify:${order.id}:${event}`,
    });
  } catch (error) {
    logger.warn("order_notification_failed", {
      orderId: order.id,
      event,
      message: error instanceof Error ? error.message : "unknown",
    });
  }
}
