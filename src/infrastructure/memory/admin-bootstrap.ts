import type { AdminBootstrapRecord, AdminBootstrapStore } from "@/domains/staff/bootstrap-store";

const STALE_MS = 5 * 60_000;

export class InMemoryAdminBootstrapStore implements AdminBootstrapStore {
  constructor(
    private readonly restaurantId: string,
    private record: AdminBootstrapRecord | null = null,
  ) {}

  async get(): Promise<AdminBootstrapRecord | null> {
    return this.record;
  }

  async claim(nowIso: string): Promise<boolean> {
    if (this.record?.status === "complete") {
      return false;
    }
    if (this.record?.status === "pending" && Date.now() - Date.parse(this.record.createdAt) < STALE_MS) {
      return false;
    }
    this.record = { restaurantId: this.restaurantId, status: "pending", createdAt: nowIso };
    return true;
  }

  async complete(record: Pick<AdminBootstrapRecord, "ownerUid" | "ownerEmail">): Promise<void> {
    this.record = {
      restaurantId: this.restaurantId,
      status: "complete",
      createdAt: this.record?.createdAt ?? new Date().toISOString(),
      ownerUid: record.ownerUid,
      ownerEmail: record.ownerEmail,
    };
  }

  async release(): Promise<void> {
    if (this.record?.status === "pending") {
      this.record = null;
    }
  }
}
