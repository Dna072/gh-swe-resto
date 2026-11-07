export type RestaurantSettings = {
  restaurantId: string;
  orderingPaused: boolean;
  /** Swish payee number shown when an order uses manual payment. */
  swishPayee?: string;
  /** Optional public URL to a Swish QR image. */
  swishQrUrl?: string;
  updatedAt: string;
};

export function defaultRestaurantSettings(restaurantId: string): RestaurantSettings {
  return {
    restaurantId,
    orderingPaused: false,
    swishPayee: "123 456 78 90",
    swishQrUrl: undefined,
    updatedAt: new Date().toISOString(),
  };
}
