import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/errors";
import { resetEnvCache } from "@/lib/env";
import { requireAdmin } from "./admin-auth";

describe("requireAdmin", () => {
  it("accepts the local development admin token", async () => {
    resetEnvCache();
    const actor = await requireAdmin(
      new Request("http://localhost/api/admin/menu", {
        headers: { Authorization: "Bearer dev-admin-token" },
      }),
      "menu:write",
    );
    expect(actor.role).toBe("OWNER");
  });

  it("accepts X-Admin-Token so Cloud Run does not intercept Authorization", async () => {
    resetEnvCache();
    const actor = await requireAdmin(
      new Request("http://localhost/api/admin/menu", {
        headers: { "X-Admin-Token": "dev-admin-token" },
      }),
      "menu:write",
    );
    expect(actor.uid).toBe("admin-dev");
  });

  it("rejects a missing bearer token", async () => {
    await expect(requireAdmin(new Request("http://localhost/api/admin/menu"), "menu:read")).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("rejects a non-session token without leaking an internal error", async () => {
    try {
      await requireAdmin(
        new Request("http://localhost/api/admin/menu", {
          headers: { Authorization: "Bearer not-a-firebase-token" },
        }),
        "menu:read",
      );
      throw new Error("expected unauthorized");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("UNAUTHORIZED");
    }
  });
});
