import { describe, expect, it } from "vitest";
import { authorizationService } from "@/domains/auth/authorization-service";

describe("AuthorizationService", () => {
  it("lets customers read their own profile and blocks others", () => {
    expect(() =>
      authorizationService.assertSelfOrStaff({ uid: "c1", role: "CUSTOMER" }, "c1", "customers:read"),
    ).not.toThrow();
    expect(() =>
      authorizationService.assertSelfOrStaff({ uid: "c2", role: "CUSTOMER" }, "c1", "customers:read"),
    ).toThrow(/permission/i);
  });
});
