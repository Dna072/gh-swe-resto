import { afterEach, describe, expect, it } from "vitest";
import {
  adminFetch,
  clearAdminToken,
  getAdminToken,
  hasAdminToken,
  setAdminToken,
  subscribeAdminToken,
} from "./client";

function mockSessionStorage() {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: globalThis,
  });
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    },
  });
}

describe("admin token store", () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, "sessionStorage");
    Reflect.deleteProperty(globalThis, "window");
  });

  it("reads nothing on the server", () => {
    expect(getAdminToken()).toBe("");
    expect(hasAdminToken()).toBe(false);
  });

  it("notifies subscribers when a token is saved or cleared", () => {
    mockSessionStorage();
    const seen: boolean[] = [];
    const unsubscribe = subscribeAdminToken(() => {
      seen.push(hasAdminToken());
    });
    setAdminToken("dev-admin-token");
    expect(getAdminToken()).toBe("dev-admin-token");
    clearAdminToken();
    expect(hasAdminToken()).toBe(false);
    unsubscribe();
    expect(seen).toEqual([true, false]);
  });

  it("refuses admin requests until a token is saved", async () => {
    await expect(adminFetch("/api/admin/menu")).rejects.toThrow(/Use token/i);
  });

  it("sends X-Admin-Token instead of Authorization", async () => {
    mockSessionStorage();
    setAdminToken("showcase-admin-token");
    const seen: string[] = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      seen.push(headers.get("X-Admin-Token") ?? "");
      seen.push(headers.get("Authorization") ?? "");
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as typeof fetch;
    try {
      await adminFetch("/api/admin/menu");
      expect(seen).toEqual(["showcase-admin-token", ""]);
    } finally {
      globalThis.fetch = originalFetch;
      clearAdminToken();
    }
  });
});
