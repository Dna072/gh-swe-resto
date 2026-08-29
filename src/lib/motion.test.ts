import { describe, expect, it } from "vitest";
import { revealVariants } from "./motion";

describe("revealVariants", () => {
  it("does not animate when the user prefers reduced motion", () => {
    expect(revealVariants(true)).toEqual({
      hidden: { opacity: 1, y: 0 },
      visible: { opacity: 1, y: 0 },
    });
  });
});
