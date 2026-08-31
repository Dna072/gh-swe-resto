import type { Order, OrderListFilters } from "@/domains/orders/models";
import type { OrderWriteRepository } from "@/domains/orders/repository";
import { normalizePageLimit, type Page, type PageRequest } from "@/lib/pagination";
import type { MemoryState } from "./state";

export class InMemoryOrderRepository implements OrderWriteRepository {
  constructor(private readonly state: MemoryState) {}

  async getById(orderId: string): Promise<Order | null> {
    return this.state.orders.find((order) => order.id === orderId) ?? null;
  }

  async getByPublicNumber(restaurantId: string, publicOrderNumber: string): Promise<Order | null> {
    return (
      this.state.orders.find(
        (order) => order.restaurantId === restaurantId && order.publicOrderNumber === publicOrderNumber,
      ) ?? null
    );
  }

  async getByProviderDeliveryId(providerDeliveryId: string): Promise<Order | null> {
    if (!providerDeliveryId) {
      return null;
    }
    return this.state.orders.find((order) => order.providerDeliveryId === providerDeliveryId) ?? null;
  }

  async getByProviderPaymentId(providerPaymentId: string): Promise<Order | null> {
    if (!providerPaymentId) {
      return null;
    }
    return this.state.orders.find((order) => order.paymentProviderId === providerPaymentId) ?? null;
  }

  async list(filters: OrderListFilters, page: PageRequest): Promise<Page<Order>> {
    const limit = normalizePageLimit(page.limit);
    let items = this.state.orders.filter((order) => order.restaurantId === filters.restaurantId);
    if (filters.status) {
      items = items.filter((order) => order.orderStatus === filters.status);
    }
    if (filters.customerId) {
      items = items.filter((order) => order.customerId === filters.customerId);
    }
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { items: items.slice(0, limit), limit };
  }

  async listByCustomer(customerId: string, page: PageRequest): Promise<Page<Order>> {
    return this.list({ restaurantId: "", customerId }, page).then((result) => ({
      ...result,
      items: this.state.orders
        .filter((order) => order.customerId === customerId)
        .slice(0, result.limit),
    }));
  }

  async create(order: Order): Promise<Order> {
    this.state.orders.push(order);
    return order;
  }

  async update(order: Order): Promise<Order> {
    const index = this.state.orders.findIndex((item) => item.id === order.id);
    if (index >= 0) {
      this.state.orders[index] = order;
    }
    return order;
  }
}
