import type { Customer, CustomerAddress } from "@/domains/customers/models";
import type { CustomerRepository } from "@/domains/customers/repository";
import type { InventoryItem } from "@/domains/inventory/models";
import type { InventoryRepository } from "@/domains/inventory/repository";
import type { Membership, Plan } from "@/domains/memberships/models";
import type { MembershipRepository } from "@/domains/memberships/repository";
import type { PrintJob } from "@/domains/printing/models";
import type { PrintJobRepository } from "@/domains/printing/provider";
import type { Promotion, PromotionUsage } from "@/domains/promotions/models";
import type { PromotionRepository } from "@/domains/promotions/repository";
import type { NotificationDedupStore } from "@/domains/notifications/provider";
import type { ProcessedWebhookStore } from "@/domains/payments/service";
import type { MemoryState } from "./state";

export class InMemoryInventoryRepository implements InventoryRepository {
  constructor(private readonly state: MemoryState) {}

  async get(restaurantId: string, sku: string): Promise<InventoryItem | null> {
    return this.state.inventory.find((item) => item.restaurantId === restaurantId && item.sku === sku) ?? null;
  }

  async list(restaurantId: string, skus?: string[]): Promise<InventoryItem[]> {
    return this.state.inventory.filter(
      (item) => item.restaurantId === restaurantId && (!skus || skus.includes(item.sku)),
    );
  }
}

export class InMemoryPromotionRepository implements PromotionRepository {
  constructor(private readonly state: MemoryState) {}

  async getByCode(restaurantId: string, code: string): Promise<Promotion | null> {
    return (
      this.state.promotions.find((item) => item.restaurantId === restaurantId && item.code === code.toUpperCase()) ??
      null
    );
  }

  async getById(restaurantId: string, promotionId: string): Promise<Promotion | null> {
    return this.state.promotions.find((item) => item.restaurantId === restaurantId && item.id === promotionId) ?? null;
  }

  async getUsage(promotionId: string, customerKey: string): Promise<PromotionUsage | null> {
    return (
      this.state.promotionUsages.find((item) => item.promotionId === promotionId && item.customerKey === customerKey) ??
      null
    );
  }
}

export class InMemoryCustomerRepository implements CustomerRepository {
  constructor(private readonly state: MemoryState) {}

  async getById(customerId: string): Promise<Customer | null> {
    return this.state.customers.find((item) => item.id === customerId) ?? null;
  }

  async getByAuthUid(authUid: string): Promise<Customer | null> {
    return this.state.customers.find((item) => item.authUid === authUid) ?? null;
  }

  async listAddresses(customerId: string): Promise<CustomerAddress[]> {
    return this.state.addresses.filter((item) => item.customerId === customerId);
  }
}

export class InMemoryMembershipRepository implements MembershipRepository {
  constructor(private readonly state: MemoryState) {}

  async getByCustomer(restaurantId: string, customerId: string): Promise<Membership | null> {
    return (
      this.state.memberships.find((item) => item.restaurantId === restaurantId && item.customerId === customerId) ??
      null
    );
  }

  async getPlan(restaurantId: string, planId: string): Promise<Plan | null> {
    return this.state.plans.find((item) => item.restaurantId === restaurantId && item.id === planId) ?? null;
  }
}

export class InMemoryPrintJobRepository implements PrintJobRepository {
  constructor(private readonly state: MemoryState) {}

  async getByIdempotencyKey(key: string): Promise<PrintJob | null> {
    return this.state.printJobs.find((item) => item.idempotencyKey === key) ?? null;
  }

  async create(job: PrintJob): Promise<PrintJob> {
    this.state.printJobs.push(job);
    return job;
  }
}

export class InMemoryWebhookStore implements ProcessedWebhookStore {
  constructor(private readonly state: MemoryState) {}

  async has(eventId: string): Promise<boolean> {
    return this.state.webhookEvents.has(eventId);
  }

  async mark(eventId: string): Promise<void> {
    this.state.webhookEvents.add(eventId);
  }
}

export class InMemoryNotificationDedup implements NotificationDedupStore {
  constructor(private readonly state: MemoryState) {}

  async seen(idempotencyKey: string): Promise<boolean> {
    return this.state.notificationKeys.has(idempotencyKey);
  }

  async mark(idempotencyKey: string): Promise<void> {
    this.state.notificationKeys.add(idempotencyKey);
  }
}
