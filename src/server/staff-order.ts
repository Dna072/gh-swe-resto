import "server-only";

import type { Order } from "@/domains/orders/models";
import { formatSek } from "@/lib/money";
import { fulfillmentOf, kitchenActions, type StaffOrder } from "@/lib/orders/staff";

export type { KitchenAction, StaffOrder } from "@/lib/orders/staff";
export { fulfillmentOf, kitchenActions };

export function toStaffOrder(order: Order): StaffOrder {
  const address = order.deliveryAddressSnapshot;
  return {
    id: order.id,
    publicOrderNumber: order.publicOrderNumber,
    fulfillment: fulfillmentOf(order),
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    deliveryStatus: order.deliveryStatus,
    items: order.items,
    totalOre: order.totalOre,
    totalLabel: formatSek(order.totalOre),
    customerName: order.customerSnapshot.name,
    customerPhone: order.customerSnapshot.phone,
    customerEmail: order.customerSnapshot.email,
    addressLabel: [address.line1, address.postalCode, address.city].filter(Boolean).join(", "),
    specialInstructions: order.specialInstructions,
    estimatedDeliveryTime: order.estimatedDeliveryTime,
    createdAt: order.createdAt,
    actions: kitchenActions(order),
  };
}
