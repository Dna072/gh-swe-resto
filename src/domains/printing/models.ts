import type { Order } from "@/domains/orders/models";

export interface PrintJob {
  id: string;
  orderId: string;
  restaurantId: string;
  status: "QUEUED" | "PRINTED" | "FAILED";
  idempotencyKey: string;
  payload: KitchenTicket;
  createdAt: string;
  printedAt?: string;
}

export interface KitchenTicket {
  restaurantName: string;
  orderNumber: string;
  createdAt: string;
  customerName: string;
  phone: string;
  address: string;
  instructions?: string;
  items: Array<{
    name: string;
    quantity: number;
    notes?: string;
    modifiers: Array<{ name: string; quantity: number }>;
  }>;
  subtotalOre: number;
  deliveryFeeOre: number;
  discountTotalOre: number;
  totalOre: number;
  paymentStatus: string;
  deliveryProvider?: string;
  preparationTarget?: string;
  scheduledFor?: string;
}

export function ticketFromOrder(order: Order, restaurantName: string): KitchenTicket {
  return {
    restaurantName,
    orderNumber: order.publicOrderNumber,
    createdAt: order.createdAt,
    customerName: order.customerSnapshot.name,
    phone: order.customerSnapshot.phone,
    address: [
      order.deliveryAddressSnapshot.line1,
      order.deliveryAddressSnapshot.line2,
      order.deliveryAddressSnapshot.postalCode,
      order.deliveryAddressSnapshot.city,
    ]
      .filter(Boolean)
      .join(", "),
    instructions: order.specialInstructions,
    items: order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      notes: item.notes,
      modifiers: item.modifiers.map((modifier) => ({
        name: modifier.optionName,
        quantity: modifier.quantity,
      })),
    })),
    subtotalOre: order.subtotalOre,
    deliveryFeeOre: order.deliveryFeeOre,
    discountTotalOre: order.discountTotalOre,
    totalOre: order.totalOre,
    paymentStatus: order.paymentStatus,
    deliveryProvider: order.deliveryProvider,
    preparationTarget: order.scheduledFor ?? order.estimatedPreparationTime,
    scheduledFor: order.scheduledFor,
  };
}
