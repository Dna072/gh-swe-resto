import "server-only";

import type { Order } from "@/domains/orders/models";
import { formatSek } from "@/lib/money";
import type { PublicOrder } from "@/lib/orders/public";

export function toPublicOrder(order: Order): PublicOrder {
  return {
    id: order.id,
    publicOrderNumber: order.publicOrderNumber,
    fulfillment: order.deliveryStatus === "NOT_REQUESTED" ? "PICKUP" : "DELIVERY",
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
  };
}
