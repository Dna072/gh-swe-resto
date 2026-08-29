import type { Page, PageRequest } from "@/lib/pagination";
import type { MenuCategory, MenuItem, ModifierGroup } from "./models";

export interface MenuRepository {
  getCategory(restaurantId: string, categoryId: string): Promise<MenuCategory | null>;
  listCategories(restaurantId: string, options?: { includeArchived?: boolean }): Promise<MenuCategory[]>;
  getItem(restaurantId: string, itemId: string): Promise<MenuItem | null>;
  getItemBySlug(restaurantId: string, slug: string): Promise<MenuItem | null>;
  listItems(
    restaurantId: string,
    request: PageRequest & { categoryId?: string; includeArchived?: boolean },
  ): Promise<Page<MenuItem>>;
  listFeatured(restaurantId: string, limit?: number): Promise<MenuItem[]>;
  getModifierGroup(restaurantId: string, groupId: string): Promise<ModifierGroup | null>;
  listModifierGroups(restaurantId: string, groupIds: string[]): Promise<ModifierGroup[]>;
}
