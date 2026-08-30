import { describe, expect, it } from "vitest";
import { allowLocalAdminBootstrap, isCloudRun } from "./runtime";

describe("runtime", () => {
  it("detects Cloud Run from K_SERVICE", () => {
    expect(isCloudRun({})).toBe(false);
    expect(isCloudRun({ K_SERVICE: "ghana-restaurant-showcase" })).toBe(true);
  });

  it("does not publish the local admin token on Cloud Run", () => {
    expect(
      allowLocalAdminBootstrap(
        { APP_ENV: "staging", ADMIN_DEV_TOKEN: "secret" },
        { K_SERVICE: "ghana-restaurant-showcase" },
      ),
    ).toBe(false);
    expect(allowLocalAdminBootstrap({ APP_ENV: "development", ADMIN_DEV_TOKEN: "secret" }, {})).toBe(true);
    expect(allowLocalAdminBootstrap({ APP_ENV: "production", ADMIN_DEV_TOKEN: "secret" }, {})).toBe(false);
  });
});
