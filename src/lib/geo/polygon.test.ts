import { describe, expect, it } from "vitest";
import { isValidPolygon, pointInPolygon, uniqueVertices } from "./polygon";

const square = [
  { lat: 59.85, lng: 17.62 },
  { lat: 59.85, lng: 17.66 },
  { lat: 59.87, lng: 17.66 },
  { lat: 59.87, lng: 17.62 },
];

describe("polygon helpers", () => {
  it("treats a closed ring as the same shape", () => {
    expect(uniqueVertices([...square, square[0]!])).toEqual(square);
    expect(isValidPolygon(square)).toBe(true);
    expect(isValidPolygon(square.slice(0, 2))).toBe(false);
  });

  it("detects points inside and outside a delivery area", () => {
    expect(pointInPolygon({ lat: 59.86, lng: 17.64 }, square)).toBe(true);
    expect(pointInPolygon({ lat: 59.88, lng: 17.64 }, square)).toBe(false);
    expect(pointInPolygon({ lat: 59.33, lng: 18.06 }, square)).toBe(false);
  });
});
