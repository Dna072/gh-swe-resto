import "server-only";

import type { Order } from "@/domains/orders/models";
import { trackingStepsFor } from "@/domains/orders/state-machine";
import { formatSek } from "@/lib/money";
import type { PublicOrder } from "@/lib/orders/public";

function fulfillmentOf(order: Order): "DELIVERY" | "PICKUP" {
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
    createdAt: order.createdAt,
    paymentDeferred: true,
    cancellable: order.orderStatus === "PENDING_PAYMENT",
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
