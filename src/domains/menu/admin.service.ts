import { AppError } from "@/lib/errors";
import { nowIso } from "@/lib/time";
import { newId } from "@/lib/ids";
import type { HomepageContent } from "@/domains/content/models";
import { defaultHomepageContent } from "@/domains/content/defaults";
import type { Allergen, DietaryTag, MenuItem } from "./models";
import type { MenuWriteRepository } from "./write-repository";
import { MediaService } from "@/domains/media/service";

export interface MenuItemDraft {
  id?: string;
  slug: string;
  name: string;
  description: string;
  shortDescription: string;
  categoryId: string;
  basePriceOre: number;
  weekdayPriceOre?: number;
  weekendPriceOre?: number;
  isAvailable?: boolean;
  isFeatured?: boolean;
  isPopular?: boolean;
  inventoryTracked?: boolean;
  inventorySku?: string;
  availableQuantity?: number;
  lowStockThreshold?: number;
  preparationTimeMinutes: number;
  allergens?: Allergen[];
  dietaryTags?: DietaryTag[];
  modifierGroupIds?: string[];
  displayOrder?: number;
}

export class MenuAdminService {
  constructor(
    private readonly menu: MenuWriteRepository,
    private readonly media: MediaService,
  ) {}

  async listItems(restaurantId: string): Promise<MenuItem[]> {
    const page = await this.menu.listItems(restaurantId, { limit: 50, includeArchived: true });
    return page.items;
  }

  async getItem(restaurantId: string, itemId: string): Promise<MenuItem> {
    const item = await this.menu.getItem(restaurantId, itemId);
    if (!item) {
      throw new AppError("NOT_FOUND", "That meal is not on the menu.");
    }
    return item;
  }

