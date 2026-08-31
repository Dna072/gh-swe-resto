import { describe, expect, it } from "vitest";
import { MockGeocodingService } from "./mock";

describe("MockGeocodingService", () => {
  const geocoder = new MockGeocodingService();

  it("finds Swedish addresses including Å/Ä/Ö", async () => {
    const hits = await geocoder.searchAddress("Östra Ågatan");
    expect(hits.some((hit) => hit.description.includes("Östra Ågatan"))).toBe(true);
    const details = await geocoder.placeDetails("mock:Östra Ågatan 11");
    expect(details?.apartment).toBe("2 tr");
    expect(details?.line2).toBe("Lgh 1201");
    expect(details?.city).toBe("Uppsala");
  });

  it("returns nothing for a too-short or unknown query", async () => {
    expect(await geocoder.searchAddress("ab")).toEqual([]);
    expect(await geocoder.searchAddress("zzzz-unknown-place")).toEqual([]);
  });

  it("returns multiple matches for an ambiguous street fragment", async () => {
    const hits = await geocoder.searchAddress("Ågatan");
    expect(hits.length).toBeGreaterThan(1);
  });

  it("updates coordinates on reverse geocode after a pin move", async () => {
    const moved = await geocoder.reverseGeocode(59.86, 17.65);
    expect(moved?.lat).toBe(59.86);
    expect(moved?.lng).toBe(17.65);
    expect(moved?.formatted).toMatch(/59\.86/);
  });
});
