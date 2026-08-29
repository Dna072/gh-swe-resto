import type { Ore } from "@/lib/money";
import type { Timestamped } from "@/domains/shared/types";
import type { Weekday } from "@/lib/time";

export type AvailabilityStatus = "AVAILABLE" | "LOW_STOCK" | "SOLD_OUT" | "PAUSED";
export type DietaryTag = "HALAL" | "VEGETARIAN" | "VEGAN" | "GLUTEN_FREE" | "SPICY";
export type Allergen =
  | "GLUTEN"
  | "MILK"
  | "EGG"
  | "FISH"
  | "CRUSTACEAN"
  | "PEANUT"
  | "SOY"
  | "NUTS"
  | "CELERY"
  | "MUSTARD"
  | "SESAME"
  | "SULPHITES"
  | "LUPIN"
  | "MOLLUSC";

export interface MenuCategory extends Timestamped {
  id: string;
  restaurantId: string;
  name: string;
  slug: string;
  description?: string;
  displayOrder: number;
  archivedAt?: string;
}

export interface MenuItemImage {
  storagePath: string;
  alt: string;
}

export interface KitchenPortion {
  name: string;
  grams: number;
}

export interface MenuItem extends Timestamped {
  id: string;
  restaurantId: string;
  slug: string;
  name: string;
  description: string;
  shortDescription: string;
  images: MenuItemImage[];
  categoryId: string;
  basePriceOre: Ore;
  weekdayPriceOre?: Ore;
  weekendPriceOre?: Ore;
  currency: "SEK";
  availableDays: Weekday[];
  availableFrom?: string;
  availableUntil?: string;
  isAvailable: boolean;
  isFeatured: boolean;
  isPopular: boolean;
  inventoryTracked: boolean;
  inventorySku?: string;
  availableQuantity?: number;
  lowStockThreshold?: number;
  preparationTimeMinutes: number;
  allergens: Allergen[];
  dietaryTags: DietaryTag[];
  modifierGroupIds: string[];
  kitchenPortions: KitchenPortion[];
  displayOrder: number;
  archivedAt?: string;
}

export interface ModifierOption {
  id: string;
  name: string;
  priceOre: Ore;
  isAvailable: boolean;
  allowsQuantity: boolean;
  maxQuantity?: number;
  displayOrder: number;
}

export interface ModifierGroup extends Timestamped {
  id: string;
  restaurantId: string;
  name: string;
  required: boolean;
  minSelections: number;
  maxSelections: number;
  options: ModifierOption[];
  displayOrder: number;
}

export interface PricingCalendar {
  timeZone: string;
  weekendDays: Weekday[];
}

export function availabilityStatus(item: MenuItem, paused = false): AvailabilityStatus {
  if (paused || !item.isAvailable) {
    return "PAUSED";
  }
  if (item.inventoryTracked && (item.availableQuantity ?? 0) <= 0) {
    return "SOLD_OUT";
  }
  if (
    item.inventoryTracked &&
    item.lowStockThreshold !== undefined &&
    (item.availableQuantity ?? 0) <= item.lowStockThreshold
  ) {
    return "LOW_STOCK";
  }
  return "AVAILABLE";
}
