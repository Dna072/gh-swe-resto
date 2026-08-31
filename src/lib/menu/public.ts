import type { Allergen, AvailabilityStatus, DietaryTag } from "@/domains/menu/models";
import type { Ore } from "@/lib/money";

export type PublicModifierOption = {
  id: string;
  name: string;
  priceOre: Ore;
  priceLabel: string;
  allowsQuantity: boolean;
  maxQuantity?: number;
  spiceLevel?: 1 | 2 | 3;
};

export type PublicModifierGroup = {
  id: string;
  name: string;
  required: boolean;
  minSelections: number;
  maxSelections: number;
  options: PublicModifierOption[];
};

export type PublicMenuItem = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  categoryName: string;
  imageUrl: string | null;
  imageAlt: string;
  imagePosition?: string;
  hasPhotograph: boolean;
  displayPriceOre: Ore;
  displayPriceLabel: string;
  availability: AvailabilityStatus;
  remainingPortions: number | null;
  featured: boolean;
  popular: boolean;
  dietaryTags: DietaryTag[];
  allergens: Allergen[];
  preparationTimeMinutes: number;
  modifierGroups: PublicModifierGroup[];
};

export type PublicCategory = {
  id: string;
  slug: string;
  name: string;
  description?: string;
};

export type PublicCatalog = {
  restaurantId: string;
  seed: boolean;
  seedSource: "demo-seed" | "firestore";
  orderingPaused: boolean;
  categories: PublicCategory[];
  items: PublicMenuItem[];
};
