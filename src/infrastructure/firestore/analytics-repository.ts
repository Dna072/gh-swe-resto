import type { Firestore } from "firebase-admin/firestore";
import type { AnalyticsRecord, MarketingSignup } from "@/domains/analytics/models";
import type { AnalyticsRepository, MarketingSignupRepository } from "@/domains/analytics/repository";
import { collections } from "./paths";
import { typedConverter } from "./converters";

export class FirestoreAnalyticsRepository implements AnalyticsRepository {
  constructor(private readonly db: Firestore) {}

  private col() {
    return this.db.collection(collections.analyticsEvents).withConverter(typedConverter<AnalyticsRecord>());
  }

  async append(record: AnalyticsRecord): Promise<void> {
    await this.col().doc(record.id.replace(/[/:]/g, "_")).set(record);
  }

  async listRecent(restaurantId: string, limit: number): Promise<AnalyticsRecord[]> {
    try {
      const snap = await this.col()
        .where("restaurantId", "==", restaurantId)
        .orderBy("occurredAt", "desc")
        .limit(limit)
        .get();
      return snap.docs.map((doc) => doc.data());
    } catch {
      const snap = await this.col().where("restaurantId", "==", restaurantId).limit(limit).get();
      return snap.docs.map((doc) => doc.data()).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    }
  }
}

export class FirestoreMarketingSignupRepository implements MarketingSignupRepository {
  constructor(private readonly db: Firestore) {}

  private col() {
    return this.db.collection(collections.marketingSignups).withConverter(typedConverter<MarketingSignup>());
  }

  async upsert(signup: MarketingSignup): Promise<void> {
    await this.col().doc(signup.id).set(signup, { merge: true });
  }

  async list(restaurantId: string): Promise<MarketingSignup[]> {
    try {
      const snap = await this.col()
        .where("restaurantId", "==", restaurantId)
        .orderBy("consentedAt", "desc")
        .limit(200)
        .get();
      return snap.docs.map((doc) => doc.data());
    } catch {
      const snap = await this.col().where("restaurantId", "==", restaurantId).limit(200).get();
      return snap.docs.map((doc) => doc.data()).sort((a, b) => b.consentedAt.localeCompare(a.consentedAt));
    }
  }
}
