import type { DocumentData, FirestoreDataConverter } from "firebase-admin/firestore";

export function typedConverter<T extends DocumentData>(): FirestoreDataConverter<T> {
  return {
    toFirestore(model: T): DocumentData {
      return model;
    },
    fromFirestore(snapshot): T {
      return snapshot.data() as T;
    },
  };
}
