import { describe, expect, it } from "vitest";
import { defaultHomepageContent } from "./defaults";

describe("homepage defaults", () => {
  it("ships without a hard-coded food photograph", () => {
    const homepage = defaultHomepageContent("uppsala-main");
    expect(homepage.hero.image).toBeUndefined();
    expect(homepage.featuredMealIds).toContain("jollof");
    expect(homepage.hero.title).toMatch(/Meridian Fusion/i);
  });
});
