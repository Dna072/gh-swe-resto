import type { Firestore } from "firebase-admin/firestore";
import { defaultHomepageContent } from "@/domains/content/defaults";
import { SCHEMA_VERSION } from "@/domains/shared/types";
import { seedRestaurant, seededCatalog } from "@/infrastructure/seed/ghana-menu";
import { collections, restaurantPath, restaurantSub } from "./paths";

export async function restaurantHasMenu(db: Firestore, restaurantId: string): Promise<boolean> {
  const snap = await db.doc(restaurantPath(restaurantId)).collection(restaurantSub.menuItems).limit(1).get();
  return !snap.empty;
}

export async function seedFirestoreCatalog(
  db: Firestore,
  restaurantId: string,
): Promise<{ wrote: number; restaurantId: string }> {
  const catalog = seededCatalog(restaurantId);
  const homepage = defaultHomepageContent(restaurantId);
  const batch = db.batch();
  let wrote = 0;

  batch.set(
    db.doc(restaurantPath(restaurantId)),
    {
      ...seedRestaurant,
      id: restaurantId,
      schemaVersion: SCHEMA_VERSION,
    },
    { merge: true },
  );
  wrote += 1;

  batch.set(db.doc(`${collections.meta}/schema`), { version: SCHEMA_VERSION, restaurantId }, { merge: true });
  wrote += 1;

  const restaurant = db.doc(restaurantPath(restaurantId));
  for (const category of catalog.categories) {
    batch.set(restaurant.collection(restaurantSub.menuCategories).doc(category.id), category, { merge: true });
    wrote += 1;
  }
  for (const item of catalog.items) {
    batch.set(restaurant.collection(restaurantSub.menuItems).doc(item.id), item, { merge: true });
    wrote += 1;
  }
  for (const group of catalog.modifierGroups) {
    batch.set(restaurant.collection(restaurantSub.modifierGroups).doc(group.id), group, { merge: true });
    wrote += 1;
  }
  for (const item of catalog.inventory) {
    batch.set(restaurant.collection(restaurantSub.inventory).doc(item.sku), item, { merge: true });
    wrote += 1;
  }
  for (const zone of catalog.deliveryZones) {
    batch.set(restaurant.collection(restaurantSub.deliveryZones).doc(zone.id), zone, { merge: true });
    wrote += 1;
  }
  batch.set(restaurant.collection(restaurantSub.content).doc("homepage"), homepage, { merge: true });
  wrote += 1;
  batch.set(restaurant.collection(restaurantSub.counters).doc("orders"), { value: 1000 }, { merge: true });
  wrote += 1;

  await batch.commit();
  return { wrote, restaurantId };
}
