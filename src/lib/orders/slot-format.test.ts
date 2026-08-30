import { describe, expect, it } from "vitest";
import { formatSlot } from "./slot-format";

describe("formatSlot", () => {
  it("formats a Stockholm delivery slot for staff and guests", () => {
    expect(formatSlot("2026-08-31T10:00:00.000Z", "en")).toMatch(/12:00/);
    expect(formatSlot("2026-08-31T17:00:00.000Z", "sv")).toMatch(/19:00/);
    expect(formatSlot(undefined)).toBe("");
  });
});
