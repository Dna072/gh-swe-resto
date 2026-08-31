"use client";

import { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { cn } from "@/lib/utils";
import { osmRasterStyle } from "@/lib/maps/style";
import { attachMapDiagnostics, isTileNetworkError, logMapError, logMapWarn, mapLibreTransformLogger } from "@/lib/maps/diagnostics";
import { loadBrowserMapStyle } from "@/lib/maps/load-browser-style";
import { bindMapLibreWorker } from "@/lib/maps/worker";

export function LocationMap({
  lat,
  lng,
  onMove,
  className,
}: {
  lat: number;
  lng: number;
  onMove?: (lat: number, lng: number) => void;
  className?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const onMoveRef = useRef(onMove);

  useEffect(() => {
    onMoveRef.current = onMove;
  }, [onMove]);

  useEffect(() => {
    const node = container.current;
    if (!node) {
      return;
    }
    let cancelled = false;
    let map: import("maplibre-gl").Map | undefined;
    let marker: import("maplibre-gl").Marker | undefined;
    let detachDiagnostics: (() => void) | undefined;

    void import("maplibre-gl").then(async (maplibregl) => {
      if (cancelled || !container.current) {
        return;
      }
      bindMapLibreWorker(maplibregl);
      const loaded = await loadBrowserMapStyle();
      if (cancelled || !container.current) {
        return;
      }
      try {
        map = new maplibregl.Map({
          container: container.current,
          style: loaded.style,
          center: [lng, lat],
          zoom: 16,
          attributionControl: { compact: true },
          transformRequest: mapLibreTransformLogger(),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Map failed to start.";
        logMapError("map_constructor_failed", { component: "location-map", message });
        return;
      }
      let usedRasterFallback = loaded.usedFallback;
      detachDiagnostics = attachMapDiagnostics(
        map,
        {
          component: "location-map",
          provider: loaded.config.provider,
          styleUrl: loaded.config.styleUrl,
        },
        (message, sourceId) => {
          if (usedRasterFallback || !map || !isTileNetworkError(message, sourceId)) {
            return;
          }
          usedRasterFallback = true;
          logMapWarn("vector_tiles_failed_using_osm_raster", { component: "location-map", message });
          map.setStyle(osmRasterStyle());
        },
      );
      marker = new maplibregl.Marker({
        draggable: Boolean(onMoveRef.current),
        color: "#8B5A2B",
      })
        .setLngLat([lng, lat])
        .addTo(map);
      marker.on("dragend", () => {
        const position = marker?.getLngLat();
        if (position) {
          onMoveRef.current?.(position.lat, position.lng);
        }
      });
    });

    return () => {
      cancelled = true;
      detachDiagnostics?.();
      marker?.remove();
      map?.remove();
    };
    // Recreate only when the selected place changes; parent should remount with a place key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={container}
      className={cn(
        "h-52 w-full overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/10 sm:h-64",
        className,
      )}
      role="img"
      aria-label="Map of the selected delivery location"
    />
  );
}
