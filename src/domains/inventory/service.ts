import { AppError } from "@/lib/errors";
import type { InventoryItem, InventoryReservation } from "./models";

export function applyInventoryDelta(item: InventoryItem, delta: number): InventoryItem {
  const next = item.availableQuantity + delta;
  if (next < 0) {
    throw new AppError(
      "INSUFFICIENT_INVENTORY",
      `${item.name} is sold out or does not have enough portions left.`,
      { sku: item.sku, requestedDelta: delta, available: item.availableQuantity },
    );
  }
  return {
    ...item,
    availableQuantity: next,
    updatedAt: new Date().toISOString(),
  };
}

export function reserveInventory(
  items: Map<string, InventoryItem>,
  reservations: InventoryReservation[],
): Map<string, InventoryItem> {
  const next = new Map(items);
  for (const reservation of reservations) {
    const item = next.get(reservation.sku);
    if (!item || !item.tracked) {
      continue;
    }
    if (!Number.isInteger(reservation.quantity) || reservation.quantity < 1) {
      throw new AppError("VALIDATION", "Inventory reservation quantity is invalid.");
    }
    next.set(reservation.sku, applyInventoryDelta(item, -reservation.quantity));
  }
  return next;
}

export class InventoryService {
  applyDelta(item: InventoryItem, delta: number): InventoryItem {
    return applyInventoryDelta(item, delta);
  }

  reserve(items: InventoryItem[], reservations: InventoryReservation[]): InventoryItem[] {
    const map = new Map(items.map((item) => [item.sku, item]));
    return [...reserveInventory(map, reservations).values()];
  }
}
