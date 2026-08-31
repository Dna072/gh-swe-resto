import { describe, expect, it } from "vitest";
import { adminAppHost, isAdminAppHost, isKitchenAppHost, kitchenAppHost, publicAppHost } from "./hosts";
import { resetEnvCache } from "@/lib/env";

describe("app hosts", () => {
  it("defaults to mfcuisine.se storefront, admin, and kitchen hosts", () => {
    resetEnvCache();
    expect(publicAppHost()).toBe("mfcuisine.se");
    expect(adminAppHost()).toBe("admin.mfcuisine.se");
    expect(kitchenAppHost()).toBe("kitchen.mfcuisine.se");
    expect(isAdminAppHost("admin.mfcuisine.se")).toBe(true);
    expect(isAdminAppHost("admin.localhost:3000")).toBe(true);
    expect(isKitchenAppHost("kitchen.mfcuisine.se")).toBe(true);
    expect(isAdminAppHost("mfcuisine.se")).toBe(false);
  });
});
