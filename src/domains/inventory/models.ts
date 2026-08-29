import type { Timestamped } from "@/domains/shared/types";

export interface InventoryItem extends Timestamped {
  sku: string;
  restaurantId: string;
  name: string;
  availableQuantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  tracked: boolean;
}

export interface InventoryReservation {
  sku: string;
  quantity: number;
}

export interface InventoryAdjustment {
  sku: string;
  restaurantId: string;
  delta: number;
  reason: string;
}
