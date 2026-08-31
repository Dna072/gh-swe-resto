import { describe, expect, it } from "vitest";
import { isTileNetworkError } from "./diagnostics";

describe("isTileNetworkError", () => {
  it("treats fetch and HTTP failures as recoverable tile errors", () => {
    expect(isTileNetworkError("Failed to fetch")).toBe(true);
    expect(isTileNetworkError("AJAXError: 403")).toBe(true);
    expect(isTileNetworkError("Failed to load tile 12/2232/1365")).toBe(true);
  });

  it("ignores drawing-layer GeoJSON sources", () => {
    expect(isTileNetworkError("Failed to fetch", "delivery-zones")).toBe(false);
    expect(isTileNetworkError("Failed to fetch", "delivery-draft")).toBe(false);
  });

  it("ignores unrelated MapLibre messages", () => {
    expect(isTileNetworkError("Layer is not in layout")).toBe(false);
  });
});
