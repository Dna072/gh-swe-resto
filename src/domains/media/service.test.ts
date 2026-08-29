import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { LocalObjectStorage } from "@/infrastructure/storage/local-storage";
import { MediaService } from "./service";

describe("MediaService", () => {
  it("stores metadata and WebP variants, not a raw user filename", async () => {
    const bytes = await sharp({
      create: { width: 800, height: 600, channels: 3, background: { r: 196, g: 165, b: 116 } },
    })
      .jpeg()
      .toBuffer();
    const root = await mkdtemp(path.join(tmpdir(), "media-"));
    const media = new MediaService(new LocalObjectStorage(root));
    const image = await media.ingestPhotograph({
      bytes,
      declaredType: "image/jpeg",
      altText: "Neutral development placeholder, not a meal photograph",
      restaurantId: "uppsala-main",
      menuItemId: "jollof",
      scope: "menu",
      isPrimary: true,
    });
    expect(image.url).not.toMatch(/user-upload/i);
    expect(image.storagePath).toMatch(/^restaurants\/uppsala-main\/menu\/jollof\//);
    expect(image.variants?.map((variant) => variant.kind)).toEqual(
      expect.arrayContaining(["original", "thumbnail", "card", "menu", "hero"]),
    );
    expect(image.status).toBe("ACTIVE");
    expect(media.retire(image).status).toBe("PENDING_DELETE");
  });
});
