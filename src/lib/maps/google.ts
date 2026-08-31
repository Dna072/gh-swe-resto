export type GoogleMapsKeySource =
  | "NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY"
  | "GOOGLE_MAPS_API_KEY"
  | "GOOGLE_MAPS_SERVER_KEY"
  | "missing";

export type GoogleMapsBrowserConfig = {
  provider: "google" | "none";
  apiKey: string;
  source: GoogleMapsKeySource;
};

export type GoogleMapsEnvSlice = {
  NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY?: string;
  GOOGLE_MAPS_API_KEY?: string;
  GOOGLE_MAPS_SERVER_KEY?: string;
};

export function redactMapSecret(value: string): string {
  if (!value) {
    return "";
  }
  if (value.length <= 8) {
    return "REDACTED";
  }
  return `${value.slice(0, 6)}…REDACTED`;
}

/**
 * Browser Maps JavaScript API key.
 * Cloud Run can set any of these at request time — no image rebuild required.
 */
export function googleMapsBrowserConfig(env: GoogleMapsEnvSlice): GoogleMapsBrowserConfig {
  const browser = env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY?.trim();
  if (browser) {
    return { provider: "google", apiKey: browser, source: "NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY" };
  }
  const api = env.GOOGLE_MAPS_API_KEY?.trim();
  if (api) {
    return { provider: "google", apiKey: api, source: "GOOGLE_MAPS_API_KEY" };
  }
  const server = env.GOOGLE_MAPS_SERVER_KEY?.trim();
  if (server) {
    return { provider: "google", apiKey: server, source: "GOOGLE_MAPS_SERVER_KEY" };
  }
  return { provider: "none", apiKey: "", source: "missing" };
}

export function googleMapsConfigHint(config: GoogleMapsBrowserConfig): string | undefined {
  if (config.provider === "none") {
    return "Set GOOGLE_MAPS_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY on Cloud Run. Enable Maps JavaScript API on that key.";
  }
  if (config.source === "GOOGLE_MAPS_SERVER_KEY") {
    return "Using GOOGLE_MAPS_SERVER_KEY in the browser. Prefer a referrer-restricted Maps JavaScript API key as GOOGLE_MAPS_API_KEY.";
  }
  return undefined;
}
