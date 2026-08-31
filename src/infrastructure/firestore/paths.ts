export const collections = {
  meta: "_meta",
  restaurants: "restaurants",
  customers: "customers",
  users: "users",
  orders: "orders",
  payments: "payments",
  deliveries: "deliveries",
  printJobs: "printJobs",
  notifications: "notifications",
  reviews: "reviews",
  auditLogs: "auditLogs",
  idempotencyKeys: "idempotencyKeys",
  memberships: "memberships",
  webhookEvents: "webhookEvents",
  analyticsEvents: "analyticsEvents",
  marketingSignups: "marketingSignups",
} as const;

export const restaurantSub = {
  menuCategories: "menuCategories",
  menuItems: "menuItems",
  modifierGroups: "modifierGroups",
  deliveryZones: "deliveryZones",
  promotions: "promotions",
  inventory: "inventory",
  counters: "counters",
  aggregates: "aggregates",
  plans: "plans",
  content: "content",
} as const;

export function restaurantPath(restaurantId: string): string {
  return `${collections.restaurants}/${restaurantId}`;
}

export function menuItemPath(restaurantId: string, itemId: string): string {
  return `${restaurantPath(restaurantId)}/${restaurantSub.menuItems}/${itemId}`;
}

export function inventoryPath(restaurantId: string, sku: string): string {
  return `${restaurantPath(restaurantId)}/${restaurantSub.inventory}/${sku}`;
}

export function promotionPath(restaurantId: string, promotionId: string): string {
  return `${restaurantPath(restaurantId)}/${restaurantSub.promotions}/${promotionId}`;
}

export function promotionUsagePath(promotionId: string, customerKey: string): string {
  return `${collections.restaurants}/_usages/promotionUsages/${promotionId}__${customerKey}`;
}

export function homepageContentPath(restaurantId: string): string {
  return `${restaurantPath(restaurantId)}/${restaurantSub.content}/homepage`;
}

export function deliverySettingsPath(restaurantId: string): string {
  return `${restaurantPath(restaurantId)}/${restaurantSub.content}/deliverySettings`;
}
