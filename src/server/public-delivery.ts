import type { Order } from "@/domains/orders/models";

export type PublicDelivery = {
  orderId: string;
  publicOrderNumber: string;
  deliveryStatus: Order["deliveryStatus"];
  orderStatus: Order["orderStatus"];
  trackingUrl?: string;
  estimatedDeliveryTime?: string;
  scheduledFor?: string;
  deliveryProviderName?: string;
};

export function toPublicDelivery(order: Order): PublicDelivery {
  return {
    orderId: order.id,
    publicOrderNumber: order.publicOrderNumber,
    deliveryStatus: order.deliveryStatus,
    orderStatus: order.orderStatus,
    trackingUrl: order.trackingUrl,
    estimatedDeliveryTime: order.estimatedDeliveryTime,
    scheduledFor: order.scheduledFor,
    deliveryProviderName: order.deliveryProvider,
  };
}
