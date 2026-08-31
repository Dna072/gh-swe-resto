import type { Firestore } from "firebase-admin/firestore";
import type { DeliveryZone } from "@/domains/delivery/models";
import { restaurantPath, restaurantSub } from "./paths";
import { typedConverter } from "./converters";

function col(db: Firestore, restaurantId: string) {
  return db
    .doc(restaurantPath(restaurantId))
    .collection(restaurantSub.deliveryZones)
    .withConverter(typedConverter<DeliveryZone>());
}

export async function readDeliveryZones(db: Firestore, restaurantId: string): Promise<DeliveryZone[]> {
  const snap = await col(db, restaurantId).get();
  return snap.docs.map((doc) => doc.data());
}

export async function writeDeliveryZones(
  db: Firestore,
  restaurantId: string,
  zones: DeliveryZone[],
): Promise<void> {
  const collection = col(db, restaurantId);
  const existing = await collection.listDocuments();
  const keep = new Set(zones.map((zone) => zone.id));
  const batch = db.batch();
  for (const doc of existing) {
    if (!keep.has(doc.id)) {
      batch.delete(doc);
    }
  }
  for (const zone of zones) {
    batch.set(collection.doc(zone.id), zone);
  }
  await batch.commit();
}
