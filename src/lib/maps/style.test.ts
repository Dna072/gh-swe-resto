import { afterEach, describe, expect, it, vi } from "vitest";
import { mapRuntimeConfig, maptilerStreetsStyleUrl, redactMapUrl, resolveMapStyle } from "./style";

describe("mapRuntimeConfig", () => {
  it("prefers an explicit style URL", () => {
    expect(
      mapRuntimeConfig({
        NEXT_PUBLIC_MAP_STYLE_URL: "https://example.com/style.json",
        NEXT_PUBLIC_MAPTILER_KEY: "public",
        MAPTILER_API_KEY: "server",
      }),
    ).toEqual({
      provider: "custom",
      styleUrl: "https://example.com/style.json",
      source: "NEXT_PUBLIC_MAP_STYLE_URL",
    });
  });

  it("uses the public MapTiler key before the server key", () => {
    expect(
      mapRuntimeConfig({
        NEXT_PUBLIC_MAPTILER_KEY: "public",
        MAPTILER_API_KEY: "server",
      }),
    ).toEqual({
      provider: "maptiler",
      styleUrl: maptilerStreetsStyleUrl("public"),
      source: "NEXT_PUBLIC_MAPTILER_KEY",
    });
  });

  it("uses the server MapTiler key when the public key is missing", () => {
    expect(mapRuntimeConfig({ MAPTILER_API_KEY: "server" })).toEqual({
      provider: "maptiler",
      styleUrl: maptilerStreetsStyleUrl("server"),
      source: "MAPTILER_API_KEY",
    });
  });

  it("falls back to OpenFreeMap when no key is set", () => {
    const config = mapRuntimeConfig({});
    expect(config.provider).toBe("openfreemap");
    expect(config.source).toBe("openfreemap");
    expect(config.styleUrl).toContain("openfreemap.org");
  });
});

describe("redactMapUrl", () => {
  it("hides MapTiler keys in logs", () => {
    const url = maptilerStreetsStyleUrl("vif-secret-key");
    const redacted = redactMapUrl(url);
    expect(redacted).toContain("key=REDACTED");
    expect(redacted).not.toContain("vif-secret-key");
  });
});

describe("resolveMapStyle", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the style URL when fetch succeeds", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200 }));
    const result = await resolveMapStyle("https://example.com/style.json");
    expect(result.usedFallback).toBe(false);
    expect(result.style).toBe("https://example.com/style.json");
    expect(result.fetchStatus).toBe(200);
  });

  it("returns OSM raster tiles when the style URL cannot be fetched", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("blocked by CSP")));
    const result = await resolveMapStyle("https://example.com/style.json");
    expect(result.usedFallback).toBe(true);
    expect(result.fetchError).toMatch(/blocked by CSP/);
    expect(result.style).toMatchObject({ version: 8 });
  });

  it("returns OSM raster tiles when the style URL is HTTP 403", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403 }));
    const result = await resolveMapStyle("https://api.maptiler.com/maps/streets-v2/style.json?key=bad");
    expect(result.usedFallback).toBe(true);
    expect(result.fetchStatus).toBe(403);
  });
});
