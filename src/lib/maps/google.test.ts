import { describe, expect, it } from "vitest";
import { googleMapsBrowserConfig, googleMapsConfigHint, redactMapSecret } from "./google";

describe("googleMapsBrowserConfig", () => {
  it("prefers the dedicated browser key", () => {
    expect(
      googleMapsBrowserConfig({
        NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY: "browser",
        GOOGLE_MAPS_API_KEY: "api",
        GOOGLE_MAPS_SERVER_KEY: "server",
      }),
    ).toEqual({
      provider: "google",
      apiKey: "browser",
      source: "NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY",
    });
  });

  it("uses GOOGLE_MAPS_API_KEY next", () => {
    expect(
      googleMapsBrowserConfig({
        GOOGLE_MAPS_API_KEY: "api",
        GOOGLE_MAPS_SERVER_KEY: "server",
      }),
    ).toEqual({
      provider: "google",
      apiKey: "api",
      source: "GOOGLE_MAPS_API_KEY",
    });
  });

  it("falls back to the server key so one Cloud Run var is enough", () => {
    expect(googleMapsBrowserConfig({ GOOGLE_MAPS_SERVER_KEY: "server" })).toEqual({
      provider: "google",
      apiKey: "server",
      source: "GOOGLE_MAPS_SERVER_KEY",
    });
  });

  it("reports missing when no Google key is set", () => {
    const config = googleMapsBrowserConfig({});
    expect(config.provider).toBe("none");
    expect(googleMapsConfigHint(config)).toMatch(/GOOGLE_MAPS_API_KEY/);
  });
});

describe("redactMapSecret", () => {
  it("does not print the full key", () => {
    const fixture = "maps-key-fixture-secret-suffix";
    expect(redactMapSecret(fixture)).toBe("maps-k…REDACTED");
    expect(redactMapSecret(fixture)).not.toContain("secret-suffix");
  });
});
