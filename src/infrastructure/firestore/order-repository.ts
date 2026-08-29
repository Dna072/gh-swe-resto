import type { Firestore } from "firebase-admin/firestore";
import type { Order, OrderListFilters } from "@/domains/orders/models";
import type { OrderWriteRepository } from "@/domains/orders/repository";
import { normalizePageLimit, type Page, type PageRequest } from "@/lib/pagination";
import { collections } from "./paths";
import { typedConverter } from "./converters";

export class FirestoreOrderRepository implements OrderWriteRepository {
  constructor(private readonly db: Firestore) {}

  private col() {
    return this.db.collection(collections.orders).withConverter(typedConverter<Order>());
  }

  async getById(orderId: string): Promise<Order | null> {
    const snap = await this.col().doc(orderId).get();
    return snap.exists ? (snap.data() ?? null) : null;
  }

  async getByPublicNumber(restaurantId: string, publicOrderNumber: string): Promise<Order | null> {
    const snap = await this.col()
      .where("restaurantId", "==", restaurantId)
      .where("publicOrderNumber", "==", publicOrderNumber)
      .limit(1)
      .get();
    return snap.docs[0]?.data() ?? null;
  }

  async list(filters: OrderListFilters, page: PageRequest): Promise<Page<Order>> {
    const limit = normalizePageLimit(page.limit);
    let query = this.col()
      .where("restaurantId", "==", filters.restaurantId)
      .orderBy("createdAt", "desc")
      .limit(limit + 1);
    if (filters.status) {
      query = this.col()
        .where("restaurantId", "==", filters.restaurantId)
        .where("orderStatus", "==", filters.status)
        .orderBy("createdAt", "desc")
        .limit(limit + 1);
    }
    const snap = await query.get();
    const items = snap.docs.slice(0, limit).map((doc) => doc.data());
    return {
      items,
      limit,
      nextCursor: snap.docs.length > limit ? snap.docs[limit - 1]?.id : undefined,
    };
  }

  async listByCustomer(customerId: string, page: PageRequest): Promise<Page<Order>> {
    const limit = normalizePageLimit(page.limit);
    const snap = await this.col()
      .where("customerId", "==", customerId)
      .orderBy("createdAt", "desc")
      .limit(limit + 1)
      .get();
    const items = snap.docs.slice(0, limit).map((doc) => doc.data());
    return {
      items,
      limit,
      nextCursor: snap.docs.length > limit ? snap.docs[limit - 1]?.id : undefined,
    };
  }

  async create(order: Order): Promise<Order> {
    await this.col().doc(order.id).set(order);
    return order;
  }

  async update(order: Order): Promise<Order> {
    await this.col().doc(order.id).set(order, { merge: true });
    return order;
  }
}
