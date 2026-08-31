import { logMap, logMapError } from "@/lib/maps/diagnostics";

const WORKER_URL = "/maplibre/maplibre-gl-worker.mjs";

let bound = false;

/** MapLibre v6 worker must be a same-origin .mjs next to maplibre-gl-shared.mjs. */
export function bindMapLibreWorker(maplibregl: typeof import("maplibre-gl")): void {
  if (bound) {
    return;
  }
  maplibregl.setWorkerUrl(WORKER_URL);
  bound = true;
  logMap("worker_url", { url: WORKER_URL });
}

export async function probeMapLibreWorker(): Promise<{ ok: boolean; status?: number; contentType?: string | null }> {
  try {
    const response = await fetch(WORKER_URL, { method: "HEAD", cache: "no-store" });
    const contentType = response.headers.get("content-type");
    const ok = response.ok && Boolean(contentType?.includes("javascript") || contentType?.includes("ecmascript"));
    if (!ok) {
      logMapError("maplibre_worker_asset", {
        url: WORKER_URL,
        status: response.status,
        contentType,
        hint: "Run npm run copy-maplibre-worker (also hooked as predev/prebuild).",
      });
    } else {
      logMap("maplibre_worker_asset", { url: WORKER_URL, status: response.status, contentType });
    }
    return { ok, status: response.status, contentType };
  } catch (error) {
    logMapError("maplibre_worker_asset", {
      url: WORKER_URL,
      message: error instanceof Error ? error.message : "worker HEAD failed",
    });
    return { ok: false };
  }
}
