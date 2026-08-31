import { describe, expect, it } from "vitest";
import { AuthorizationService } from "@/domains/auth/authorization-service";
import { hasPermission } from "./rbac";

const authz = new AuthorizationService();

describe("RBAC", () => {
  it("does not treat frontend visibility as authorization", () => {
    expect(hasPermission("CUSTOMER", "orders:refund")).toBe(false);
    expect(hasPermission("KITCHEN", "orders:refund")).toBe(false);
    expect(hasPermission("FINANCE", "orders:refund")).toBe(true);
    expect(hasPermission("OWNER", "users:write")).toBe(true);
    expect(hasPermission("MANAGER", "users:write")).toBe(true);
    expect(hasPermission("KITCHEN", "users:write")).toBe(false);
  });

  it("blocks guests from staff actions", () => {
    expect(() => authz.requirePermission({ role: "CUSTOMER" }, "menu:write")).toThrow(/Sign in/i);
    expect(() =>
      authz.requirePermission({ uid: "c1", role: "CUSTOMER" }, "inventory:adjust"),
    ).toThrow(/permission/i);
  });

  it("allows kitchen staff to transition orders", () => {
    expect(() =>
      authz.requirePermission({ uid: "k1", role: "KITCHEN" }, "orders:transition"),
    ).not.toThrow();
  });
});
