import type { Firestore } from "firebase-admin/firestore";
import type { HomepageContent } from "@/domains/content/models";
import type { MenuCategory, MenuItem, ModifierGroup } from "@/domains/menu/models";
import type { MenuWriteRepository } from "@/domains/menu/write-repository";
import { normalizePageLimit, type Page } from "@/lib/pagination";
import { homepageContentPath, menuItemPath, restaurantPath, restaurantSub } from "./paths";
import { typedConverter } from "./converters";

export class FirestoreMenuRepository implements MenuWriteRepository {
  constructor(private readonly db: Firestore) {}

  private restaurant(restaurantId: string) {
    return this.db.doc(restaurantPath(restaurantId));
  }

  async getCategory(restaurantId: string, categoryId: string): Promise<MenuCategory | null> {
    const snap = await this.restaurant(restaurantId)
      .collection(restaurantSub.menuCategories)
      .withConverter(typedConverter<MenuCategory>())
      .doc(categoryId)
      .get();
    return snap.exists ? (snap.data() ?? null) : null;
  }

  async listCategories(restaurantId: string): Promise<MenuCategory[]> {
    const snap = await this.restaurant(restaurantId)
      .collection(restaurantSub.menuCategories)
      .withConverter(typedConverter<MenuCategory>())
      .orderBy("displayOrder")
      .limit(50)
      .get();
    return snap.docs.map((doc) => doc.data());
  }

  async getItem(restaurantId: string, itemId: string): Promise<MenuItem | null> {
    const snap = await this.restaurant(restaurantId)
      .collection(restaurantSub.menuItems)
      .withConverter(typedConverter<MenuItem>())
      .doc(itemId)
      .get();
    return snap.exists ? (snap.data() ?? null) : null;
  }

  async getItemBySlug(restaurantId: string, slug: string): Promise<MenuItem | null> {
    const snap = await this.restaurant(restaurantId)
      .collection(restaurantSub.menuItems)
      .withConverter(typedConverter<MenuItem>())
      .where("slug", "==", slug)
      .limit(1)
      .get();
    return snap.docs[0]?.data() ?? null;
  }

  async listItems(
    restaurantId: string,
    request: { cursor?: string; limit?: number; categoryId?: string; includeArchived?: boolean },
  ): Promise<Page<MenuItem>> {
    const limit = normalizePageLimit(request.limit);
    let query = this.restaurant(restaurantId)
      .collection(restaurantSub.menuItems)
      .withConverter(typedConverter<MenuItem>())
      .orderBy("displayOrder")
      .limit(limit + 1);
    if (request.categoryId) {
      try {
        query = this.restaurant(restaurantId)
          .collection(restaurantSub.menuItems)
          .withConverter(typedConverter<MenuItem>())
          .where("categoryId", "==", request.categoryId)
          .orderBy("displayOrder")
          .limit(limit + 1);
      } catch {
        query = this.restaurant(restaurantId)
          .collection(restaurantSub.menuItems)
          .withConverter(typedConverter<MenuItem>())
          .orderBy("displayOrder")
          .limit(50);
      }
    }
    let snap;
    try {
      snap = await query.get();
    } catch {
      snap = await this.restaurant(restaurantId)
        .collection(restaurantSub.menuItems)
        .withConverter(typedConverter<MenuItem>())
        .limit(50)
        .get();
    }
    const filtered = snap.docs
      .map((doc) => doc.data())
      .filter((item) => (request.categoryId ? item.categoryId === request.categoryId : true))
      .filter((item) => (request.includeArchived ? true : !item.archivedAt));
    const items = filtered.slice(0, limit);
    return {
      items,
      limit,
      nextCursor: filtered.length > limit ? items[items.length - 1]?.id : undefined,
    };
  }

  async listFeatured(restaurantId: string, limit = 8): Promise<MenuItem[]> {
    try {
      const snap = await this.restaurant(restaurantId)
        .collection(restaurantSub.menuItems)
        .withConverter(typedConverter<MenuItem>())
        .where("isFeatured", "==", true)
        .orderBy("displayOrder")
        .limit(Math.min(limit, 12))
        .get();
      return snap.docs.map((doc) => doc.data());
    } catch {
      const page = await this.listItems(restaurantId, { limit: 50 });
      return page.items.filter((item) => item.isFeatured && !item.archivedAt).slice(0, limit);
    }
  }

  async saveItem(item: MenuItem): Promise<MenuItem> {
    await this.db.doc(menuItemPath(item.restaurantId, item.id)).set(item, { merge: true });
    return item;
  }

  async getHomepage(restaurantId: string): Promise<HomepageContent | null> {
    const snap = await this.db
      .doc(homepageContentPath(restaurantId))
      .withConverter(typedConverter<HomepageContent>())
      .get();
    return snap.exists ? (snap.data() ?? null) : null;
  }

  async saveHomepage(content: HomepageContent): Promise<HomepageContent> {
    await this.db.doc(homepageContentPath(content.restaurantId)).set(content, { merge: true });
    return content;
  }

  async getModifierGroup(restaurantId: string, groupId: string): Promise<ModifierGroup | null> {
    const snap = await this.restaurant(restaurantId)
      .collection(restaurantSub.modifierGroups)
      .withConverter(typedConverter<ModifierGroup>())
      .doc(groupId)
      .get();
    return snap.exists ? (snap.data() ?? null) : null;
  }

  async listModifierGroups(restaurantId: string, groupIds: string[]): Promise<ModifierGroup[]> {
    if (groupIds.length === 0) {
      return [];
    }
    const refs = groupIds.map((id) =>
      this.restaurant(restaurantId)
        .collection(restaurantSub.modifierGroups)
        .withConverter(typedConverter<ModifierGroup>())
        .doc(id),
    );
    const snaps = await this.db.getAll(...refs);
    return snaps.filter((snap) => snap.exists).map((snap) => snap.data() as ModifierGroup);
  }
}
