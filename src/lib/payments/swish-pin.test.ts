import { describe, expect, it } from "vitest";
import { generateSwishPin, isValidSwishPin, normalizeSwishPin } from "./swish-pin";

describe("swish pin", () => {
  it("creates a four-character pin from the safe alphabet", () => {
    let cursor = 0;
    const sequence = [0, 0.1, 0.5, 0.99];
    const pin = generateSwishPin(() => sequence[cursor++] ?? 0);
    expect(pin).toHaveLength(4);
    expect(isValidSwishPin(pin)).toBe(true);
  });

  it("normalizes case for matching", () => {
    expect(normalizeSwishPin(" ab3k ")).toBe("AB3K");
    expect(isValidSwishPin("AB3K")).toBe(true);
    expect(isValidSwishPin("ABO1")).toBe(false);
  });
});
