"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { googleMapsBrowserConfig, googleMapsConfigHint, redactMapSecret, type GoogleMapsKeySource } from "@/lib/maps/google";
import { logMap, logMapError, logMapWarn } from "@/lib/maps/diagnostics";

declare global {
  interface Window {
    gm_authFailure?: () => void;
  }
}

export type LoadedGoogleMaps = {
  source: string;
  hint?: string;
};

let pending: Promise<LoadedGoogleMaps> | undefined;

export async function loadGoogleMaps(): Promise<LoadedGoogleMaps> {
  if (pending) {
    return pending;
  }
  pending = loadOnce().catch((error) => {
    pending = undefined;
    throw error;
  });
  return pending;
}

async function loadOnce(): Promise<LoadedGoogleMaps> {
  const fallback = googleMapsBrowserConfig({
    NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY,
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
  });
  logMap("client_bundle_env", {
    hasPublicGoogleKey: Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY?.trim()),
    bakedSource: fallback.source,
  });

  let apiKey = fallback.apiKey;
  let source = fallback.source;
  let hint = googleMapsConfigHint(fallback);

  try {
    const response = await fetch("/api/maps/config", { cache: "no-store" });
    if (response.ok) {
      const body = (await response.json()) as {
        apiKey?: string;
        source?: GoogleMapsKeySource;
        diagnostics?: { hint?: string };
      };
      if (body.apiKey) {
        apiKey = body.apiKey;
        if (body.source) {
          source = body.source;
        }
        hint = googleMapsConfigHint({ provider: "google", apiKey, source });
      } else {
        hint = body.diagnostics?.hint ?? hint;
      }
      logMap("runtime_config", {
        source,
        hasKey: Boolean(apiKey),
        key: redactMapSecret(apiKey),
        hint,
      });
    } else {
      logMapWarn("runtime_config_http", { status: response.status });
    }
  } catch (error) {
    logMapWarn("runtime_config_failed", {
      message: error instanceof Error ? error.message : "maps config fetch failed",
    });
  }

  if (!apiKey) {
    const message = hint ?? "Google Maps key is not set.";
    logMapError("google_maps_key_missing", { message });
    throw new Error(message);
  }

  window.gm_authFailure = () => {
    logMapError("google_auth_failure", {
      source,
      hint: "Enable Maps JavaScript API for this key and allow this site as an HTTP referrer.",
    });
  };

  setOptions({ key: apiKey, v: "weekly" });
  await importLibrary("maps");
  logMap("google_maps_loaded", { source });
  return { source, hint };
}
