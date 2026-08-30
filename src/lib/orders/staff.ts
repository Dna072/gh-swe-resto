import type { Order, OrderStatus } from "@/domains/orders/models";
import { ORDER_TRANSITIONS } from "@/domains/orders/state-machine";

export type KitchenAction = {
  to: OrderStatus | "SEND_TO_KITCHEN";
  label: string;
};

export type StaffOrder = {
  id: string;
  publicOrderNumber: string;
  fulfillment: "DELIVERY" | "PICKUP";
  orderStatus: Order["orderStatus"];
  paymentStatus: Order["paymentStatus"];
  deliveryStatus: Order["deliveryStatus"];
  items: Order["items"];
  totalOre: number;
  totalLabel: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  addressLabel: string;
  specialInstructions?: string;
  estimatedDeliveryTime?: string;
  createdAt: string;
  actions: KitchenAction[];
};

export function fulfillmentOf(order: Pick<Order, "deliveryStatus" | "fulfillment">): "DELIVERY" | "PICKUP" {
  if (order.fulfillment) {
    return order.fulfillment;
  }
  return order.deliveryStatus === "NOT_REQUESTED" ? "PICKUP" : "DELIVERY";
}

export function kitchenActions(order: Order): KitchenAction[] {
  const fulfillment = fulfillmentOf(order);
  if (order.orderStatus === "PENDING_PAYMENT") {
    return [{ to: "CANCELLED", label: "Cancel" }];
  }
  if (order.orderStatus === "PAID") {
    return [
      { to: "SEND_TO_KITCHEN", label: "Send to kitchen" },
      { to: "CANCELLED", label: "Cancel" },
    ];
  }
  const labels: Partial<Record<OrderStatus, string>> = {
    PREPARING: "Start preparing",
    PACKING: "Pack",
    READY: "Mark ready",
    COURIER_ASSIGNED: "Courier assigned",
    OUT_FOR_DELIVERY: "Out for delivery",
    DELIVERED: fulfillment === "PICKUP" ? "Handed over" : "Delivered",
    DELIVERY_FAILED: "Delivery failed",
    CANCELLED: "Cancel",
  };
  return ORDER_TRANSITIONS[order.orderStatus]
    .filter((status) => {
      if (status === "COURIER_ASSIGNED" && fulfillment === "PICKUP") {
        return false;
      }
      if (status === "DELIVERED" && fulfillment === "DELIVERY" && order.orderStatus === "READY") {
        return false;
      }
      return Boolean(labels[status]);
    })
    .map((status) => ({ to: status, label: labels[status] ?? status }));
}
