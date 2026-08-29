import { describe, expect, it } from "vitest";
import { applyInventoryDelta, InventoryService } from "./service";
import { inventory } from "../../../tests/unit/fixtures";

describe("InventoryService", () => {
  it("never allows negative inventory", () => {
    expect(() => applyInventoryDelta(inventory("tilapia", 1), -2)).toThrow(/sold out/i);
  });

  it("decrements the last portion exactly once", () => {
    const service = new InventoryService();
    const [updated] = service.reserve([inventory("tilapia", 1)], [{ sku: "tilapia", quantity: 1 }]);
    expect(updated?.availableQuantity).toBe(0);
  });
});
