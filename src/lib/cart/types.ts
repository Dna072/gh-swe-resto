export type CartModifierSelection = {
  groupId: string;
  optionId: string;
  quantity: number;
};

export type CartLine = {
  id: string;
  menuItemId: string;
  slug: string;
  name: string;
  quantity: number;
  /** Snapshot of the meal minimum when the line was added. */
  minOrderQuantity?: number;
  modifiers: CartModifierSelection[];
  notes?: string;
};

export type PersistedCart = {
  restaurantId: string;
  lines: CartLine[];
};
