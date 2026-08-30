import "server-only";

import { AnalyticsService } from "@/domains/analytics/service";
import { CartService } from "@/domains/cart/service";
import { DeliveryService } from "@/domains/delivery/service";
import { defaultHomepageContent } from "@/domains/content/defaults";
import { MediaService } from "@/domains/media/service";
import { MenuAdminService } from "@/domains/menu/admin.service";
import { MenuService } from "@/domains/menu/service";
import type { MenuWriteRepository } from "@/domains/menu/write-repository";
import { OrderService } from "@/domains/orders/service";
import type { OrderWriteRepository } from "@/domains/orders/repository";
import { PrintingService } from "@/domains/printing/service";
import type { PrintJobRepository } from "@/domains/printing/provider";
import { PricingService } from "@/domains/pricing/service";
import { PaymentService, type ProcessedWebhookStore } from "@/domains/payments/service";
import { PromotionService } from "@/domains/promotions/service";
import type { PromotionRepository } from "@/domains/promotions/repository";
import type { TransactionRunner } from "@/domains/shared/transaction";
import { LoggingAnalyticsSink } from "@/infrastructure/analytics/sinks";
import { MockDeliveryProvider } from "@/infrastructure/delivery/mock-provider";
import { getAdminFirestore } from "@/infrastructure/firebase/admin";
import { FirestoreMenuRepository } from "@/infrastructure/firestore/menu-repository";
import { FirestoreOrderRepository } from "@/infrastructure/firestore/order-repository";
import { FirestorePrintJobRepository, FirestorePromotionRepository, FirestoreWebhookStore } from "@/infrastructure/firestore/supporting-repositories";
import { FirestoreTransactionRunner } from "@/infrastructure/firestore/transaction-runner";
import { InMemoryMenuRepository } from "@/infrastructure/memory/menu-repository";
import { InMemoryOrderRepository } from "@/infrastructure/memory/order-repository";
import {
  applyPersistedCatalog,
  loadPersistedCatalog,
  persistCatalog,
  shouldPersistLocalCatalog,
} from "@/infrastructure/memory/persist";
import { createMemoryState } from "@/infrastructure/memory/state";
import { InMemoryPromotionRepository, InMemoryWebhookStore } from "@/infrastructure/memory/supporting-repositories";
import { MockPaymentProvider } from "@/infrastructure/payments/mock-provider";
import { StripePaymentProvider } from "@/infrastructure/payments/stripe-provider";
import { InMemoryPrintJobRepository } from "@/infrastructure/memory/print-job-repository";
import { InMemoryTransactionRunner } from "@/infrastructure/memory/transaction-runner";
import { BrowserPrintProvider } from "@/infrastructure/printing/providers";
import {
  SEED_SOURCE,
  seedPricingCalendar,
  seedRestaurant,
  seededCatalog,
} from "@/infrastructure/seed/ghana-menu";
import { LocalObjectStorage } from "@/infrastructure/storage/local-storage";
import { GcsBinaryStorage } from "@/infrastructure/storage/gcs-binary-storage";
import type { BinaryObjectStorage } from "@/infrastructure/storage/object-storage";
import { firestoreDataStoreEnabled } from "@/lib/data-store";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logging/logger";

const restaurantId = getEnv().DEFAULT_RESTAURANT_ID;
const catalog = seededCatalog(restaurantId);
const firestoreEnabled = firestoreDataStoreEnabled();

const state = createMemoryState({
  categories: catalog.categories,
  items: catalog.items,
  modifierGroups: catalog.modifierGroups,
  inventory: catalog.inventory,
  homepage: defaultHomepageContent(restaurantId),
});
if (!firestoreEnabled && shouldPersistLocalCatalog()) {
  const persisted = loadPersistedCatalog();
  if (persisted) {
    applyPersistedCatalog(state, persisted);
  }
}

function createObjectStorage(): BinaryObjectStorage {
  const env = getEnv();
  if (env.GCS_ASSETS_BUCKET) {
    return new GcsBinaryStorage(env.GCS_ASSETS_BUCKET);
  }
  return new LocalObjectStorage();
}

function createDataPorts(): {
  menuRepository: MenuWriteRepository;
  promotionRepository: PromotionRepository;
  orderRepository: OrderWriteRepository;
  transactions: TransactionRunner;
  webhookStore: ProcessedWebhookStore;
  printJobs: PrintJobRepository;
} {
  if (firestoreEnabled) {
    const db = getAdminFirestore();
    return {
      menuRepository: new FirestoreMenuRepository(db),
      promotionRepository: new FirestorePromotionRepository(db),
      orderRepository: new FirestoreOrderRepository(db),
      transactions: new FirestoreTransactionRunner(db),
      webhookStore: new FirestoreWebhookStore(db),
      printJobs: new FirestorePrintJobRepository(db),
    };
  }
  return createMemoryPorts();
}

