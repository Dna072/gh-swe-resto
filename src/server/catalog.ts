import "server-only";

import type { PublicCatalog, PublicCategory, PublicMenuItem } from "@/lib/menu/public";
import { menuService, restaurantIdFromEnv, seedMeta } from "@/server/composition";
import { toPublicMenuItem } from "@/server/menu-public";

export async function loadPublicCatalog(): Promise<PublicCatalog> {
  const restaurantId = restaurantIdFromEnv();
  const [categories, page] = await Promise.all([
    menuService.listPublicCategories(restaurantId),
    menuService.listPublicItems(restaurantId, { limit: 50 }),
  ]);
  const names = new Map(categories.map((category) => [category.id, category.name]));
  const items: PublicMenuItem[] = [];
  for (const item of page.items) {
    const groups = await menuService.getModifierGroups(restaurantId, item.modifierGroupIds);
    items.push(toPublicMenuItem(item, names.get(item.categoryId) ?? item.categoryId, groups));
  }
  const publicCategories: PublicCategory[] = categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description,
  }));
  return {
    ...seedMeta(),
    categories: publicCategories,
    items,
  };
}

export async function loadPublicItem(slug: string): Promise<PublicMenuItem> {
  const restaurantId = restaurantIdFromEnv();
  const item = await menuService.getPublicItemBySlug(restaurantId, slug);
  const [category, groups] = await Promise.all([
    menuService.listPublicCategories(restaurantId),
    menuService.getModifierGroups(restaurantId, item.modifierGroupIds),
  ]);
  const categoryName = category.find((entry) => entry.id === item.categoryId)?.name ?? item.categoryId;
  return toPublicMenuItem(item, categoryName, groups);
}
