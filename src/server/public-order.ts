import "server-only";

import type { Order } from "@/domains/orders/models";
import { trackingStepsFor } from "@/domains/orders/state-machine";
import { formatSek } from "@/lib/money";
import type { PublicOrder } from "@/lib/orders/public";

function fulfillmentOf(order: Order): "DELIVERY" | "PICKUP" {
  if (order.fulfillment) {
    return order.fulfillment;
  }
  return order.deliveryStatus === "NOT_REQUESTED" ? "PICKUP" : "DELIVERY";
}

export function toPublicOrder(order: Order): PublicOrder {
  const fulfillment = fulfillmentOf(order);
  const steps = trackingStepsFor(fulfillment);
  const currentIndex = steps.findIndex((step) => step.status === order.orderStatus);
  const terminal = order.orderStatus === "CANCELLED" || order.orderStatus === "REFUNDED";
  return {
    id: order.id,
    publicOrderNumber: order.publicOrderNumber,
    fulfillment,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    deliveryStatus: order.deliveryStatus,
    items: order.items,
    subtotalOre: order.subtotalOre,
    deliveryFeeOre: order.deliveryFeeOre,
    discountTotalOre: order.discountTotalOre,
    taxTotalOre: order.taxTotalOre,
    totalOre: order.totalOre,
    totalLabel: formatSek(order.totalOre),
    currency: order.currency,
    deliveryAddress: order.deliveryAddressSnapshot,
    customerName: order.customerSnapshot.name,
    specialInstructions: order.specialInstructions,
    estimatedDeliveryTime: order.estimatedDeliveryTime,
    scheduledFor: order.scheduledFor,
    createdAt: order.createdAt,
    paymentDeferred: false,
    payable: order.orderStatus === "PENDING_PAYMENT" && order.paymentStatus !== "PAID",
    cancellable: order.orderStatus === "PENDING_PAYMENT",
    reviewEligible: order.orderStatus === "DELIVERED",
    trackingUrl: order.trackingUrl,
    deliveryProviderName: order.deliveryProvider,
    tracking: terminal
      ? []
      : steps.map((step, index) => ({
          status: step.status,
          label: step.label,
          done: currentIndex >= 0 && index < currentIndex,
          current: index === currentIndex,
        })),
  };
}
