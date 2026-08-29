import sharp from "sharp";
import { AppError } from "@/lib/errors";
import { newId } from "@/lib/ids";
import { nowIso } from "@/lib/time";
import type { ImageVariantKind, ImageVariantRef, MenuItemImage } from "@/domains/menu/models";
import type { BinaryObjectStorage } from "@/infrastructure/storage/object-storage";
import { homepageMediaPath, mediaObjectPath } from "./paths";
import { assertSafeImageUpload, extensionFor, MIN_MEAL_EDGE } from "./validate";

const VARIANT_WIDTHS: Array<{ kind: ImageVariantKind; width?: number }> = [
  { kind: "thumbnail", width: 320 },
  { kind: "card", width: 960 },
  { kind: "menu", width: 1200 },
  { kind: "hero", width: 1920 },
];

export class MediaService {
  constructor(private readonly storage: BinaryObjectStorage) {}

  async ingestPhotograph(input: {
    bytes: Buffer;
    declaredType?: string;
    altText: string;
    restaurantId: string;
    menuItemId?: string;
    scope: "menu" | "homepage";
    isPrimary?: boolean;
  }): Promise<MenuItemImage> {
    const kind = assertSafeImageUpload(input.bytes, input.declaredType);
    const meta = await sharp(input.bytes).metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    if (width < MIN_MEAL_EDGE || height < MIN_MEAL_EDGE) {
      throw new AppError("VALIDATION", `Photographs must be at least ${MIN_MEAL_EDGE}px on each side.`);
    }

    const assetId = newId();
    const extension = extensionFor(kind);
    const originalPath =
      input.scope === "homepage"
        ? homepageMediaPath({
            restaurantId: input.restaurantId,
            assetId,
            variant: "original",
            extension,
          })
        : mediaObjectPath({
            restaurantId: input.restaurantId,
            menuItemId: input.menuItemId ?? "unassigned",
            assetId,
            variant: "original",
            extension,
          });

    const original = await this.storage.put({
      path: originalPath,
      bytes: input.bytes,
      contentType: `image/${kind === "jpeg" ? "jpeg" : kind}`,
    });

    const variants: ImageVariantRef[] = [
      {
        kind: "original",
        storagePath: original.path,
        url: original.url,
        width,
        height,
      },
    ];

    for (const variant of VARIANT_WIDTHS) {
      const resized = await sharp(input.bytes)
        .rotate()
        .resize({ width: variant.width, withoutEnlargement: true })
        .webp({ quality: 74 })
        .toBuffer();
      const info = await sharp(resized).metadata();
      const variantPath =
        input.scope === "homepage"
          ? homepageMediaPath({
              restaurantId: input.restaurantId,
              assetId,
              variant: variant.kind,
              extension: "webp",
            })
          : mediaObjectPath({
              restaurantId: input.restaurantId,
              menuItemId: input.menuItemId ?? "unassigned",
              assetId,
              variant: variant.kind,
              extension: "webp",
            });
      const stored = await this.storage.put({
        path: variantPath,
        bytes: resized,
        contentType: "image/webp",
      });
      variants.push({
        kind: variant.kind,
        storagePath: stored.path,
        url: stored.url,
        width: info.width ?? variant.width ?? width,
        height: info.height ?? height,
      });
    }

    const now = nowIso();
    const card = variants.find((entry) => entry.kind === "card") ?? original;
    return {
      id: assetId,
      storagePath: card.path,
      url: card.url,
      alt: input.altText,
      altText: input.altText,
      width: card.width,
      height: card.height,
      isPrimary: Boolean(input.isPrimary),
      sortOrder: 0,
      status: "ACTIVE",
      variants,
      createdAt: now,
      updatedAt: now,
    };
  }

  retire(image: MenuItemImage): MenuItemImage {
    return {
      ...image,
      status: "PENDING_DELETE",
      updatedAt: nowIso(),
    };
  }
}
