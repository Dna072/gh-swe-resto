import type { Firestore } from "firebase-admin/firestore";
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
import type { ProcessedWebhookStore } from "@/domains/payments/service";
import { collections, restaurantPath, restaurantSub } from "./paths";
import { typedConverter } from "./converters";

export class FirestoreInventoryRepository implements InventoryRepository {
  constructor(private readonly db: Firestore) {}

  async get(restaurantId: string, sku: string): Promise<InventoryItem | null> {
    const snap = await this.db
      .doc(restaurantPath(restaurantId))
      .collection(restaurantSub.inventory)
      .withConverter(typedConverter<InventoryItem>())
      .doc(sku)
      .get();
    return snap.exists ? (snap.data() ?? null) : null;
  }

  async list(restaurantId: string, skus?: string[]): Promise<InventoryItem[]> {
    const snap = await this.db
      .doc(restaurantPath(restaurantId))
      .collection(restaurantSub.inventory)
      .withConverter(typedConverter<InventoryItem>())
      .limit(100)
      .get();
    const items = snap.docs.map((doc) => doc.data());
    return skus ? items.filter((item) => skus.includes(item.sku)) : items;
  }
}

export class FirestorePromotionRepository implements PromotionRepository {
  constructor(private readonly db: Firestore) {}

  async getByCode(restaurantId: string, code: string): Promise<Promotion | null> {
    const snap = await this.db
      .doc(restaurantPath(restaurantId))
      .collection(restaurantSub.promotions)
      .withConverter(typedConverter<Promotion>())
      .where("code", "==", code.toUpperCase())
      .limit(1)
      .get();
    return snap.docs[0]?.data() ?? null;
  }

  async getById(restaurantId: string, promotionId: string): Promise<Promotion | null> {
    const snap = await this.db
      .doc(restaurantPath(restaurantId))
      .collection(restaurantSub.promotions)
      .withConverter(typedConverter<Promotion>())
      .doc(promotionId)
      .get();
    return snap.exists ? (snap.data() ?? null) : null;
  }

  async getUsage(promotionId: string, customerKey: string): Promise<PromotionUsage | null> {
    const snap = await this.db
      .collection(collections.restaurants)
      .doc("_usages")
      .collection("promotionUsages")
      .doc(`${promotionId}__${customerKey}`)
      .get();
    return snap.exists ? (snap.data() as PromotionUsage) : null;
  }

  async list(restaurantId: string): Promise<Promotion[]> {
    const snap = await this.db
      .doc(restaurantPath(restaurantId))
      .collection(restaurantSub.promotions)
      .withConverter(typedConverter<Promotion>())
      .limit(100)
      .get();
    return snap.docs.map((doc) => doc.data());
  }

  async save(promotion: Promotion): Promise<Promotion> {
    const next: Promotion = {
      ...promotion,
      code: promotion.code.trim().toUpperCase(),
      updatedAt: new Date().toISOString(),
    };
    await this.db
      .doc(restaurantPath(next.restaurantId))
      .collection(restaurantSub.promotions)
      .withConverter(typedConverter<Promotion>())
      .doc(next.id)
      .set(next, { merge: true });
    return next;
  }
}

export class FirestoreCustomerRepository implements CustomerRepository {
  constructor(private readonly db: Firestore) {}

  async getById(customerId: string): Promise<Customer | null> {
    const snap = await this.db.collection(collections.customers).doc(customerId).get();
    return snap.exists ? (snap.data() as Customer) : null;
  }

  async getByAuthUid(authUid: string): Promise<Customer | null> {
    const snap = await this.db.collection(collections.customers).where("authUid", "==", authUid).limit(1).get();
    return snap.docs[0]?.data() as Customer | undefined ?? null;
  }

  async listAddresses(customerId: string): Promise<CustomerAddress[]> {
    const snap = await this.db.collection(collections.customers).doc(customerId).collection("addresses").limit(20).get();
    return snap.docs.map((doc) => doc.data() as CustomerAddress);
  }
}

export class FirestoreMembershipRepository implements MembershipRepository {
  constructor(private readonly db: Firestore) {}

  async getByCustomer(restaurantId: string, customerId: string): Promise<Membership | null> {
    const snap = await this.db
      .collection(collections.memberships)
      .where("restaurantId", "==", restaurantId)
      .where("customerId", "==", customerId)
      .limit(1)
      .get();
    return snap.docs[0]?.data() as Membership | undefined ?? null;
  }

  async getPlan(restaurantId: string, planId: string): Promise<Plan | null> {
    const snap = await this.db.doc(restaurantPath(restaurantId)).collection(restaurantSub.plans).doc(planId).get();
    return snap.exists ? (snap.data() as Plan) : null;
  }
}

export class FirestorePrintJobRepository implements PrintJobRepository {
  constructor(private readonly db: Firestore) {}

  async getByIdempotencyKey(key: string): Promise<PrintJob | null> {
    const snap = await this.db.collection(collections.printJobs).where("idempotencyKey", "==", key).limit(1).get();
    return snap.docs[0]?.data() as PrintJob | undefined ?? null;
  }

  async create(job: PrintJob): Promise<PrintJob> {
    await this.db.collection(collections.printJobs).doc(job.id).create(job);
    return job;
  }
}

export class FirestoreWebhookStore implements ProcessedWebhookStore {
  constructor(private readonly db: Firestore) {}

  async has(eventId: string): Promise<boolean> {
    const snap = await this.db.collection(collections.webhookEvents).doc(eventId).get();
    return snap.exists;
  }

  async mark(eventId: string): Promise<void> {
    await this.db.collection(collections.webhookEvents).doc(eventId).create({
      eventId,
      createdAt: new Date().toISOString(),
    });
  }
}
