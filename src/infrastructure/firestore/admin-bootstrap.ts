import type { Firestore } from "firebase-admin/firestore";
import type { AdminBootstrapRecord, AdminBootstrapStore } from "@/domains/staff/bootstrap-store";
import { collections } from "./paths";

const STALE_MS = 5 * 60_000;

export function adminBootstrapPath(): string {
  return `${collections.meta}/adminBootstrap`;
}

export class FirestoreAdminBootstrapStore implements AdminBootstrapStore {
  constructor(
    private readonly db: Firestore,
    private readonly restaurantId: string,
  ) {}

  private ref() {
    return this.db.doc(adminBootstrapPath());
  }

  async get(): Promise<AdminBootstrapRecord | null> {
    const snap = await this.ref().get();
    if (!snap.exists) {
      return null;
    }
    return snap.data() as AdminBootstrapRecord;
  }

  async claim(nowIso: string): Promise<boolean> {
    return this.db.runTransaction(async (tx) => {
      const snap = await tx.get(this.ref());
      const current = snap.exists ? (snap.data() as AdminBootstrapRecord) : null;
      if (current?.status === "complete") {
        return false;
      }
      if (current?.status === "pending" && Date.now() - Date.parse(current.createdAt) < STALE_MS) {
        return false;
      }
      tx.set(this.ref(), { restaurantId: this.restaurantId, status: "pending", createdAt: nowIso });
      return true;
    });
  }

  async complete(record: Pick<AdminBootstrapRecord, "ownerUid" | "ownerEmail">): Promise<void> {
    const existing = await this.get();
    await this.ref().set(
      {
        restaurantId: this.restaurantId,
        status: "complete",
        createdAt: existing?.createdAt ?? new Date().toISOString(),
        ownerUid: record.ownerUid,
        ownerEmail: record.ownerEmail,
      },
      { merge: true },
    );
  }

  async release(): Promise<void> {
    const existing = await this.get();
    if (existing?.status === "pending") {
      await this.ref().delete();
    }
  }
}
