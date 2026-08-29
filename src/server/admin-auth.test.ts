import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/errors";
import { requireAdmin } from "./admin-auth";

describe("requireAdmin", () => {
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
