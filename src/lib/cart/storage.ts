import type { CartLine, PersistedCart } from "./types";

export const CART_STORAGE_KEY = "ghana-restaurant.cart.v1";

export function emptyCart(restaurantId: string): PersistedCart {
  return { restaurantId, lines: [] };
}

export function lineSignature(line: Pick<CartLine, "menuItemId" | "modifiers" | "notes">): string {
  const modifiers = [...line.modifiers]
    .sort((a, b) => a.groupId.localeCompare(b.groupId) || a.optionId.localeCompare(b.optionId))
    .map((modifier) => `${modifier.groupId}:${modifier.optionId}:${modifier.quantity}`)
    .join("|");
  return `${line.menuItemId}::${modifiers}::${line.notes ?? ""}`;
}

export function itemCount(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function readCart(restaurantId: string): PersistedCart {
  if (typeof window === "undefined") {
    return emptyCart(restaurantId);
  }
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) {
      return emptyCart(restaurantId);
    }
    const parsed = JSON.parse(raw) as PersistedCart;
    if (parsed.restaurantId !== restaurantId || !Array.isArray(parsed.lines)) {
      return emptyCart(restaurantId);
    }
    return parsed;
  } catch {
    return emptyCart(restaurantId);
  }
}

export function writeCart(cart: PersistedCart): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}
