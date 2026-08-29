import { AppError } from "@/lib/errors";
import { clampNonNegativeOre, type Ore } from "@/lib/money";
import type { DiscountResult, Promotion, PromotionContext, PromotionUsage } from "./models";

export interface PromotionQuoteInput {
  promotion?: Promotion | null;
  usage?: PromotionUsage | null;
  context: PromotionContext;
  subtotalOre: Ore;
  deliveryFeeOre: Ore;
}

export class PromotionService {
  customerKey(context: PromotionContext): string {
    return context.customerId ?? context.guestSessionId ?? "anonymous";
  }

  evaluate(input: PromotionQuoteInput): DiscountResult {
    const { promotion, usage, context, subtotalOre, deliveryFeeOre } = input;
    if (!promotion) {
      return { discountOre: 0, freeDelivery: false };
    }
    this.assertRedeemable(promotion, usage ?? null, context, subtotalOre);

    if (promotion.type === "FREE_DELIVERY") {
      return {
        promotionId: promotion.id,
        code: promotion.code,
        discountOre: 0,
        freeDelivery: true,
      };
    }

    let discount = 0;
    if (promotion.type === "PERCENTAGE" && promotion.percentOff !== undefined) {
      discount = Math.round((subtotalOre * promotion.percentOff) / 100);
    } else if (promotion.amountOffOre !== undefined) {
      discount = promotion.amountOffOre;
    }

    const payable = subtotalOre + (input.promotion?.type === "FREE_DELIVERY" ? 0 : deliveryFeeOre);
    return {
      promotionId: promotion.id,
      code: promotion.code,
      discountOre: clampNonNegativeOre(Math.min(discount, payable)),
      freeDelivery: false,
    };
  }

  assertRedeemable(
    promotion: Promotion,
    usage: PromotionUsage | null,
    context: PromotionContext,
    subtotalOre: Ore,
  ): void {
    const at = context.at ?? new Date();
    if (!promotion.active) {
      throw new AppError("PROMOTION_INVALID", "This promotion is not active.");
    }
    if (promotion.startsAt && new Date(promotion.startsAt) > at) {
      throw new AppError("PROMOTION_INVALID", "This promotion is not active yet.");
    }
    if (promotion.expiresAt && new Date(promotion.expiresAt) < at) {
      throw new AppError("PROMOTION_INVALID", "This promotion has expired.");
    }
    if (promotion.memberOnly && !context.isMember) {
      throw new AppError("PROMOTION_INVALID", "This promotion is for members only.");
    }
    if (promotion.firstOrderOnly && !context.isFirstOrder) {
      throw new AppError("PROMOTION_INVALID", "This promotion is for first orders only.");
    }
    if (promotion.minimumOrderOre !== undefined && subtotalOre < promotion.minimumOrderOre) {
      throw new AppError("PROMOTION_INVALID", "Your order does not meet the promotion minimum.");
    }
    if (promotion.maxRedemptions !== undefined && promotion.redemptionCount >= promotion.maxRedemptions) {
      throw new AppError("PROMOTION_INVALID", "This promotion is no longer available.");
    }
    if (
      promotion.perCustomerLimit !== undefined &&
      (usage?.count ?? 0) >= promotion.perCustomerLimit
    ) {
      throw new AppError("PROMOTION_INVALID", "You have already used this promotion.");
    }
    if (promotion.percentOff !== undefined && (promotion.percentOff < 0 || promotion.percentOff > 100)) {
      throw new AppError("PROMOTION_INVALID", "Promotion configuration is invalid.");
    }
  }
}
