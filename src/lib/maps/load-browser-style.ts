import {
  logMap,
  logMapWarn,
  describeWebGl,
} from "@/lib/maps/diagnostics";
import { probeMapLibreWorker } from "@/lib/maps/worker";
import {
  mapRuntimeConfig,
  redactMapUrl,
  resolveMapStyle,
  type MapRuntimeConfig,
  type OsmRasterStyle,
  type ResolveMapStyleResult,
} from "@/lib/maps/style";

export type BrowserMapStyle = {
  style: string | OsmRasterStyle;
  config: MapRuntimeConfig;
  usedFallback: boolean;
  note: string;
};

type MapsConfigResponse = MapRuntimeConfig & {
  diagnostics?: {
    styleOk?: boolean;
    styleStatus?: number | null;
    styleError?: string;
    hint?: string;
    runtimeHasPublicMaptilerKey?: boolean;
    runtimeHasServerMaptilerKey?: boolean;
  };
};

function fallbackConfig(): MapRuntimeConfig {
  return mapRuntimeConfig({
    NEXT_PUBLIC_MAP_STYLE_URL: process.env.NEXT_PUBLIC_MAP_STYLE_URL,
    NEXT_PUBLIC_MAPTILER_KEY: process.env.NEXT_PUBLIC_MAPTILER_KEY,
  });
}

function noteFor(config: MapRuntimeConfig, resolved: ResolveMapStyleResult, hint?: string): string {
  const bits = [
    config.provider,
    `source=${config.source}`,
    resolved.usedFallback ? "OSM raster fallback" : "vector style",
  ];
  if (resolved.fetchStatus) {
    bits.push(`style HTTP ${resolved.fetchStatus}`);
  }
  if (resolved.fetchError) {
    bits.push(resolved.fetchError);
  }
  if (hint) {
    bits.push(hint);
  }
  return bits.join(" · ");
}

export async function loadBrowserMapStyle(): Promise<BrowserMapStyle> {
  logMap("webgl", describeWebGl());
  logMap("client_bundle_env", {
    hasPublicMaptilerKey: Boolean(process.env.NEXT_PUBLIC_MAPTILER_KEY?.trim()),
    hasPublicStyleUrl: Boolean(process.env.NEXT_PUBLIC_MAP_STYLE_URL?.trim()),
    bakedStyleUrl: redactMapUrl(fallbackConfig().styleUrl),
  });

  const worker = await probeMapLibreWorker();
  let hint: string | undefined;
  if (!worker.ok) {
    hint = `MapLibre worker missing (${worker.status ?? "unreachable"} ${worker.contentType ?? "no content-type"}). Tiles will not paint.`;
  }

  let config = fallbackConfig();
  try {
    const response = await fetch("/api/maps/config", { cache: "no-store" });
    if (response.ok) {
      const body = (await response.json()) as MapsConfigResponse;
      config = {
        provider: body.provider,
        styleUrl: body.styleUrl,
        source: body.source,
      };
      hint = hint ?? body.diagnostics?.hint;
      logMap("runtime_config", {
        provider: config.provider,
        source: config.source,
        styleUrl: redactMapUrl(config.styleUrl),
        diagnostics: body.diagnostics
          ? {
              ...body.diagnostics,
            }
          : undefined,
      });
    } else {
      logMapWarn("runtime_config_http", { status: response.status });
      hint = `maps config HTTP ${response.status}; using client bundle env`;
    }
  } catch (error) {
    logMapWarn("runtime_config_failed", {
      message: error instanceof Error ? error.message : "maps config fetch failed",
    });
    hint = "maps config unreachable; using client bundle env";
  }

  const resolved = await resolveMapStyle(config.styleUrl);
  if (resolved.usedFallback) {
    logMapWarn("style_fallback_osm_raster", {
      requestedUrl: redactMapUrl(resolved.requestedUrl),
      fetchStatus: resolved.fetchStatus,
      fetchError: resolved.fetchError,
    });
  } else {
    logMap("style_ok", { requestedUrl: redactMapUrl(resolved.requestedUrl), fetchStatus: resolved.fetchStatus });
  }

  return {
    style: resolved.style,
    config,
    usedFallback: resolved.usedFallback,
    note: noteFor(config, resolved, hint),
  };
}
