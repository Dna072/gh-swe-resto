import { AppError } from "@/lib/errors";
import { addOre, clampNonNegativeOre, multiplyOre, type Ore } from "@/lib/money";
import { isWeekendDay, weekdayInTimeZone } from "@/lib/time";
import type { MenuItem, ModifierGroup, PricingCalendar } from "@/domains/menu/models";
import type { PricedLine, PricedModifier, PriceQuote, PricingRequest } from "./models";

const DEFAULT_CALENDAR: PricingCalendar = {
  timeZone: "Europe/Stockholm",
  weekendDays: ["saturday", "sunday"],
};

export class PricingService {
  resolveItemPrice(item: MenuItem, at: Date, calendar: PricingCalendar = DEFAULT_CALENDAR): Ore {
    const day = weekdayInTimeZone(at, calendar.timeZone);
    if (isWeekendDay(day, calendar.weekendDays) && item.weekendPriceOre !== undefined) {
      return item.weekendPriceOre;
    }
    if (item.weekdayPriceOre !== undefined) {
      return item.weekdayPriceOre;
    }
    return item.basePriceOre;
  }

  priceModifiers(
    groups: ModifierGroup[],
    selections: Array<{ groupId: string; optionId: string; quantity: number }>,
  ): PricedModifier[] {
    const priced: PricedModifier[] = [];
    const selectedByGroup = new Map<string, typeof selections>();
    for (const selection of selections) {
      const current = selectedByGroup.get(selection.groupId) ?? [];
      current.push(selection);
      selectedByGroup.set(selection.groupId, current);
    }

    for (const group of groups) {
      const groupSelections = selectedByGroup.get(group.id) ?? [];
      const totalSelected = groupSelections.length;
      if (group.required && totalSelected < group.minSelections) {
        throw new AppError("VALIDATION", `Please choose options for ${group.name}.`);
      }
      if (totalSelected < group.minSelections || totalSelected > group.maxSelections) {
        throw new AppError("VALIDATION", `${group.name} selection is outside the allowed range.`);
      }
      for (const selection of groupSelections) {
        const option = group.options.find((candidate) => candidate.id === selection.optionId);
        if (!option || !option.isAvailable) {
          throw new AppError("VALIDATION", `An extra for ${group.name} is no longer available.`);
        }
        if (!Number.isInteger(selection.quantity) || selection.quantity < 1) {
          throw new AppError("VALIDATION", "Modifier quantity is invalid.");
        }
        if (!option.allowsQuantity && selection.quantity !== 1) {
          throw new AppError("VALIDATION", `${option.name} cannot have a custom quantity.`);
        }
        if (option.maxQuantity !== undefined && selection.quantity > option.maxQuantity) {
          throw new AppError("VALIDATION", `${option.name} exceeds the allowed quantity.`);
        }
        priced.push({
          groupId: group.id,
          groupName: group.name,
          optionId: option.id,
          optionName: option.name,
          quantity: selection.quantity,
          unitPriceOre: option.priceOre,
        });
      }
    }
    return priced;
  }

  priceLine(input: {
    item: MenuItem;
    quantity: number;
    modifiers: PricedModifier[];
    notes?: string;
    at: Date;
    calendar?: PricingCalendar;
  }): PricedLine {
    if (!Number.isInteger(input.quantity) || input.quantity < 1) {
      throw new AppError("VALIDATION", "Item quantity must be at least 1.");
    }
    const unitPriceOre = this.resolveItemPrice(input.item, input.at, input.calendar);
    const modifierTotalOre = input.modifiers.reduce(
      (sum, modifier) => sum + multiplyOre(modifier.unitPriceOre, modifier.quantity),
      0,
    );
    return {
      menuItemId: input.item.id,
      name: input.item.name,
      quantity: input.quantity,
      unitPriceOre,
      modifiers: input.modifiers,
      notes: input.notes,
      modifierTotalOre,
      lineTotalOre: multiplyOre(addOre(unitPriceOre, modifierTotalOre), input.quantity),
      inventorySku: input.item.inventorySku,
      inventoryTracked: input.item.inventoryTracked,
    };
  }

  quote(request: PricingRequest): PriceQuote {
    const subtotalOre = request.lines.reduce((sum, line) => sum + line.lineTotalOre, 0);
    const deliveryFeeOre = request.freeDelivery ? 0 : request.deliveryFeeOre;
    const discountTotalOre = clampNonNegativeOre(
      Math.min(request.discountOre ?? 0, addOre(subtotalOre, deliveryFeeOre)),
    );
    const totalOre = clampNonNegativeOre(addOre(subtotalOre, deliveryFeeOre) - discountTotalOre);
    return {
      lines: request.lines,
      subtotalOre,
      deliveryFeeOre,
      discountTotalOre,
      taxTotalOre: 0,
      totalOre,
      currency: "SEK",
      freeDelivery: Boolean(request.freeDelivery),
    };
  }
}
