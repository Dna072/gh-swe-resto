export type AdminBootstrapRecord = {
  restaurantId: string;
  status: "pending" | "complete";
  createdAt: string;
  ownerUid?: string;
  ownerEmail?: string;
};

export interface AdminBootstrapStore {
  get(): Promise<AdminBootstrapRecord | null>;
  claim(nowIso: string): Promise<boolean>;
  complete(record: Pick<AdminBootstrapRecord, "ownerUid" | "ownerEmail">): Promise<void>;
  release(): Promise<void>;
}
