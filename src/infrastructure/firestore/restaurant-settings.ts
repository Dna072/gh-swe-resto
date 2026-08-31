import type { Firestore } from "firebase-admin/firestore";
import type { RestaurantSettings } from "@/domains/restaurant/settings";
import { restaurantSettingsPath } from "./paths";

export async function readRestaurantSettings(
  db: Firestore,
  restaurantId: string,
): Promise<RestaurantSettings | null> {
  const snap = await db.doc(restaurantSettingsPath(restaurantId)).get();
  if (!snap.exists) {
    return null;
  }
  return snap.data() as RestaurantSettings;
}

export async function writeRestaurantSettings(db: Firestore, settings: RestaurantSettings): Promise<void> {
  await db.doc(restaurantSettingsPath(settings.restaurantId)).set(settings, { merge: true });
}
