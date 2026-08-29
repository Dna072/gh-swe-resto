import { describe, expect, it } from "vitest";
import { itemCount, lineSignature } from "./storage";

describe("cart storage helpers", () => {
  it("treats the same meal and modifiers as one line", () => {
    const left = {
      menuItemId: "jollof",
      modifiers: [
        { groupId: "heat", optionId: "hot-shito", quantity: 1 },
        { groupId: "protein", optionId: "chicken", quantity: 1 },
      ],
    };
    const right = {
      menuItemId: "jollof",
      modifiers: [
        { groupId: "protein", optionId: "chicken", quantity: 1 },
        { groupId: "heat", optionId: "hot-shito", quantity: 1 },
      ],
    };
    expect(lineSignature(left)).toBe(lineSignature(right));
    expect(itemCount([{ id: "1", slug: "jollof-rice", name: "Jollof", quantity: 2, ...left }])).toBe(2);
  });
});
