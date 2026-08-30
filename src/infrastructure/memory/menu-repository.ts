import type { HomepageContent } from "@/domains/content/models";
import type { MenuWriteRepository } from "@/domains/menu/write-repository";
import type { MenuCategory, MenuItem, ModifierGroup } from "@/domains/menu/models";
import { normalizePageLimit, type Page } from "@/lib/pagination";
import type { MemoryState } from "./state";

export class InMemoryMenuRepository implements MenuWriteRepository {
  constructor(private readonly state: MemoryState) {}

  async getCategory(restaurantId: string, categoryId: string): Promise<MenuCategory | null> {
    return this.state.categories.find((item) => item.restaurantId === restaurantId && item.id === categoryId) ?? null;
  }

  async listCategories(restaurantId: string, options?: { includeArchived?: boolean }): Promise<MenuCategory[]> {
    return this.state.categories
      .filter((item) => item.restaurantId === restaurantId && (options?.includeArchived || !item.archivedAt))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getItem(restaurantId: string, itemId: string): Promise<MenuItem | null> {
    return this.state.items.find((item) => item.restaurantId === restaurantId && item.id === itemId) ?? null;
  }

  async getItemBySlug(restaurantId: string, slug: string): Promise<MenuItem | null> {
    return this.state.items.find((item) => item.restaurantId === restaurantId && item.slug === slug) ?? null;
  }

  async listItems(
    restaurantId: string,
    request: { cursor?: string; limit?: number; categoryId?: string; includeArchived?: boolean },
  ): Promise<Page<MenuItem>> {
    const limit = normalizePageLimit(request.limit);
    let items = this.state.items
      .filter((item) => item.restaurantId === restaurantId)
      .filter((item) => (request.includeArchived ? true : !item.archivedAt))
      .filter((item) => (request.categoryId ? item.categoryId === request.categoryId : true))
      .sort((a, b) => a.displayOrder - b.displayOrder || a.id.localeCompare(b.id));
    if (request.cursor) {
      const index = items.findIndex((item) => item.id === request.cursor);
      items = index >= 0 ? items.slice(index + 1) : items;
    }
    const page = items.slice(0, limit);
    return {
      items: page,
      limit,
      nextCursor: items.length > limit ? page[page.length - 1]?.id : undefined,
    };
  }

  async listFeatured(restaurantId: string, limit = 8): Promise<MenuItem[]> {
    return this.state.items
      .filter((item) => item.restaurantId === restaurantId && item.isFeatured && !item.archivedAt)
      .slice(0, limit);
  }

  async getModifierGroup(restaurantId: string, groupId: string): Promise<ModifierGroup | null> {
    return this.state.modifierGroups.find((item) => item.restaurantId === restaurantId && item.id === groupId) ?? null;
  }

  async listModifierGroups(restaurantId: string, groupIds: string[]): Promise<ModifierGroup[]> {
    return this.state.modifierGroups.filter(
      (item) => item.restaurantId === restaurantId && groupIds.includes(item.id),
    );
  }

  async saveItem(item: MenuItem): Promise<MenuItem> {
    const index = this.state.items.findIndex(
      (candidate) => candidate.restaurantId === item.restaurantId && candidate.id === item.id,
    );
    if (index >= 0) {
      this.state.items[index] = item;
    } else {
      this.state.items.push(item);
    }
    return item;
  }

  async getHomepage(restaurantId: string): Promise<HomepageContent | null> {
    return this.state.homepage?.restaurantId === restaurantId ? this.state.homepage : null;
  }

  async saveHomepage(content: HomepageContent): Promise<HomepageContent> {
    this.state.homepage = content;
    return content;
  }
}
