import { describe, expect, it } from "vitest";
import { isHeatGroup, spiceLevelOf } from "./spice-level";

describe("spiceLevelOf", () => {
  it("uses the catalog spiceLevel when present", () => {
    expect(spiceLevelOf({ id: "mild-shito", spiceLevel: 1 })).toBe(1);
    expect(spiceLevelOf({ id: "hot-shito", spiceLevel: 3 })).toBe(3);
  });

  it("falls back for older heat options without a stored level", () => {
    expect(spiceLevelOf({ id: "mild-shito" })).toBe(1);
    expect(spiceLevelOf({ id: "hot-shito" })).toBe(3);
    expect(spiceLevelOf({ id: "chicken" })).toBeUndefined();
  });

  it("recognises the heat modifier group", () => {
    expect(isHeatGroup("heat")).toBe(true);
    expect(isHeatGroup("protein")).toBe(false);
  });
});
