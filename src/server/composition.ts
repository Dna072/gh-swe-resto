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
import { NotificationService } from "@/domains/notifications/service";
import type { NotificationDedupStore } from "@/domains/notifications/provider";
import type { TransactionRunner } from "@/domains/shared/transaction";
import { LoggingAnalyticsSink } from "@/infrastructure/analytics/sinks";
import { InMemoryAnalyticsRepository, InMemoryMarketingSignupRepository } from "@/infrastructure/analytics/memory-repository";
import { FirestoreAnalyticsRepository, FirestoreMarketingSignupRepository } from "@/infrastructure/firestore/analytics-repository";
import { ReportsService } from "@/domains/reports/service";
import type { AnalyticsRecord, MarketingSignup } from "@/domains/analytics/models";
import type { MapsPort } from "@/domains/delivery/maps-port";
import { DeliveryProviderSelector } from "@/domains/delivery/selector";
import { DeliveryPricingService } from "@/domains/delivery/pricing";
import { DeliveryDispatchService } from "@/domains/delivery/dispatch";
import { DeliveryWebhookProcessor } from "@/domains/delivery/webhook-processor";
import { defaultDeliverySettings, type DeliverySettings, type DeliveryZone } from "@/domains/delivery/models";
import { defaultRestaurantSettings, type RestaurantSettings } from "@/domains/restaurant/settings";
import { MockDeliveryProvider } from "@/infrastructure/delivery/mock-provider";
import { SandboxDeliveryProvider, SANDBOX_PROFILES } from "@/infrastructure/delivery/sandbox-provider";
import { WoltDriveProvider } from "@/infrastructure/delivery/wolt-drive-provider";
import { FoodoraProvider } from "@/infrastructure/delivery/foodora-provider";
import { createGeocodingPort } from "@/infrastructure/geocoding/create";
import { getAdminFirestore } from "@/infrastructure/firebase/admin";
import { FirestoreMenuRepository } from "@/infrastructure/firestore/menu-repository";
import { FirestoreOrderRepository } from "@/infrastructure/firestore/order-repository";
import { readDeliverySettings, writeDeliverySettings } from "@/infrastructure/firestore/delivery-settings";
import { readDeliveryZones, writeDeliveryZones } from "@/infrastructure/firestore/delivery-zones";
import { readRestaurantSettings, writeRestaurantSettings } from "@/infrastructure/firestore/restaurant-settings";
import { FirestorePrintJobRepository, FirestorePromotionRepository, FirestoreWebhookStore, FirestoreCustomerRepository, FirestoreReviewRepository, FirestoreStaffUserRepository } from "@/infrastructure/firestore/supporting-repositories";
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
import { InMemoryPromotionRepository, InMemoryWebhookStore, InMemoryNotificationDedup, InMemoryCustomerRepository, InMemoryReviewRepository, InMemoryStaffUserRepository } from "@/infrastructure/memory/supporting-repositories";
import { MockPaymentProvider } from "@/infrastructure/payments/mock-provider";
import { StripePaymentProvider } from "@/infrastructure/payments/stripe-provider";
import { createEmailNotificationProvider } from "@/infrastructure/notifications/create-email-provider";
import { MemoryAuthAdmin } from "@/infrastructure/auth/memory-auth";
import { FirebaseAuthAdmin } from "@/infrastructure/firebase/auth-admin";
import type { AuthAdminPort } from "@/domains/auth/ports";
import { CustomerService } from "@/domains/customers/service";
import type { CustomerRepository } from "@/domains/customers/repository";
import { ReviewService } from "@/domains/reviews/service";
import type { ReviewRepository } from "@/domains/reviews/repository";
import { StaffService } from "@/domains/staff/service";
import type { StaffUserRepository } from "@/domains/staff/repository";
import { InMemoryPrintJobRepository } from "@/infrastructure/memory/print-job-repository";
import { InMemoryTransactionRunner } from "@/infrastructure/memory/transaction-runner";
import { BrowserPrintProvider } from "@/infrastructure/printing/providers";
import {
  SEED_SOURCE,
  seedPricingCalendar,
  seedPromotions,
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
  promotions: seedPromotions.map((promotion) => ({ ...promotion, restaurantId })),
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
  notificationDedup: NotificationDedupStore;
  customerRepository: CustomerRepository;
  reviewRepository: ReviewRepository;
  staffUserRepository: StaffUserRepository;
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
      notificationDedup: new InMemoryNotificationDedup(state),
      customerRepository: new FirestoreCustomerRepository(db),
      reviewRepository: new FirestoreReviewRepository(db),
      staffUserRepository: new FirestoreStaffUserRepository(db),
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
    notificationDedup: new InMemoryNotificationDedup(state),
    customerRepository: new InMemoryCustomerRepository(state),
    reviewRepository: new InMemoryReviewRepository(state),
    staffUserRepository: new InMemoryStaffUserRepository(state),
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
const env = getEnv();
const woltLive = Boolean(env.WOLT_DRIVE_API_KEY && (env.WOLT_DRIVE_VENUE_ID || env.WOLT_DRIVE_MERCHANT_ID) && env.WOLT_DRIVE_API_BASE_URL);
const woltProvider = woltLive
  ? new WoltDriveProvider({
      apiBaseUrl: env.WOLT_DRIVE_API_BASE_URL!,
      venueId: env.WOLT_DRIVE_VENUE_ID || env.WOLT_DRIVE_MERCHANT_ID!,
      apiKey: env.WOLT_DRIVE_API_KEY!,
      webhookSecret: env.WOLT_WEBHOOK_SECRET,
    })
  : new SandboxDeliveryProvider(SANDBOX_PROFILES.wolt_drive);
const foodoraLive = Boolean(env.FOODORA_API_KEY && env.FOODORA_API_BASE_URL);
const foodoraProvider = foodoraLive
  ? new FoodoraProvider(env.FOODORA_API_KEY, env.FOODORA_WEBHOOK_SECRET)
  : new SandboxDeliveryProvider(SANDBOX_PROFILES.foodora);

let deliverySettingsState: DeliverySettings = defaultDeliverySettings(restaurantId);
let deliverySettingsLoaded = false;

export function getDeliverySettings(): DeliverySettings {
  return deliverySettingsState;
}

let deliveryZonesState: DeliveryZone[] = catalog.deliveryZones;
let deliveryZonesLoaded = false;

export function getDeliveryZones(): DeliveryZone[] {
  return deliveryZonesState;
}

export async function ensureDeliveryZones(): Promise<DeliveryZone[]> {
  if (deliveryZonesLoaded) {
    return deliveryZonesState;
  }
  if (firestoreEnabled) {
    try {
      const stored = await readDeliveryZones(getAdminFirestore(), restaurantId);
      if (stored.length > 0) {
        deliveryZonesState = stored;
        catalog.deliveryZones.splice(0, catalog.deliveryZones.length, ...stored);
      }
    } catch (error) {
      logger.info("delivery_zones_load_skipped", {
        message: error instanceof Error ? error.message : "unknown",
      });
    }
  }
  deliveryZonesLoaded = true;
  return deliveryZonesState;
}

export async function saveDeliveryZones(next: DeliveryZone[]): Promise<DeliveryZone[]> {
  deliveryZonesState = next;
  deliveryZonesLoaded = true;
  catalog.deliveryZones.splice(0, catalog.deliveryZones.length, ...next);
  if (firestoreEnabled) {
    try {
      await writeDeliveryZones(getAdminFirestore(), restaurantId, next);
    } catch (error) {
      logger.info("delivery_zones_save_skipped", {
        message: error instanceof Error ? error.message : "unknown",
      });
    }
  }
  return deliveryZonesState;
}

export async function ensureDeliverySettings(): Promise<DeliverySettings> {
  if (deliverySettingsLoaded) {
    return deliverySettingsState;
  }
  if (firestoreEnabled) {
    try {
      const stored = await readDeliverySettings(getAdminFirestore(), restaurantId);
      if (stored?.pricing && stored.providers) {
        deliverySettingsState = stored;
      }
    } catch (error) {
      logger.info("delivery_settings_load_skipped", {
        message: error instanceof Error ? error.message : "unknown",
      });
    }
  }
  deliverySettingsLoaded = true;
  return deliverySettingsState;
}

export async function saveDeliverySettings(next: DeliverySettings): Promise<DeliverySettings> {
  deliverySettingsState = next;
  deliverySettingsLoaded = true;
  if (firestoreEnabled) {
    try {
      await writeDeliverySettings(getAdminFirestore(), next);
    } catch (error) {
      logger.info("delivery_settings_save_skipped", {
        message: error instanceof Error ? error.message : "unknown",
      });
    }
  }
  return deliverySettingsState;
}

let restaurantSettingsState: RestaurantSettings = defaultRestaurantSettings(restaurantId);
let restaurantSettingsLoaded = false;

export async function ensureRestaurantSettings(): Promise<RestaurantSettings> {
  if (restaurantSettingsLoaded) {
    return restaurantSettingsState;
  }
  if (firestoreEnabled) {
    try {
      const stored = await readRestaurantSettings(getAdminFirestore(), restaurantId);
      if (stored) {
        restaurantSettingsState = stored;
      }
    } catch (error) {
      logger.info("restaurant_settings_load_skipped", {
        message: error instanceof Error ? error.message : "unknown",
      });
    }
  }
  restaurantSettingsLoaded = true;
  return restaurantSettingsState;
}

export async function saveRestaurantSettings(next: RestaurantSettings): Promise<RestaurantSettings> {
  restaurantSettingsState = next;
  restaurantSettingsLoaded = true;
  if (firestoreEnabled) {
    try {
      await writeRestaurantSettings(getAdminFirestore(), next);
    } catch (error) {
      logger.info("restaurant_settings_save_skipped", {
        message: error instanceof Error ? error.message : "unknown",
      });
    }
  }
  return restaurantSettingsState;
}

export function isOrderingPaused(): boolean {
  return restaurantSettingsState.orderingPaused;
}

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
export const deliveryPricingService = new DeliveryPricingService();
export const lastMileProviders = [woltProvider, foodoraProvider];
export const deliveryService = new DeliveryService([new MockDeliveryProvider(() => deliveryZonesState), woltProvider, foodoraProvider], {
  preferCheapest: true,
  preferredProviders: ["wolt_drive", "foodora"],
});
export const deliverySelector = new DeliveryProviderSelector(lastMileProviders, getDeliverySettings, deliveryPricingService);
export const orderService = new OrderService(
  lazyProxy(() => getPorts().orderRepository),
  cartService,
  lazyProxy(() => getPorts().transactions),
  menuRepository,
);
export const deliveryDispatch = new DeliveryDispatchService(
  lastMileProviders,
  lazyProxy(() => getPorts().orderRepository),
  () => ({ ...seedRestaurant.pickup, country: "SE" as const, lat: 59.8581, lng: 17.646 }),
);
export const deliveryWebhookProcessor = new DeliveryWebhookProcessor(
  lastMileProviders,
  lazyProxy(() => getPorts().orderRepository),
  lazyProxy(() => getPorts().webhookStore),
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
export const notificationEmail = createEmailNotificationProvider();
export const notificationService = new NotificationService(
  [notificationEmail],
  lazyProxy(() => getPorts().notificationDedup),
);

const memoryAuthAdmin = new MemoryAuthAdmin();

function createAuthAdmin(): AuthAdminPort {
  if (firestoreEnabled) {
    return new FirebaseAuthAdmin();
  }
  return memoryAuthAdmin;
}

export const authAdmin = lazyProxy(() => createAuthAdmin());
export const customerRepository = lazyProxy(() => getPorts().customerRepository);
export const reviewRepository = lazyProxy(() => getPorts().reviewRepository);
export const staffUserRepository = lazyProxy(() => getPorts().staffUserRepository);
export const customerService = new CustomerService(customerRepository, authAdmin, notificationService);
export const reviewService = new ReviewService(reviewRepository);
export const staffService = new StaffService(staffUserRepository, authAdmin, notificationService, restaurantId);
export const promotionRepository = lazyProxy(() => getPorts().promotionRepository);
export const printingService = new PrintingService(
  lazyProxy(() => getPorts().printJobs),
  new BrowserPrintProvider(),
);
const memoryAnalyticsEvents: AnalyticsRecord[] = [];
const memoryMarketingSignups: MarketingSignup[] = [];

function createAnalyticsRepository() {
  if (firestoreEnabled) {
    try {
      return new FirestoreAnalyticsRepository(getAdminFirestore());
    } catch {
      return new InMemoryAnalyticsRepository(memoryAnalyticsEvents);
    }
  }
  return new InMemoryAnalyticsRepository(memoryAnalyticsEvents);
}

function createMarketingSignupRepository() {
  if (firestoreEnabled) {
    try {
      return new FirestoreMarketingSignupRepository(getAdminFirestore());
    } catch {
      return new InMemoryMarketingSignupRepository(memoryMarketingSignups);
    }
  }
  return new InMemoryMarketingSignupRepository(memoryMarketingSignups);
}

export const analyticsRecords = lazyProxy(() => createAnalyticsRepository());
export const marketingSignupRepository = lazyProxy(() => createMarketingSignupRepository());
export const analyticsService = new AnalyticsService(new LoggingAnalyticsSink(), analyticsRecords);
export const reportsService = new ReportsService(
  analyticsRecords,
  marketingSignupRepository,
  lazyProxy(() => getPorts().orderRepository),
);

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
  return deliveryZonesState;
}

export function mapsPort(): MapsPort {
  return createGeocodingPort();
}

export function restaurantSettings() {
  return {
    id: restaurantId,
    name: seedRestaurant.name,
    city: seedRestaurant.city,
    pickup: seedRestaurant.pickup,
    timeZone: seedRestaurant.timeZone,
    openingHours: seedRestaurant.openingHours,
    orderingPaused: restaurantSettingsState.orderingPaused,
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
