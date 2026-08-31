import "server-only";

import type { HomepageContent } from "@/domains/content/models";
import type { PublicCatalog, PublicCategory, PublicMenuItem } from "@/lib/menu/public";
import { menuAdminService, menuService, restaurantIdFromEnv, seedMeta, ensureRestaurantSettings } from "@/server/composition";
import { toPublicMenuItem } from "@/server/menu-public";

export async function loadPublicCatalog(): Promise<PublicCatalog> {
  const restaurantId = restaurantIdFromEnv();
  const settings = await ensureRestaurantSettings();
  const [categories, page] = await Promise.all([
    menuService.listPublicCategories(restaurantId),
    menuService.listPublicItems(restaurantId, { limit: 50 }),
  ]);
  const names = new Map(categories.map((category) => [category.id, category.name]));
  const items: PublicMenuItem[] = [];
  for (const item of page.items) {
    const groups = await menuService.getModifierGroups(restaurantId, item.modifierGroupIds);
    items.push(
      toPublicMenuItem(item, names.get(item.categoryId) ?? item.categoryId, groups, new Date(), settings.orderingPaused),
    );
  }
  const publicCategories: PublicCategory[] = categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description,
  }));
  return {
    ...seedMeta(),
    orderingPaused: settings.orderingPaused,
    categories: publicCategories,
    items,
  };
}

export async function loadHomepage(): Promise<HomepageContent> {
  return menuAdminService.getHomepage(restaurantIdFromEnv());
}

export async function loadPublicItem(slug: string): Promise<PublicMenuItem> {
  const restaurantId = restaurantIdFromEnv();
  const settings = await ensureRestaurantSettings();
  const item = await menuService.getPublicItemBySlug(restaurantId, slug);
  const [category, groups] = await Promise.all([
    menuService.listPublicCategories(restaurantId),
    menuService.getModifierGroups(restaurantId, item.modifierGroupIds),
  ]);
  const categoryName = category.find((entry) => entry.id === item.categoryId)?.name ?? item.categoryId;
  return toPublicMenuItem(item, categoryName, groups, new Date(), settings.orderingPaused);
}
