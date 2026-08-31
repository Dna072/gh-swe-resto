import type { AddressSnapshot, CustomerSnapshot, RestaurantId, Timestamped } from "@/domains/shared/types";
import type { Ore } from "@/lib/money";
import type { DeliveryPricingSnapshot } from "@/domains/delivery/models";

export const ORDER_STATUSES = [
  "PENDING_PAYMENT",
  "PAID",
  "CONFIRMED",
  "PREPARING",
  "PACKING",
  "READY",
  "COURIER_ASSIGNED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "PAYMENT_FAILED",
  "CANCELLED",
  "REFUNDED",
  "DELIVERY_FAILED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "UNPAID",
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const DELIVERY_STATUSES = [
  "NOT_REQUESTED",
  "QUOTED",
  "SCHEDULED",
  "ASSIGNED",
  "PICKED_UP",
  "IN_TRANSIT",
  "DELIVERED",
  "FAILED",
  "ATTENTION_REQUIRED",
] as const;

export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export interface OrderModifierSnapshot {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  quantity: number;
  unitPriceOre: Ore;
}

export interface OrderItemSnapshot {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPriceOre: Ore;
  modifierTotalOre: Ore;
  lineTotalOre: Ore;
  notes?: string;
  modifiers: OrderModifierSnapshot[];
}

export interface InternalCostSnapshot {
  foodCostOre?: Ore;
  packagingCostOre?: Ore;
  deliveryCostOre?: Ore;
  paymentFeeOre?: Ore;
  discountCostOre?: Ore;
}

export interface Order extends Timestamped {
  id: string;
  restaurantId: RestaurantId;
  publicOrderNumber: string;
  accessTokenHash: string;
  customerId?: string;
  guestSessionId?: string;
  items: OrderItemSnapshot[];
  subtotalOre: Ore;
  deliveryFeeOre: Ore;
  discountTotalOre: Ore;
  taxTotalOre: Ore;
  totalOre: Ore;
  currency: "SEK";
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  deliveryStatus: DeliveryStatus;
  fulfillment?: "DELIVERY" | "PICKUP";
  deliveryProvider?: string;
  deliveryId?: string;
  trackingUrl?: string;
  deliveryPricing?: DeliveryPricingSnapshot;
  providerDeliveryId?: string;
  deliveryAddressSnapshot: AddressSnapshot;
  customerSnapshot: CustomerSnapshot;
  estimatedPreparationTime?: string;
  estimatedDeliveryTime?: string;
  scheduledFor?: string;
  specialInstructions?: string;
  promotionCode?: string;
  paymentProviderId?: string;
  idempotencyKey: string;
  schemaVersion: number;
  internalCosts?: InternalCostSnapshot;
  confirmedAt?: string;
  preparingAt?: string;
  packingAt?: string;
  readyAt?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  refundedAt?: string;
  assignedKitchenStaffId?: string;
  assignedKitchenStaffName?: string;
  assignedAt?: string;
}

export interface OrderListFilters {
  restaurantId: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  deliveryStatus?: DeliveryStatus;
  customerId?: string;
  from?: string;
  to?: string;
}
