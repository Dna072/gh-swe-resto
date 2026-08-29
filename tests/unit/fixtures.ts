import type { InventoryItem } from "@/domains/inventory/models";
import type { MenuItem, ModifierGroup } from "@/domains/menu/models";
import type { Promotion } from "@/domains/promotions/models";
import type { AddressSnapshot, CustomerSnapshot } from "@/domains/shared/types";

export const RESTAURANT_ID = "uppsala-main";

export const jollof: MenuItem = {
  id: "jollof",
  restaurantId: RESTAURANT_ID,
  slug: "jollof-rice",
  name: "Jollof Rice",
  description: "Smoky Ghanaian jollof with tomato stew.",
  shortDescription: "Classic Ghanaian jollof",
  images: [{ storagePath: "menu/jollof.webp", alt: "Jollof rice" }],
  categoryId: "mains",
  basePriceOre: 12900,
  weekdayPriceOre: 12900,
  weekendPriceOre: 14900,
  currency: "SEK",
  availableDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
  isAvailable: true,
  isFeatured: true,
  isPopular: true,
  inventoryTracked: true,
  inventorySku: "jollof",
  availableQuantity: 30,
  lowStockThreshold: 5,
  preparationTimeMinutes: 25,
  allergens: [],
  dietaryTags: ["HALAL"],
  modifierGroupIds: ["protein", "heat"],
  kitchenPortions: [
    { name: "rice", grams: 350 },
    { name: "protein", grams: 150 },
    { name: "shito", grams: 20 },
  ],
  displayOrder: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

export const tilapia: MenuItem = {
  ...jollof,
  id: "tilapia",
  slug: "banku-tilapia",
  name: "Banku & Tilapia",
  shortDescription: "Banku with grilled tilapia",
  inventorySku: "tilapia",
  availableQuantity: 1,
  modifierGroupIds: ["heat"],
};

export const proteinGroup: ModifierGroup = {
  id: "protein",
  restaurantId: RESTAURANT_ID,
  name: "Protein",
  required: true,
  minSelections: 1,
  maxSelections: 1,
  displayOrder: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  options: [
    { id: "chicken", name: "Chicken", priceOre: 0, isAvailable: true, allowsQuantity: false, displayOrder: 1 },
    { id: "beef", name: "Beef", priceOre: 1000, isAvailable: true, allowsQuantity: false, displayOrder: 2 },
    { id: "extra-chicken", name: "Extra chicken", priceOre: 2500, isAvailable: true, allowsQuantity: true, maxQuantity: 3, displayOrder: 3 },
  ],
};

export const heatGroup: ModifierGroup = {
  id: "heat",
  restaurantId: RESTAURANT_ID,
  name: "Spice level",
  required: true,
  minSelections: 1,
  maxSelections: 1,
  displayOrder: 2,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  options: [
    { id: "mild-shito", name: "Mild shito", priceOre: 0, isAvailable: true, allowsQuantity: false, displayOrder: 1 },
    { id: "hot-shito", name: "Hot shito", priceOre: 0, isAvailable: true, allowsQuantity: false, displayOrder: 2 },
  ],
};

export const welcomePromo: Promotion = {
  id: "welcome",
  restaurantId: RESTAURANT_ID,
  code: "WELCOME10",
  type: "PERCENTAGE",
  percentOff: 10,
  firstOrderOnly: false,
  memberOnly: false,
  redemptionCount: 0,
  stackable: false,
  active: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

export const inventory = (sku: string, quantity: number): InventoryItem => ({
  sku,
  restaurantId: RESTAURANT_ID,
  name: sku,
  availableQuantity: quantity,
  reservedQuantity: 0,
  lowStockThreshold: 2,
  tracked: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});

export const address: AddressSnapshot = {
  line1: "Svartbäcksgatan 1",
  postalCode: "75320",
  city: "Uppsala",
  country: "SE",
};

export const guest: CustomerSnapshot = {
  guestSessionId: "guest-1",
  name: "Ama Mensah",
  email: "ama@example.com",
  phone: "+46700000000",
};
