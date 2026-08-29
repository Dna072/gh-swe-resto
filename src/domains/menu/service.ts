import { AppError } from "@/lib/errors";
import { normalizePageLimit, type Page, type PageRequest } from "@/lib/pagination";
import { availabilityStatus, type MenuCategory, type MenuItem, type ModifierGroup } from "./models";
import type { MenuRepository } from "./repository";

const FEATURED_LIMIT = 8;

export class MenuService {
  constructor(private readonly menu: MenuRepository) {}

  async listPublicCategories(restaurantId: string): Promise<MenuCategory[]> {
    const categories = await this.menu.listCategories(restaurantId);
    return categories.filter((category) => !category.archivedAt);
  }

  async listPublicItems(
    restaurantId: string,
    request: PageRequest & { categoryId?: string } = {},
  ): Promise<Page<MenuItem>> {
    const page = await this.menu.listItems(restaurantId, {
      ...request,
      limit: normalizePageLimit(request.limit),
    });
    return {
      ...page,
      items: page.items.filter((item) => !item.archivedAt && item.isAvailable),
    };
  }

  async getPublicItemBySlug(restaurantId: string, slug: string): Promise<MenuItem> {
    const item = await this.menu.getItemBySlug(restaurantId, slug);
    if (!item || item.archivedAt) {
      throw new AppError("NOT_FOUND", "That meal is not available.");
    }
    return item;
  }

  async listFeatured(restaurantId: string): Promise<MenuItem[]> {
    const items = await this.menu.listFeatured(restaurantId, FEATURED_LIMIT);
    return items.filter((item) => !item.archivedAt && availabilityStatus(item) !== "SOLD_OUT");
  }

  async getModifierGroups(restaurantId: string, groupIds: string[]): Promise<ModifierGroup[]> {
    if (groupIds.length === 0) {
      return [];
    }
    return this.menu.listModifierGroups(restaurantId, groupIds);
  }
}
