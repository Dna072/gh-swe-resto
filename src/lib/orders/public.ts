import type { Order } from "@/domains/orders/models";

export type PublicOrder = {
  id: string;
  publicOrderNumber: string;
  fulfillment: "DELIVERY" | "PICKUP";
  orderStatus: Order["orderStatus"];
  paymentStatus: Order["paymentStatus"];
  deliveryStatus: Order["deliveryStatus"];
  items: Order["items"];
  subtotalOre: number;
  deliveryFeeOre: number;
  discountTotalOre: number;
  taxTotalOre: number;
  totalOre: number;
  totalLabel: string;
  currency: "SEK";
  deliveryAddress: Order["deliveryAddressSnapshot"];
  customerName: string;
  specialInstructions?: string;
  estimatedDeliveryTime?: string;
  createdAt: string;
  paymentDeferred: boolean;
  payable: boolean;
  cancellable: boolean;
  tracking: Array<{ status: string; label: string; done: boolean; current: boolean }>;
};
