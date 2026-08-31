import type { StaffUser } from "@/domains/auth/models";
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
import type { Review } from "@/domains/reviews/models";
import type { ReviewRepository } from "@/domains/reviews/repository";
import type { StaffUserRepository } from "@/domains/staff/repository";
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

  async list(restaurantId: string): Promise<Promotion[]> {
    return this.state.promotions.filter((item) => item.restaurantId === restaurantId);
  }

  async save(promotion: Promotion): Promise<Promotion> {
    const next: Promotion = {
      ...promotion,
      code: promotion.code.trim().toUpperCase(),
      updatedAt: new Date().toISOString(),
    };
    const index = this.state.promotions.findIndex(
      (item) => item.restaurantId === next.restaurantId && item.id === next.id,
    );
    if (index >= 0) {
      this.state.promotions[index] = next;
    } else {
      this.state.promotions.push(next);
    }
    return next;
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

  async upsert(customer: Customer): Promise<Customer> {
    const index = this.state.customers.findIndex((item) => item.id === customer.id);
    if (index >= 0) {
      this.state.customers[index] = customer;
    } else {
      this.state.customers.push(customer);
    }
    return customer;
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

export class InMemoryReviewRepository implements ReviewRepository {
  constructor(private readonly state: MemoryState) {}

  async getById(reviewId: string): Promise<Review | null> {
    return this.state.reviews.find((item) => item.id === reviewId) ?? null;
  }

  async getByOrder(orderId: string): Promise<Review | null> {
    return this.state.reviews.find((item) => item.orderId === orderId) ?? null;
  }

  async listByCustomer(customerId: string): Promise<Review[]> {
    return this.state.reviews.filter((item) => item.customerId === customerId);
  }

  async create(review: Review): Promise<Review> {
    this.state.reviews.push(review);
    return review;
  }

  async update(review: Review): Promise<Review> {
    const index = this.state.reviews.findIndex((item) => item.id === review.id);
    if (index >= 0) {
      this.state.reviews[index] = review;
    }
    return review;
  }
}

export class InMemoryStaffUserRepository implements StaffUserRepository {
  constructor(private readonly state: MemoryState) {}

  async getByUid(uid: string): Promise<StaffUser | null> {
    return this.state.staffUsers.find((item) => item.uid === uid) ?? null;
  }

  async getByEmail(email: string): Promise<StaffUser | null> {
    const normalized = email.trim().toLowerCase();
    return this.state.staffUsers.find((item) => item.email === normalized) ?? null;
  }

  async listByRestaurant(restaurantId: string): Promise<StaffUser[]> {
    return this.state.staffUsers.filter((item) => item.restaurantId === restaurantId);
  }

  async save(user: StaffUser): Promise<StaffUser> {
    const index = this.state.staffUsers.findIndex((item) => item.uid === user.uid);
    if (index >= 0) {
      this.state.staffUsers[index] = user;
    } else {
      this.state.staffUsers.push(user);
    }
    return user;
  }
}
