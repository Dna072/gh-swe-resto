import { redactMapUrl } from "@/lib/maps/style";

const PREFIX = "[maps]";

export function mapDebugEnabled(): boolean {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return window.localStorage.getItem("maps-debug") === "1";
  } catch {
    return false;
  }
}

export function logMap(message: string, fields?: Record<string, unknown>): void {
  if (!mapDebugEnabled()) {
    return;
  }
  console.info(PREFIX, message, fields ?? {});
}

export function logMapWarn(message: string, fields?: Record<string, unknown>): void {
  console.warn(PREFIX, message, fields ?? {});
}

export function logMapError(message: string, fields?: Record<string, unknown>): void {
  console.error(PREFIX, message, fields ?? {});
}

export function describeWebGl(): Record<string, unknown> {
  if (typeof document === "undefined") {
    return { available: false, reason: "no document" };
  }
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: false }) ??
      canvas.getContext("webgl", { failIfMajorPerformanceCaveat: false });
    if (!gl) {
      return { available: false, reason: "no webgl context" };
    }
    const debug = gl.getExtension("WEBGL_debug_renderer_info");
    return {
      available: true,
      webgl2: Boolean(typeof WebGL2RenderingContext !== "undefined" && gl instanceof WebGL2RenderingContext),
      vendor: debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
      renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
    };
  } catch (error) {
    return { available: false, reason: error instanceof Error ? error.message : "webgl probe failed" };
  }
}

function errorMessage(event: { error?: unknown }): string {
  const err = event.error;
  if (err instanceof Error) {
    return err.message;
  }
  if (err && typeof err === "object" && "message" in err && typeof err.message === "string") {
    return err.message;
  }
  if (typeof err === "string") {
    return err;
  }
  return "maplibre error";
}

/** Tile/style network failures — not drawing-layer or GeoJSON issues. */
export function isTileNetworkError(message: string, sourceId?: string): boolean {
  if (sourceId === "delivery-zones" || sourceId === "delivery-draft") {
    return false;
  }
  return /ajaxerror|failed to fetch|failed to load|networkerror|403|401|404|status [45]|net::err|csp|refused/i.test(
    message,
  );
}

export function attachMapDiagnostics(
  map: import("maplibre-gl").Map,
  context: { component: string; provider?: string; styleUrl?: string },
  onError?: (message: string, sourceId?: string) => void,
): () => void {
  let loadedSources = 0;
  const onMapError = (event: { error?: unknown; sourceId?: string }) => {
    const message = errorMessage(event);
    logMapError("maplibre_error", {
      component: context.component,
      provider: context.provider,
      styleUrl: context.styleUrl ? redactMapUrl(context.styleUrl) : undefined,
      sourceId: event.sourceId,
      message,
    });
    onError?.(message, event.sourceId);
  };
  const onLoad = () => {
    logMap("maplibre_load", {
      component: context.component,
      provider: context.provider,
      zoom: map.getZoom(),
      center: map.getCenter(),
    });
  };
  const onData = (event: { dataType?: string; sourceId?: string; isSourceLoaded?: boolean }) => {
    if (!mapDebugEnabled()) {
      return;
    }
    if (event.dataType === "style" || (event.dataType === "source" && event.isSourceLoaded)) {
      logMap("maplibre_data", {
        component: context.component,
        dataType: event.dataType,
        sourceId: event.sourceId,
        isSourceLoaded: event.isSourceLoaded,
      });
    }
  };
  const onSourceData = (event: { sourceId?: string; isSourceLoaded?: boolean }) => {
    if (!mapDebugEnabled() || !event.isSourceLoaded || loadedSources >= 6) {
      return;
    }
    loadedSources += 1;
    logMap("maplibre_sourcedata", { component: context.component, sourceId: event.sourceId });
  };
  map.on("error", onMapError);
  map.on("load", onLoad);
  map.on("data", onData);
  map.on("sourcedata", onSourceData);
  return () => {
    map.off("error", onMapError);
    map.off("load", onLoad);
    map.off("data", onData);
    map.off("sourcedata", onSourceData);
  };
}

export function mapLibreTransformLogger(): (
  url: string,
  resourceType?: string,
) => { url: string } {
  let count = 0;
  return (url, resourceType) => {
    if (mapDebugEnabled() && count < 12) {
      count += 1;
      logMap("maplibre_request", { resourceType, url: redactMapUrl(url) });
    }
    return { url };
  };
}
