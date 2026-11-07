import type { PublicMenuItem } from "./public";

export function soldOut(item: PublicMenuItem): boolean {
  return item.availability === "SOLD_OUT" || item.availability === "PAUSED";
}

export function comingSoon(item: PublicMenuItem): boolean {
  return item.availability === "COMING_SOON";
}

/** True when the guest cannot add the plate to the cart. */
export function notOrderable(item: PublicMenuItem): boolean {
  return soldOut(item) || comingSoon(item);
}

export function lowStockLabel(item: PublicMenuItem): string | undefined {
  if (item.availability !== "LOW_STOCK" || item.remainingPortions === null) {
    return undefined;
  }
  return `${item.remainingPortions} left`;
}