  async saveItem(restaurantId: string, draft: MenuItemDraft): Promise<MenuItem> {
    const existing = draft.id ? await this.menu.getItem(restaurantId, draft.id) : null;
    const now = nowIso();
    const item: MenuItem = {
      restaurantId,
      id: existing?.id ?? draft.id ?? newId(),
      slug: draft.slug,
      name: draft.name,
      description: draft.description,
      shortDescription: draft.shortDescription,
      images: existing?.images ?? [],
      categoryId: draft.categoryId,
      basePriceOre: draft.basePriceOre,
      weekdayPriceOre: draft.weekdayPriceOre,
      weekendPriceOre: draft.weekendPriceOre,
      currency: "SEK",
      availableDays: existing?.availableDays ?? [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
      isAvailable: draft.isAvailable ?? existing?.isAvailable ?? true,
      isFeatured: draft.isFeatured ?? existing?.isFeatured ?? false,
      isPopular: draft.isPopular ?? existing?.isPopular ?? false,
      inventoryTracked: draft.inventoryTracked ?? existing?.inventoryTracked ?? false,
      inventorySku: draft.inventorySku ?? existing?.inventorySku,
      availableQuantity: draft.availableQuantity ?? existing?.availableQuantity,
      lowStockThreshold: draft.lowStockThreshold ?? existing?.lowStockThreshold,
      preparationTimeMinutes: draft.preparationTimeMinutes,
      allergens: draft.allergens ?? existing?.allergens ?? [],
      dietaryTags: draft.dietaryTags ?? existing?.dietaryTags ?? [],
      modifierGroupIds: draft.modifierGroupIds ?? existing?.modifierGroupIds ?? [],
      kitchenPortions: existing?.kitchenPortions ?? [],
      displayOrder: draft.displayOrder ?? existing?.displayOrder ?? 99,
      archivedAt: existing?.archivedAt,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    return this.menu.saveItem(item);
  }

  async setArchived(restaurantId: string, itemId: string, archived: boolean): Promise<MenuItem> {
    const item = await this.getItem(restaurantId, itemId);
    return this.menu.saveItem({
      ...item,
      archivedAt: archived ? nowIso() : undefined,
      updatedAt: nowIso(),
    });
  }

  async addImage(
    restaurantId: string,
    itemId: string,
    bytes: Buffer,
    declaredType: string | undefined,
    altText: string,
  ): Promise<MenuItem> {
    const item = await this.getItem(restaurantId, itemId);
    const image = await this.media.ingestPhotograph({
      bytes,
      declaredType,
      altText,
      restaurantId,
      menuItemId: item.id,
      scope: "menu",
      isPrimary: item.images.filter((entry) => entry.status !== "PENDING_DELETE").length === 0,
    });
    return this.menu.saveItem({
      ...item,
      images: [...item.images, image],
      updatedAt: nowIso(),
    });
  }

  async replaceImage(
    restaurantId: string,
    itemId: string,
    imageId: string,
    bytes: Buffer,
    declaredType: string | undefined,
    altText: string,
  ): Promise<MenuItem> {
    const item = await this.getItem(restaurantId, itemId);
    const current = item.images.find((image) => image.id === imageId || image.storagePath === imageId);
    if (!current) {
      throw new AppError("NOT_FOUND", "That photograph is not on this meal.");
    }
    const next = await this.media.ingestPhotograph({
      bytes,
      declaredType,
      altText,
      restaurantId,
      menuItemId: item.id,
      scope: "menu",
      isPrimary: current.isPrimary,
    });
    return this.menu.saveItem({
      ...item,
      images: item.images.map((image) =>
        image === current ? this.media.retire(image) : image,
      ).concat(next),
      updatedAt: nowIso(),
    });
  }

  async removeImage(restaurantId: string, itemId: string, imageId: string): Promise<MenuItem> {
    const item = await this.getItem(restaurantId, itemId);
    return this.menu.saveItem({
      ...item,
      images: item.images.map((image) =>
        image.id === imageId || image.storagePath === imageId ? this.media.retire(image) : image,
      ),
      updatedAt: nowIso(),
    });
  }

  async setPrimaryImage(restaurantId: string, itemId: string, imageId: string): Promise<MenuItem> {
    const item = await this.getItem(restaurantId, itemId);
    return this.menu.saveItem({
      ...item,
      images: item.images.map((image, index) => ({
        ...image,
        isPrimary: image.id === imageId || image.storagePath === imageId,
        sortOrder: image.id === imageId ? 0 : index + 1,
      })),
      updatedAt: nowIso(),
    });
  }

  async setImageFocus(
    restaurantId: string,
    itemId: string,
    imageId: string,
    focalPointX: number,
    focalPointY: number,
  ): Promise<MenuItem> {
    const item = await this.getItem(restaurantId, itemId);
    return this.menu.saveItem({
      ...item,
      images: item.images.map((image) =>
        image.id === imageId || image.storagePath === imageId
          ? { ...image, focalPointX, focalPointY, updatedAt: nowIso() }
          : image,
      ),
      updatedAt: nowIso(),
    });
  }

  async getHomepage(restaurantId: string): Promise<HomepageContent> {
    return (await this.menu.getHomepage(restaurantId)) ?? defaultHomepageContent(restaurantId);
  }

  async saveHomepage(content: HomepageContent): Promise<HomepageContent> {
    return this.menu.saveHomepage({ ...content, updatedAt: nowIso() });
  }

  async setHeroImage(
    restaurantId: string,
    bytes: Buffer,
    declaredType: string | undefined,
    altText: string,
    mobile = false,
  ): Promise<HomepageContent> {
    const current = await this.getHomepage(restaurantId);
    const image = await this.media.ingestPhotograph({
      bytes,
      declaredType,
      altText,
      restaurantId,
      scope: "homepage",
      isPrimary: true,
    });
    const previous = mobile ? current.hero.mobileImage : current.hero.image;
    const hero = {
      ...current.hero,
      ...(mobile
        ? { mobileImage: image }
        : { image }),
    };
    if (previous) {
      // Keep the retired asset referenced until cache expires; do not hard-delete.
      void this.media.retire(previous);
    }
    return this.saveHomepage({ ...current, hero });
  }

  async cleanupRetiredImages(restaurantId: string): Promise<{ purged: number }> {
    const items = await this.listItems(restaurantId);
    let purged = 0;
    for (const item of items) {
      const retired = item.images.filter((image) => image.status === "PENDING_DELETE");
      if (retired.length === 0) {
        continue;
      }
      for (const image of retired) {
        await this.media.purgeRetired(image);
        purged += 1;
      }
      await this.menu.saveItem({
        ...item,
        images: item.images.filter((image) => image.status !== "PENDING_DELETE"),
        updatedAt: nowIso(),
      });
    }
    return { purged };
  }
}
