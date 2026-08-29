import type { Ore } from "@/lib/money";
import type { PricingCalendar } from "@/domains/menu/models";

export interface PricedModifier {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  quantity: number;
  unitPriceOre: Ore;
}

export interface PricedLine {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPriceOre: Ore;
  modifiers: PricedModifier[];
  notes?: string;
  modifierTotalOre: Ore;
  lineTotalOre: Ore;
  inventorySku?: string;
  inventoryTracked: boolean;
}

export interface PriceQuote {
  lines: PricedLine[];
  subtotalOre: Ore;
  deliveryFeeOre: Ore;
  discountTotalOre: Ore;
  taxTotalOre: Ore;
  totalOre: Ore;
  currency: "SEK";
  freeDelivery: boolean;
  promotionCode?: string;
}

export interface PricingRequest {
  lines: PricedLine[];
  deliveryFeeOre: Ore;
  discountOre?: Ore;
  freeDelivery?: boolean;
}

export type { PricingCalendar };
