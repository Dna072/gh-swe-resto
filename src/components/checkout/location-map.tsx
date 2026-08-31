"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { logMapError } from "@/lib/maps/diagnostics";
import { loadGoogleMaps } from "@/lib/maps/load-google";

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
    let map: google.maps.Map | undefined;
    let marker: google.maps.Marker | undefined;

    void loadGoogleMaps()
      .then(() => {
        if (cancelled || !container.current || typeof google === "undefined") {
          return;
        }
        map = new google.maps.Map(container.current, {
          center: { lat, lng },
          zoom: 16,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          rotateControl: false,
          clickableIcons: false,
          gestureHandling: "greedy",
          keyboardShortcuts: false,
        });
        marker = new google.maps.Marker({
          map,
          position: { lat, lng },
          draggable: Boolean(onMoveRef.current),
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#8B5A2B",
            fillOpacity: 1,
            strokeColor: "#C4A35A",
            strokeWeight: 2,
          },
        });
        marker.addListener("dragend", () => {
          const position = marker?.getPosition();
          if (position) {
            onMoveRef.current?.(position.lat(), position.lng());
          }
        });
      })
      .catch((error: unknown) => {
        if (cancelled || !container.current) {
          return;
        }
        const message = error instanceof Error ? error.message : "Google Maps failed to start.";
        logMapError("google_map_failed", { component: "location-map", message });
        container.current.textContent = message;
        container.current.classList.add("grid", "place-items-center", "p-6", "text-sm", "text-muted-foreground");
      });

    return () => {
      cancelled = true;
      marker?.setMap(null);
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
