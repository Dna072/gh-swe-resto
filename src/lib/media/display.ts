import type { ImageVariantKind, MenuItemImage } from "@/domains/menu/models";

export function isActiveImage(image: MenuItemImage): boolean {
  return image.status !== "PENDING_DELETE";
}

export function primaryImage(images: MenuItemImage[]): MenuItemImage | undefined {
  return [...images]
    .filter(isActiveImage)
    .sort(
      (a, b) =>
        Number(Boolean(b.isPrimary)) - Number(Boolean(a.isPrimary)) || (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
    )[0];
}

export function imageAlt(image: MenuItemImage | undefined, fallback: string): string {
  return image?.altText || image?.alt || fallback;
}

export function imageUrl(
  image: MenuItemImage | undefined,
  preferred: ImageVariantKind = "card",
): string | null {
  if (!image || !isActiveImage(image)) {
    return null;
  }
  const variant = image.variants?.find((entry) => entry.kind === preferred) ?? image.variants?.[0];
  const candidate = variant?.url ?? image.url ?? image.storagePath;
  if (!candidate) {
    return null;
  }
  if (candidate.startsWith("/") || candidate.startsWith("https://") || candidate.startsWith("http://")) {
    return candidate;
  }
  return `/${candidate}`;
}

export function objectPosition(image: MenuItemImage | undefined): string | undefined {
  if (image?.focalPointX === undefined || image.focalPointY === undefined) {
    return undefined;
  }
  return `${Math.round(image.focalPointX * 100)}% ${Math.round(image.focalPointY * 100)}%`;
}
