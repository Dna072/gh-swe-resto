export type RestaurantSettings = {
  restaurantId: string;
  orderingPaused: boolean;
  updatedAt: string;
};

export function defaultRestaurantSettings(restaurantId: string): RestaurantSettings {
  return {
    restaurantId,
    orderingPaused: false,
    updatedAt: new Date().toISOString(),
  };
}
