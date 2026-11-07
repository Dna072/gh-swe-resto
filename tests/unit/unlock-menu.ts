import type { MenuWriteRepository } from "@/domains/menu/write-repository";

/** Clears coming-soon so checkout/cart integration tests can order seeded meals. */
export async function unlockMenuItems(
  menu: MenuWriteRepository,
  restaurantId: string,
  itemIds: string[],
): Promise<void> {
  for (const itemId of itemIds) {
    const item = await menu.getItem(restaurantId, itemId);
    if (!item) {
      throw new Error(`Missing menu item ${itemId}`);
    }
    await menu.saveItem({
      ...item,
      comingSoon: false,
      paymentMode: item.paymentMode ?? "ONLINE",
      updatedAt: new Date().toISOString(),
    });
  }
}
