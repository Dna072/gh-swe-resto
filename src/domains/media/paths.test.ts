import { describe, expect, it } from "vitest";
import { homepageMediaPath, mediaObjectPath } from "./paths";

describe("controlled media paths", () => {
  it("builds a restaurant menu object path", () => {
    expect(
      mediaObjectPath({
        restaurantId: "uppsala-main",
        menuItemId: "jollof",
        assetId: "asset1",
        variant: "card",
        extension: "webp",
      }),
    ).toBe("restaurants/uppsala-main/menu/jollof/asset1-card.webp");
  });

  it("rejects path traversal", () => {
    expect(() =>
      mediaObjectPath({
        restaurantId: "uppsala-main",
        menuItemId: "../etc",
        assetId: "asset1",
        variant: "card",
        extension: "webp",
      }),
    ).toThrow(/Unsafe media path/);
  });

  it("builds a homepage object path", () => {
    expect(
      homepageMediaPath({
        restaurantId: "uppsala-main",
        assetId: "hero1",
        variant: "hero",
        extension: "webp",
      }),
    ).toBe("restaurants/uppsala-main/homepage/hero1-hero.webp");
  });
});
