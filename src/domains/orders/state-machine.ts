import { AppError } from "@/lib/errors";
import type { Order, OrderStatus } from "./models";

export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING_PAYMENT: ["PAID", "PAYMENT_FAILED", "CANCELLED"],
  PAID: ["CONFIRMED", "CANCELLED", "REFUNDED"],
  CONFIRMED: ["PREPARING", "CANCELLED", "REFUNDED"],
  PREPARING: ["PACKING", "CANCELLED"],
  PACKING: ["READY", "CANCELLED"],
  READY: ["COURIER_ASSIGNED", "DELIVERED", "CANCELLED"],
  COURIER_ASSIGNED: ["OUT_FOR_DELIVERY", "DELIVERY_FAILED", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "DELIVERY_FAILED"],
  DELIVERED: ["REFUNDED"],
  PAYMENT_FAILED: ["PENDING_PAYMENT", "CANCELLED"],
  CANCELLED: ["REFUNDED"],
  REFUNDED: [],
  DELIVERY_FAILED: ["COURIER_ASSIGNED", "READY", "CANCELLED", "REFUNDED"],
};

const STATUS_TIMESTAMPS: Partial<Record<OrderStatus, keyof Order>> = {
  CONFIRMED: "confirmedAt",
  PREPARING: "preparingAt",
  PACKING: "packingAt",
  READY: "readyAt",
  COURIER_ASSIGNED: "dispatchedAt",
  DELIVERED: "deliveredAt",
  CANCELLED: "cancelledAt",
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransition(from, to)) {
    throw new AppError("INVALID_TRANSITION", "This order cannot move to that status.", {
      from,
      to,
    });
  }
}

export function applyOrderTransition(order: Order, to: OrderStatus, at = new Date()): Order {
  assertTransition(order.orderStatus, to);
  const timestampKey = STATUS_TIMESTAMPS[to];
  const next: Order = {
    ...order,
    orderStatus: to,
    updatedAt: at.toISOString(),
  };
  if (timestampKey) {
    (next as unknown as Record<string, unknown>)[timestampKey] = at.toISOString();
  }
  if (to === "PAID") {
    next.paymentStatus = "PAID";
  }
  if (to === "PAYMENT_FAILED") {
    next.paymentStatus = "FAILED";
  }
  if (to === "REFUNDED") {
    next.paymentStatus = "REFUNDED";
  }
  if (to === "COURIER_ASSIGNED") {
    next.deliveryStatus = "ASSIGNED";
  }
  if (to === "OUT_FOR_DELIVERY") {
    next.deliveryStatus = "IN_TRANSIT";
  }
  if (to === "DELIVERED" && order.deliveryStatus !== "NOT_REQUESTED") {
    next.deliveryStatus = "DELIVERED";
  }
  if (to === "DELIVERY_FAILED") {
    next.deliveryStatus = "ATTENTION_REQUIRED";
  }
  return next;
}

export const DELIVERY_TRACKING_STEPS: Array<{ status: OrderStatus; label: string }> = [
  { status: "CONFIRMED", label: "Order confirmed" },
  { status: "PREPARING", label: "Kitchen preparing" },
  { status: "READY", label: "Food packed" },
  { status: "COURIER_ASSIGNED", label: "Courier assigned" },
  { status: "OUT_FOR_DELIVERY", label: "On the way" },
  { status: "DELIVERED", label: "Delivered" },
];

export const PICKUP_TRACKING_STEPS: Array<{ status: OrderStatus; label: string }> = [
  { status: "CONFIRMED", label: "Order confirmed" },
  { status: "PREPARING", label: "Kitchen preparing" },
  { status: "READY", label: "Ready for pickup" },
  { status: "DELIVERED", label: "Collected" },
];

export function trackingStepsFor(fulfillment: "DELIVERY" | "PICKUP") {
  return fulfillment === "PICKUP" ? PICKUP_TRACKING_STEPS : DELIVERY_TRACKING_STEPS;
}

/** @deprecated use DELIVERY_TRACKING_STEPS or trackingStepsFor */
export const CUSTOMER_TRACKING_STEPS = DELIVERY_TRACKING_STEPS;
