import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/errors";
import { assertRateLimit, resetRateLimitForTests } from "./rate-limit";

describe("assertRateLimit", () => {
  it("allows a burst then blocks", () => {
    resetRateLimitForTests();
    assertRateLimit("test:ip", 2, 60_000);
    assertRateLimit("test:ip", 2, 60_000);
    expect(() => assertRateLimit("test:ip", 2, 60_000)).toThrow(AppError);
    try {
      assertRateLimit("test:ip", 2, 60_000);
    } catch (error) {
      expect(error).toMatchObject({ code: "RATE_LIMITED" });
    }
  });
});
