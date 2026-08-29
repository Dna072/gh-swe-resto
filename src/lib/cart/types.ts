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
  modifiers: CartModifierSelection[];
  notes?: string;
};

export type PersistedCart = {
  restaurantId: string;
  lines: CartLine[];
};
