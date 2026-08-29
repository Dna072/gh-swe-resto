import { AppError } from "@/lib/errors";
import { availabilityStatus } from "@/domains/menu/models";
import type { MenuRepository } from "@/domains/menu/repository";
import { PricingService } from "@/domains/pricing/service";
import type { PricingCalendar } from "@/domains/menu/models";
import { PromotionService } from "@/domains/promotions/service";
import type { PromotionRepository } from "@/domains/promotions/repository";
import type { CartQuote, CartQuoteRequest } from "./models";

const QUOTE_TTL_MS = 15 * 60 * 1000;

export class CartService {
  constructor(
    private readonly menu: MenuRepository,
    private readonly pricing: PricingService,
    private readonly promotions: PromotionService,
    private readonly promotionRepo: PromotionRepository,
    private readonly calendar: PricingCalendar,
  ) {}

  async quote(request: CartQuoteRequest): Promise<CartQuote> {
    if (request.lines.length === 0) {
      throw new AppError("VALIDATION", "Your cart is empty.");
    }
    const at = request.at ?? new Date();
    const pricedLines = [];
    for (const line of request.lines) {
      const item = await this.menu.getItem(request.restaurantId, line.menuItemId);
      if (!item || item.archivedAt) {
        throw new AppError("NOT_FOUND", "A meal in your cart is no longer available.");
      }
      const status = availabilityStatus(item);
      if (status === "SOLD_OUT" || status === "PAUSED") {
        throw new AppError("INSUFFICIENT_INVENTORY", `${item.name} is not available right now.`);
      }
      const groups = await this.menu.listModifierGroups(request.restaurantId, item.modifierGroupIds);
      const modifiers = this.pricing.priceModifiers(groups, line.modifiers);
      pricedLines.push(
        this.pricing.priceLine({
          item,
          quantity: line.quantity,
          modifiers,
          notes: line.notes,
          at,
          calendar: this.calendar,
        }),
      );
    }

    const promotion = request.promotionCode
      ? await this.promotionRepo.getByCode(request.restaurantId, request.promotionCode.trim().toUpperCase())
      : null;
    const context = {
      restaurantId: request.restaurantId,
      customerId: request.customerId,
      guestSessionId: request.guestSessionId,
      isMember: Boolean(request.isMember),
      isFirstOrder: Boolean(request.isFirstOrder),
      at,
    };
    const usage =
      promotion && (request.customerId || request.guestSessionId)
        ? await this.promotionRepo.getUsage(
            promotion.id,
            this.promotions.customerKey(context),
          )
        : null;
    const draftQuote = this.pricing.quote({
      lines: pricedLines,
      deliveryFeeOre: request.deliveryFeeOre ?? 0,
    });
    const discount = this.promotions.evaluate({
      promotion,
      usage,
      context,
      subtotalOre: draftQuote.subtotalOre,
      deliveryFeeOre: draftQuote.deliveryFeeOre,
    });
    const quote = this.pricing.quote({
      lines: pricedLines,
      deliveryFeeOre: draftQuote.deliveryFeeOre,
      discountOre: discount.discountOre,
      freeDelivery: discount.freeDelivery,
    });
    return {
      ...quote,
      promotionCode: discount.code,
      restaurantId: request.restaurantId,
      quotedAt: at.toISOString(),
      expiresAt: new Date(at.getTime() + QUOTE_TTL_MS).toISOString(),
    };
  }
}
