import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /api/health", () => {
  it("reports liveness for Cloud Run probes", async () => {
    const response = await GET();
    const body = (await response.json()) as { ok: boolean; dataStore?: string };
    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.dataStore === "memory" || body.dataStore === "firestore").toBe(true);
  });
});