function createMemoryPorts(): ReturnType<typeof createDataPorts> {
  return {
    menuRepository: new InMemoryMenuRepository(state, () => {
      if (shouldPersistLocalCatalog()) {
        persistCatalog(state);
      }
    }),
    promotionRepository: new InMemoryPromotionRepository(state),
    orderRepository: new InMemoryOrderRepository(state),
    transactions: new InMemoryTransactionRunner(state),
    webhookStore: new InMemoryWebhookStore(state),
    printJobs: new InMemoryPrintJobRepository(state),
  };
}

function lazyProxy<T extends object>(factory: () => T): T {
  let instance: T | undefined;
  return new Proxy({} as T, {
    get(_target, prop) {
      instance ??= factory();
      const value = Reflect.get(instance, prop, instance);
      return typeof value === "function" ? value.bind(instance) : value;
    },
  });
}

let portsMemo: ReturnType<typeof createDataPorts> | undefined;
let initError: string | undefined;

function getPorts(): ReturnType<typeof createDataPorts> {
  if (portsMemo) {
    return portsMemo;
  }
  try {
    portsMemo = createDataPorts();
    return portsMemo;
  } catch (error) {
    initError = error instanceof Error ? error.message : "Firestore failed to initialize.";
    logger.error("firestore_init_failed", { message: initError });
    portsMemo = createMemoryPorts();
    return portsMemo;
  }
}

export const menuRepository = lazyProxy(() => getPorts().menuRepository);
const mockDelivery = new MockDeliveryProvider(() => catalog.deliveryZones);

export const objectStorage = lazyProxy(() => createObjectStorage());
export const mediaService = new MediaService(objectStorage);
export const menuService = new MenuService(menuRepository);
export const menuAdminService = new MenuAdminService(menuRepository, mediaService);
export const pricingService = new PricingService();
export const promotionService = new PromotionService();
export const cartService = new CartService(
  menuRepository,
  pricingService,
  promotionService,
  lazyProxy(() => getPorts().promotionRepository),
  seedPricingCalendar,
);
export const deliveryService = new DeliveryService([mockDelivery], {
  preferCheapest: true,
  preferredProviders: ["mock"],
});
export const orderService = new OrderService(
  lazyProxy(() => getPorts().orderRepository),
  cartService,
  lazyProxy(() => getPorts().transactions),
  menuRepository,
);

function createPaymentProvider() {
  const env = getEnv();
  if (env.PAYMENT_PROVIDER === "stripe" && env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET) {
    return new StripePaymentProvider(env.STRIPE_SECRET_KEY, env.STRIPE_WEBHOOK_SECRET);
  }
  return new MockPaymentProvider();
}

export const paymentProvider = createPaymentProvider();
export const paymentService = new PaymentService(
  paymentProvider,
  lazyProxy(() => getPorts().webhookStore),
);
export const printingService = new PrintingService(
  lazyProxy(() => getPorts().printJobs),
  new BrowserPrintProvider(),
);
export const analyticsService = new AnalyticsService(new LoggingAnalyticsSink());

export const marketingSignups: Array<{ email: string; consentedAt: string; source?: string }> = [];

/** Replay tokens for idempotent checkout. Hashes stay on the order. */
const guestAccessTokens = new Map<string, string>();

export function rememberGuestToken(orderId: string, idempotencyKey: string, token: string): void {
  if (!token) {
    return;
  }
  guestAccessTokens.set(orderId, token);
  guestAccessTokens.set(idempotencyKey, token);
}

export function recallGuestToken(orderId: string, idempotencyKey?: string): string {
  return guestAccessTokens.get(orderId) ?? (idempotencyKey ? guestAccessTokens.get(idempotencyKey) ?? "" : "");
}

export function restaurantIdFromEnv(): string {
  return restaurantId;
}

export function deliveryZones() {
  return catalog.deliveryZones;
}

export function restaurantSettings() {
  return {
    id: restaurantId,
    name: seedRestaurant.name,
    city: seedRestaurant.city,
    pickup: seedRestaurant.pickup,
    timeZone: seedRestaurant.timeZone,
    orderingPaused: seedRestaurant.orderingPaused,
  };
}

export function seedMeta() {
  return {
    seed: !firestoreEnabled,
    seedSource: firestoreEnabled ? ("firestore" as const) : SEED_SOURCE,
    restaurantId,
  };
}

export function dataStoreName(): "firestore" | "memory" {
  if (!firestoreEnabled || initError) {
    return "memory";
  }
  return "firestore";
}

export function dataStoreInitError(): string | undefined {
  if (firestoreEnabled && !portsMemo && !initError) {
    getPorts();
  }
  return initError;
}
