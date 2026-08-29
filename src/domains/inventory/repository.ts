import type { InventoryItem } from "./models";

export interface InventoryRepository {
  get(restaurantId: string, sku: string): Promise<InventoryItem | null>;
  list(restaurantId: string, skus?: string[]): Promise<InventoryItem[]>;
}
