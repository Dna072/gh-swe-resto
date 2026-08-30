import { describe, expect, it } from "vitest";
import type { MenuItemImage } from "@/domains/menu/models";
import { imageAlt, imageUrl, objectPosition, primaryImage } from "./display";

const card: MenuItemImage = {
  id: "a",
  storagePath: "restaurants/uppsala-main/menu/jollof/a-card.webp",
  url: "/uploads/restaurants/uppsala-main/menu/jollof/a-card.webp",
  alt: "Jollof rice served with grilled chicken",
  altText: "Jollof rice served with grilled chicken",
  isPrimary: true,
  sortOrder: 0,
  status: "ACTIVE",
  focalPointX: 0.4,
  focalPointY: 0.3,
  variants: [
    {
      kind: "card",
      storagePath: "restaurants/uppsala-main/menu/jollof/a-card.webp",
      url: "/uploads/restaurants/uppsala-main/menu/jollof/a-card.webp",
      width: 960,
      height: 720,
    },
  ],
};

describe("media display helpers", () => {
  it("prefers the primary active image", () => {
    const retired: MenuItemImage = { ...card, id: "old", isPrimary: true, status: "PENDING_DELETE" };
    const secondary: MenuItemImage = { ...card, id: "b", isPrimary: false, sortOrder: 1 };
    expect(primaryImage([retired, secondary, card])?.id).toBe("a");
  });

  it("serves local uploads through the media route", () => {
    expect(imageUrl(card, "card")).toBe("/api/media/restaurants/uppsala-main/menu/jollof/a-card.webp");
    expect(
      imageUrl({
        ...card,
        url: "/api/media/restaurants/uppsala-main/menu/jollof/a-card.webp",
        variants: [
          {
            kind: "card",
            storagePath: "restaurants/uppsala-main/menu/jollof/a-card.webp",
            url: "/api/media/restaurants/uppsala-main/menu/jollof/a-card.webp",
            width: 960,
            height: 720,
          },
        ],
      }),
    ).toBe("/api/media/restaurants/uppsala-main/menu/jollof/a-card.webp");
  });

  it("returns null when no photograph is published", () => {
    expect(imageUrl(undefined)).toBeNull();
    expect(imageUrl({ ...card, status: "PENDING_DELETE" })).toBeNull();
  });

  it("uses meal-describing alt text", () => {
    expect(imageAlt(card, "Jollof Rice")).toBe("Jollof rice served with grilled chicken");
    expect(imageAlt(undefined, "Jollof Rice")).toBe("Jollof Rice");
  });

  it("maps focal points to object-position", () => {
    expect(objectPosition(card)).toBe("40% 30%");
  });
});
