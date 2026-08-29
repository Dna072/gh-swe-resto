import type { PublicMenuItem } from "./public";

export function soldOut(item: PublicMenuItem): boolean {
  return item.availability === "SOLD_OUT" || item.availability === "PAUSED";
}

export function lowStockLabel(item: PublicMenuItem): string | undefined {
  if (item.availability !== "LOW_STOCK" || item.remainingPortions === null) {
    return undefined;
  }
  return `${item.remainingPortions} left`;
}
