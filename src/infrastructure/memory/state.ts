import type { Customer, CustomerAddress } from "@/domains/customers/models";
import type { InventoryItem } from "@/domains/inventory/models";
import type { MenuCategory, MenuItem, ModifierGroup } from "@/domains/menu/models";
import type { Membership, Plan } from "@/domains/memberships/models";
import type { Order } from "@/domains/orders/models";
import type { Promotion, PromotionUsage } from "@/domains/promotions/models";
import type { PrintJob } from "@/domains/printing/models";

export interface MemoryState {
  categories: MenuCategory[];
  items: MenuItem[];
  modifierGroups: ModifierGroup[];
  inventory: InventoryItem[];
  promotions: Promotion[];
  promotionUsages: PromotionUsage[];
  orders: Order[];
  customers: Customer[];
  addresses: CustomerAddress[];
  memberships: Membership[];
  plans: Plan[];
  printJobs: PrintJob[];
  idempotency: Map<string, string>;
  sequences: Map<string, number>;
  webhookEvents: Set<string>;
  notificationKeys: Set<string>;
}

export function createMemoryState(seed: Partial<MemoryState> = {}): MemoryState {
  return {
    categories: [],
    items: [],
    modifierGroups: [],
    inventory: [],
    promotions: [],
    promotionUsages: [],
    orders: [],
    customers: [],
    addresses: [],
    memberships: [],
    plans: [],
    printJobs: [],
    idempotency: new Map(),
    sequences: new Map(),
    webhookEvents: new Set(),
    notificationKeys: new Set(),
    ...seed,
  };
}
