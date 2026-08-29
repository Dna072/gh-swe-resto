import type { Firestore } from "firebase-admin/firestore";
import type { MenuCategory, MenuItem, ModifierGroup } from "@/domains/menu/models";
import type { MenuRepository } from "@/domains/menu/repository";
import { normalizePageLimit, type Page } from "@/lib/pagination";
import { restaurantPath, restaurantSub } from "./paths";
import { typedConverter } from "./converters";

export class FirestoreMenuRepository implements MenuRepository {
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
      query = this.restaurant(restaurantId)
        .collection(restaurantSub.menuItems)
        .withConverter(typedConverter<MenuItem>())
        .where("categoryId", "==", request.categoryId)
        .orderBy("displayOrder")
        .limit(limit + 1);
    }
    const snap = await query.get();
    const items = snap.docs.slice(0, limit).map((doc) => doc.data());
    return {
      items,
      limit,
      nextCursor: snap.docs.length > limit ? snap.docs[limit - 1]?.id : undefined,
    };
  }

  async listFeatured(restaurantId: string, limit = 8): Promise<MenuItem[]> {
    const snap = await this.restaurant(restaurantId)
      .collection(restaurantSub.menuItems)
      .withConverter(typedConverter<MenuItem>())
      .where("isFeatured", "==", true)
      .orderBy("displayOrder")
      .limit(Math.min(limit, 12))
      .get();
    return snap.docs.map((doc) => doc.data());
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
