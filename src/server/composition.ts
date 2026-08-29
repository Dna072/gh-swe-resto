import "server-only";

import { AnalyticsService } from "@/domains/analytics/service";
import { CartService } from "@/domains/cart/service";
import { DeliveryService } from "@/domains/delivery/service";
import { MenuService } from "@/domains/menu/service";
import { PricingService } from "@/domains/pricing/service";
import { PromotionService } from "@/domains/promotions/service";
import { LoggingAnalyticsSink } from "@/infrastructure/analytics/sinks";
import { InMemoryMenuRepository } from "@/infrastructure/memory/menu-repository";
import { createMemoryState } from "@/infrastructure/memory/state";
import { InMemoryPromotionRepository } from "@/infrastructure/memory/supporting-repositories";
import {
  SEED_SOURCE,
  seedPricingCalendar,
  seededCatalog,
} from "@/infrastructure/seed/ghana-menu";
import { getEnv } from "@/lib/env";

/**
 * Phase 2 serves the customer catalog from an in-memory demo seed so the
 * storefront works without Firebase credentials. Phase 3+ swaps these ports
 * to Firestore.
 */
const restaurantId = getEnv().DEFAULT_RESTAURANT_ID;
const catalog = seededCatalog(restaurantId);
const state = createMemoryState({
  categories: catalog.categories,
  items: catalog.items,
  modifierGroups: catalog.modifierGroups,
  inventory: catalog.inventory,
});

export const menuRepository = new InMemoryMenuRepository(state);
const promotionRepository = new InMemoryPromotionRepository(state);

export const menuService = new MenuService(menuRepository);
export const pricingService = new PricingService();
export const promotionService = new PromotionService();
export const cartService = new CartService(
  menuRepository,
  pricingService,
  promotionService,
  promotionRepository,
  seedPricingCalendar,
);
export const deliveryService = new DeliveryService([], {
  preferCheapest: true,
  preferredProviders: ["mock"],
});
export const analyticsService = new AnalyticsService(new LoggingAnalyticsSink());

export const marketingSignups: Array<{ email: string; consentedAt: string; source?: string }> = [];

export function restaurantIdFromEnv(): string {
  return restaurantId;
}

export function deliveryZones() {
  return catalog.deliveryZones;
}

export function seedMeta() {
  return { seed: true as const, seedSource: SEED_SOURCE, restaurantId };
}
