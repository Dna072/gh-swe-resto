import type { Allergen, AvailabilityStatus, DietaryTag } from "@/domains/menu/models";
import type { Ore } from "@/lib/money";

export type PublicModifierOption = {
  id: string;
  name: string;
  priceOre: Ore;
  priceLabel: string;
  allowsQuantity: boolean;
  maxQuantity?: number;
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
  seed: true;
  seedSource: "demo-seed";
  categories: PublicCategory[];
  items: PublicMenuItem[];
};
