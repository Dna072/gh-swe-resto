import "server-only";

import { AnalyticsService } from "@/domains/analytics/service";
import { CartService } from "@/domains/cart/service";
import { DeliveryService } from "@/domains/delivery/service";
import { defaultHomepageContent } from "@/domains/content/defaults";
import { MediaService } from "@/domains/media/service";
import { MenuAdminService } from "@/domains/menu/admin.service";
import { MenuService } from "@/domains/menu/service";
import { OrderService } from "@/domains/orders/service";
import { PricingService } from "@/domains/pricing/service";
import { PromotionService } from "@/domains/promotions/service";
import { LoggingAnalyticsSink } from "@/infrastructure/analytics/sinks";
import { MockDeliveryProvider } from "@/infrastructure/delivery/mock-provider";
import { InMemoryMenuRepository } from "@/infrastructure/memory/menu-repository";
import { InMemoryOrderRepository } from "@/infrastructure/memory/order-repository";
import { createMemoryState } from "@/infrastructure/memory/state";
import { InMemoryPromotionRepository } from "@/infrastructure/memory/supporting-repositories";
import { InMemoryTransactionRunner } from "@/infrastructure/memory/transaction-runner";
import {
  SEED_SOURCE,
  seedPricingCalendar,
  seedRestaurant,
  seededCatalog,
} from "@/infrastructure/seed/ghana-menu";
import { LocalObjectStorage } from "@/infrastructure/storage/local-storage";
import { GcsBinaryStorage } from "@/infrastructure/storage/gcs-binary-storage";
import type { BinaryObjectStorage } from "@/infrastructure/storage/object-storage";
import { getEnv } from "@/lib/env";

/**
 * Phase 2–3 serve catalog and guest orders from an in-memory demo seed so the
 * storefront works without Firebase credentials. Later phases swap these ports
 * to Firestore.
 */
const restaurantId = getEnv().DEFAULT_RESTAURANT_ID;
const catalog = seededCatalog(restaurantId);
const state = createMemoryState({
  categories: catalog.categories,
  items: catalog.items,
  modifierGroups: catalog.modifierGroups,
  inventory: catalog.inventory,
  homepage: defaultHomepageContent(restaurantId),
});

function createObjectStorage(): BinaryObjectStorage {
  const env = getEnv();
  if (env.APP_ENV === "production" && env.GCS_ASSETS_BUCKET) {
    return new GcsBinaryStorage(env.GCS_ASSETS_BUCKET);
  }
  return new LocalObjectStorage();
}

export const menuRepository = new InMemoryMenuRepository(state);
const promotionRepository = new InMemoryPromotionRepository(state);
const orderRepository = new InMemoryOrderRepository(state);
const transactions = new InMemoryTransactionRunner(state);
const mockDelivery = new MockDeliveryProvider(() => catalog.deliveryZones);

export const objectStorage = createObjectStorage();
export const mediaService = new MediaService(objectStorage);
export const menuService = new MenuService(menuRepository);
export const menuAdminService = new MenuAdminService(menuRepository, mediaService);
export const pricingService = new PricingService();
export const promotionService = new PromotionService();
export const cartService = new CartService(
  menuRepository,
  pricingService,
  promotionService,
  promotionRepository,
  seedPricingCalendar,
);
export const deliveryService = new DeliveryService([mockDelivery], {
  preferCheapest: true,
  preferredProviders: ["mock"],
});
export const orderService = new OrderService(orderRepository, cartService, transactions);
export const analyticsService = new AnalyticsService(new LoggingAnalyticsSink());

export const marketingSignups: Array<{ email: string; consentedAt: string; source?: string }> = [];

/** Replay tokens for in-memory idempotent checkout. Hashes stay on the order. */
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
  return { seed: true as const, seedSource: SEED_SOURCE, restaurantId };
}
