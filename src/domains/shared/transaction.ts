import type { InventoryItem } from "@/domains/inventory/models";
import type { Order } from "@/domains/orders/models";
import type { Promotion, PromotionUsage } from "@/domains/promotions/models";

export interface OrderCreationTransaction {
  getInventory(restaurantId: string, sku: string): Promise<InventoryItem | null>;
  saveInventory(item: InventoryItem): void;
  getPromotion(restaurantId: string, promotionId: string): Promise<Promotion | null>;
  getPromotionUsage(promotionId: string, customerKey: string): Promise<PromotionUsage | null>;
  savePromotionUsage(usage: PromotionUsage): void;
  getIdempotentOrderId(key: string): Promise<string | null>;
  saveIdempotency(key: string, orderId: string): void;
  nextOrderSequence(restaurantId: string): Promise<number>;
  createOrder(order: Order): void;
}

export interface TransactionRunner {
  run<T>(fn: (tx: OrderCreationTransaction) => Promise<T>): Promise<T>;
}
