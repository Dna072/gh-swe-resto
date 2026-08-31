"use client";

import { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { cn } from "@/lib/utils";
import { mapStyleUrl } from "@/lib/maps/style";

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

    void import("maplibre-gl").then((maplibregl) => {
      if (cancelled || !container.current) {
        return;
      }
      map = new maplibregl.Map({
        container: container.current,
        style: mapStyleUrl(),
        center: [lng, lat],
        zoom: 16,
        attributionControl: { compact: true },
      });
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
