const SAFE_SEGMENT = /^[a-zA-Z0-9._-]+$/;

export function mediaObjectPath(input: {
  restaurantId: string;
  menuItemId: string;
  assetId: string;
  variant: string;
  extension: string;
}): string {
  for (const [key, value] of Object.entries(input)) {
    if (!SAFE_SEGMENT.test(value)) {
      throw new Error(`Unsafe media path segment: ${key}`);
    }
  }
  return `restaurants/${input.restaurantId}/menu/${input.menuItemId}/${input.assetId}-${input.variant}.${input.extension}`;
}

export function homepageMediaPath(input: {
  restaurantId: string;
  assetId: string;
  variant: string;
  extension: string;
}): string {
  for (const [key, value] of Object.entries(input)) {
    if (!SAFE_SEGMENT.test(value)) {
      throw new Error(`Unsafe media path segment: ${key}`);
    }
  }
  return `restaurants/${input.restaurantId}/homepage/${input.assetId}-${input.variant}.${input.extension}`;
}
