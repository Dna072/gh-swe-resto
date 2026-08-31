import type { Promotion, PromotionUsage } from "./models";

export interface PromotionRepository {
  getByCode(restaurantId: string, code: string): Promise<Promotion | null>;
  getById(restaurantId: string, promotionId: string): Promise<Promotion | null>;
  getUsage(promotionId: string, customerKey: string): Promise<PromotionUsage | null>;
  list(restaurantId: string): Promise<Promotion[]>;
  save(promotion: Promotion): Promise<Promotion>;
}
