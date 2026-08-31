import { describe, expect, it } from "vitest";
import { secretsMatch } from "./secret-compare";

describe("secretsMatch", () => {
  it("accepts equal values and rejects mismatches without throwing on length", () => {
    expect(secretsMatch("dev-admin-token", "dev-admin-token")).toBe(true);
    expect(secretsMatch("dev-admin-token", "other-token-value")).toBe(false);
    expect(secretsMatch("short", "much-longer-secret")).toBe(false);
  });
});
