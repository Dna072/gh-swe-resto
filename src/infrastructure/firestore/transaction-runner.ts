import type { Firestore, Transaction } from "firebase-admin/firestore";
import type { InventoryItem } from "@/domains/inventory/models";
import type { Order } from "@/domains/orders/models";
import type { Promotion, PromotionUsage } from "@/domains/promotions/models";
import type { OrderCreationTransaction, TransactionRunner } from "@/domains/shared/transaction";
import { collections, inventoryPath, promotionPath, restaurantPath, restaurantSub } from "./paths";

class FirestoreOrderCreationTransaction implements OrderCreationTransaction {
  constructor(
    private readonly db: Firestore,
    private readonly tx: Transaction,
  ) {}

  async getInventory(restaurantId: string, sku: string): Promise<InventoryItem | null> {
    const snap = await this.tx.get(this.db.doc(inventoryPath(restaurantId, sku)));
    return snap.exists ? (snap.data() as InventoryItem) : null;
  }

  saveInventory(item: InventoryItem): void {
    this.tx.set(this.db.doc(inventoryPath(item.restaurantId, item.sku)), item);
  }

  async getPromotion(restaurantId: string, promotionIdOrCode: string): Promise<Promotion | null> {
    const byId = await this.tx.get(this.db.doc(promotionPath(restaurantId, promotionIdOrCode)));
    if (byId.exists) {
      return byId.data() as Promotion;
    }
    const snap = await this.tx.get(
      this.db
        .doc(restaurantPath(restaurantId))
        .collection(restaurantSub.promotions)
        .where("code", "==", promotionIdOrCode)
        .limit(1),
    );
    return snap.docs[0]?.data() as Promotion | undefined ?? null;
  }

  async getPromotionUsage(promotionId: string, customerKey: string): Promise<PromotionUsage | null> {
    const snap = await this.tx.get(
      this.db.collection(collections.restaurants).doc("_usages").collection("promotionUsages").doc(`${promotionId}__${customerKey}`),
    );
    return snap.exists ? (snap.data() as PromotionUsage) : null;
  }

  savePromotionUsage(usage: PromotionUsage): void {
    this.tx.set(
      this.db.collection(collections.restaurants).doc("_usages").collection("promotionUsages").doc(usage.id),
      usage,
    );
  }

  async getIdempotentOrderId(key: string): Promise<string | null> {
    const snap = await this.tx.get(this.db.collection(collections.idempotencyKeys).doc(key));
    const data = snap.data();
    return typeof data?.orderId === "string" ? data.orderId : null;
  }

  saveIdempotency(key: string, orderId: string): void {
    this.tx.set(this.db.collection(collections.idempotencyKeys).doc(key), {
      orderId,
      createdAt: new Date().toISOString(),
    });
  }

  async nextOrderSequence(restaurantId: string): Promise<number> {
    const ref = this.db.doc(restaurantPath(restaurantId)).collection(restaurantSub.counters).doc("orders");
    const snap = await this.tx.get(ref);
    const current = typeof snap.data()?.value === "number" ? snap.data()!.value : 1000;
    const next = current + 1;
    this.tx.set(ref, { value: next }, { merge: true });
    return next;
  }

  createOrder(order: Order): void {
    this.tx.create(this.db.collection(collections.orders).doc(order.id), order);
  }
}

export class FirestoreTransactionRunner implements TransactionRunner {
  constructor(private readonly db: Firestore) {}

  run<T>(fn: (tx: OrderCreationTransaction) => Promise<T>): Promise<T> {
    return this.db.runTransaction((tx) => fn(new FirestoreOrderCreationTransaction(this.db, tx)));
  }
}
