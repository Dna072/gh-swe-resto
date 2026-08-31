import type { Firestore } from "firebase-admin/firestore";
import type { DeliverySettings } from "@/domains/delivery/models";
import { deliverySettingsPath } from "./paths";

export async function readDeliverySettings(
  db: Firestore,
  restaurantId: string,
): Promise<DeliverySettings | null> {
  const snap = await db.doc(deliverySettingsPath(restaurantId)).get();
  if (!snap.exists) {
    return null;
  }
  return snap.data() as DeliverySettings;
}

export async function writeDeliverySettings(db: Firestore, settings: DeliverySettings): Promise<void> {
  await db.doc(deliverySettingsPath(settings.restaurantId)).set(settings, { merge: true });
}
