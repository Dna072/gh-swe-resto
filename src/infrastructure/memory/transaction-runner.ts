import type { InventoryItem } from "@/domains/inventory/models";
import type { Order } from "@/domains/orders/models";
import type { Promotion, PromotionUsage } from "@/domains/promotions/models";
import type { OrderCreationTransaction, TransactionRunner } from "@/domains/shared/transaction";
import type { MemoryState } from "./state";

class MemoryOrderCreationTransaction implements OrderCreationTransaction {
  constructor(private readonly state: MemoryState) {}

  async getInventory(restaurantId: string, sku: string): Promise<InventoryItem | null> {
    return this.state.inventory.find((item) => item.restaurantId === restaurantId && item.sku === sku) ?? null;
  }

  saveInventory(item: InventoryItem): void {
    const index = this.state.inventory.findIndex(
      (candidate) => candidate.restaurantId === item.restaurantId && candidate.sku === item.sku,
    );
    if (index >= 0) {
      this.state.inventory[index] = item;
    } else {
      this.state.inventory.push(item);
    }
  }

  async getPromotion(restaurantId: string, promotionIdOrCode: string): Promise<Promotion | null> {
    return (
      this.state.promotions.find(
        (item) =>
          item.restaurantId === restaurantId && (item.id === promotionIdOrCode || item.code === promotionIdOrCode),
      ) ?? null
    );
  }

  async getPromotionUsage(promotionId: string, customerKey: string): Promise<PromotionUsage | null> {
    return (
      this.state.promotionUsages.find((item) => item.promotionId === promotionId && item.customerKey === customerKey) ??
      null
    );
  }

  savePromotionUsage(usage: PromotionUsage): void {
    const index = this.state.promotionUsages.findIndex((item) => item.id === usage.id);
    if (index >= 0) {
      this.state.promotionUsages[index] = usage;
    } else {
      this.state.promotionUsages.push(usage);
    }
    const promotion = this.state.promotions.find((item) => item.id === usage.promotionId);
    if (promotion) {
      promotion.redemptionCount += 1;
    }
  }

  async getIdempotentOrderId(key: string): Promise<string | null> {
    return this.state.idempotency.get(key) ?? null;
  }

  saveIdempotency(key: string, orderId: string): void {
    this.state.idempotency.set(key, orderId);
  }

  async nextOrderSequence(restaurantId: string): Promise<number> {
    const next = (this.state.sequences.get(restaurantId) ?? 1000) + 1;
    this.state.sequences.set(restaurantId, next);
    return next;
  }

  createOrder(order: Order): void {
    this.state.orders.push(order);
  }
}

export class InMemoryTransactionRunner implements TransactionRunner {
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private readonly state: MemoryState) {}

  run<T>(fn: (tx: OrderCreationTransaction) => Promise<T>): Promise<T> {
    const execute = async () => fn(new MemoryOrderCreationTransaction(this.state));
    const result = this.queue.then(execute, execute);
    this.queue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }
}
