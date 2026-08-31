import type { Page, PageRequest } from "@/lib/pagination";
import type { Order, OrderListFilters } from "./models";

export interface OrderRepository {
  getById(orderId: string): Promise<Order | null>;
  getByPublicNumber(restaurantId: string, publicOrderNumber: string): Promise<Order | null>;
  getByProviderDeliveryId(providerDeliveryId: string): Promise<Order | null>;
  getByProviderPaymentId(providerPaymentId: string): Promise<Order | null>;
  list(filters: OrderListFilters, page: PageRequest): Promise<Page<Order>>;
  listByCustomer(customerId: string, page: PageRequest): Promise<Page<Order>>;
}

export interface OrderWriteRepository extends OrderRepository {
  create(order: Order): Promise<Order>;
  update(order: Order): Promise<Order>;
}
