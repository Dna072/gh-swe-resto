import "server-only";

import { availabilityStatus, type MenuItem, type ModifierGroup } from "@/domains/menu/models";
import { formatSek } from "@/lib/money";
import { imageAlt, imageUrl, objectPosition, primaryImage } from "@/lib/media/display";
import type { PublicMenuItem, PublicModifierGroup } from "@/lib/menu/public";
import { seedPricingCalendar } from "@/infrastructure/seed/ghana-menu";
import { pricingService } from "@/server/composition";

function mapGroups(groups: ModifierGroup[]): PublicModifierGroup[] {
  return [...groups]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((group) => ({
      id: group.id,
      name: group.name,
      required: group.required,
      minSelections: group.minSelections,
      maxSelections: group.maxSelections,
      options: [...group.options]
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .filter((option) => option.isAvailable)
        .map((option) => ({
          id: option.id,
          name: option.name,
          priceOre: option.priceOre,
          priceLabel:
            option.priceOre === 0 ? "Included" : `+${formatSek(option.priceOre)}`,
          allowsQuantity: option.allowsQuantity,
          maxQuantity: option.maxQuantity,
          spiceLevel: option.spiceLevel,
        })),
    }));
}

export function toPublicMenuItem(
  item: MenuItem,
  categoryName: string,
  groups: ModifierGroup[],
  at = new Date(),
): PublicMenuItem {
  const displayPriceOre = pricingService.resolveItemPrice(item, at, seedPricingCalendar);
  const photo = primaryImage(item.images);
  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    shortDescription: item.shortDescription,
    description: item.description,
    categoryId: item.categoryId,
    categoryName,
    imageUrl: imageUrl(photo, "card"),
    imageAlt: imageAlt(photo, item.name),
    imagePosition: objectPosition(photo),
    hasPhotograph: Boolean(photo),
    displayPriceOre,
    displayPriceLabel: formatSek(displayPriceOre),
    availability: availabilityStatus(item),
    remainingPortions: item.inventoryTracked ? (item.availableQuantity ?? 0) : null,
    featured: item.isFeatured,
    popular: item.isPopular,
    dietaryTags: item.dietaryTags,
    allergens: item.allergens,
    preparationTimeMinutes: item.preparationTimeMinutes,
    modifierGroups: mapGroups(groups),
  };
}
