"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { logMap, logMapError } from "@/lib/maps/diagnostics";
import { loadGoogleMaps } from "@/lib/maps/load-google";
import { isValidPolygon, uniqueVertices, type LatLng } from "@/lib/geo/polygon";

const UPPSALA: LatLng = { lat: 59.8586, lng: 17.6389 };
const SELECTED_FILL = "#C4A35A";
const MUTED_FILL = "#8A7A6A";
const SELECTED_STROKE = "#8B5A2B";

export type ZoneMapItem = {
  key: string;
  name: string;
  polygon: LatLng[];
  active: boolean;
};

export function DeliveryZoneMap({
  zones,
  selectedKey,
  onSelect,
  onPolygonChange,
}: {
  zones: ZoneMapItem[];
  selectedKey: string;
  onSelect: (key: string) => void;
  onPolygonChange: (key: string, polygon: LatLng[]) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const polygonsRef = useRef<Map<string, google.maps.Polygon>>(new Map());
  const markersRef = useRef<google.maps.Marker[]>([]);
  const draftRef = useRef<google.maps.Polyline | null>(null);
  const zonesRef = useRef(zones);
  const selectedRef = useRef(selectedKey);
  const drawingRef = useRef(false);
  const onSelectRef = useRef(onSelect);
  const onPolygonChangeRef = useRef(onPolygonChange);
  const [drawing, setDrawing] = useState(false);
  const [ready, setReady] = useState(false);
  const [mapNote, setMapNote] = useState<string | null>(null);

  useEffect(() => {
    zonesRef.current = zones;
    selectedRef.current = selectedKey;
    drawingRef.current = drawing;
    onSelectRef.current = onSelect;
    onPolygonChangeRef.current = onPolygonChange;
  });

  const selected = zones.find((zone) => zone.key === selectedKey);
  const vertices = uniqueVertices(selected?.polygon ?? []);

  useEffect(() => {
    const node = container.current;
    if (!node) {
      return;
    }
    let cancelled = false;
    let map: google.maps.Map | undefined;
    const listeners: google.maps.MapsEventListener[] = [];
    const polygons = polygonsRef.current;

    void loadGoogleMaps()
      .then(({ source, hint }) => {
        if (cancelled || !container.current || typeof google === "undefined") {
          return;
        }
        setMapNote(`google · ${source}${hint ? ` · ${hint}` : ""}`);
        map = new google.maps.Map(container.current, {
          center: { lat: UPPSALA.lat, lng: UPPSALA.lng },
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          rotateControl: false,
          scaleControl: false,
          clickableIcons: false,
          gestureHandling: "greedy",
          keyboardShortcuts: false,
        });
        mapRef.current = map;
        listeners.push(
          google.maps.event.addListenerOnce(map, "idle", () => {
            if (!cancelled && map) {
              fitToZones(map, zonesRef.current);
            }
          }),
        );
        listeners.push(
          map.addListener("click", (event: google.maps.MapMouseEvent) => {
            if (!drawingRef.current || !event.latLng) {
              return;
            }
            const current = zonesRef.current.find((zone) => zone.key === selectedRef.current);
            const next = uniqueVertices([
              ...(current?.polygon ?? []),
              { lat: event.latLng.lat(), lng: event.latLng.lng() },
            ]);
            onPolygonChangeRef.current(selectedRef.current, next);
          }),
        );
        listeners.push(
          map.addListener("dblclick", (event: google.maps.MapMouseEvent) => {
            if (!drawingRef.current) {
              return;
            }
            event.stop();
            const current = zonesRef.current.find((zone) => zone.key === selectedRef.current);
            if (isValidPolygon(current?.polygon)) {
              drawingRef.current = false;
              setDrawing(false);
            }
          }),
        );
        setReady(true);
        logMap("google_map_ready", { component: "delivery-zone-map", source });
      })
      .catch((error: unknown) => {
        if (cancelled || !container.current) {
          return;
        }
        const message = error instanceof Error ? error.message : "Google Maps failed to start.";
        logMapError("google_map_failed", { component: "delivery-zone-map", message });
        container.current.textContent = message;
        container.current.classList.add("grid", "place-items-center", "p-6", "text-sm", "text-muted-foreground");
        setMapNote(`failed · ${message}`);
      });

    return () => {
      cancelled = true;
      for (const listener of listeners) {
        listener.remove();
      }
      for (const marker of markersRef.current) {
        marker.setMap(null);
      }
      markersRef.current = [];
      draftRef.current?.setMap(null);
      draftRef.current = null;
      for (const polygon of polygons.values()) {
        polygon.setMap(null);
      }
      polygons.clear();
      mapRef.current = null;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || typeof google === "undefined") {
      return;
    }
    const keep = new Set(zones.map((zone) => zone.key));
    for (const [key, polygon] of polygonsRef.current) {
      if (!keep.has(key)) {
        polygon.setMap(null);
        polygonsRef.current.delete(key);
      }
    }
    for (const zone of zones) {
      const path = uniqueVertices(zone.polygon).map((point) => ({ lat: point.lat, lng: point.lng }));
      const selected = zone.key === selectedKey;
      let polygon = polygonsRef.current.get(zone.key);
      if (!polygon) {
        polygon = new google.maps.Polygon({
          map,
          paths: path,
          strokeWeight: selected ? 2.5 : 1.5,
          strokeColor: selected ? SELECTED_STROKE : MUTED_FILL,
          fillColor: selected ? SELECTED_FILL : MUTED_FILL,
          fillOpacity: selected ? 0.38 : 0.16,
          clickable: !drawing,
          zIndex: selected ? 2 : 1,
        });
        polygon.addListener("click", () => {
          if (drawingRef.current) {
            return;
          }
          onSelectRef.current(zone.key);
        });
        polygonsRef.current.set(zone.key, polygon);
      } else {
        polygon.setPaths(path);
        polygon.setOptions({
          strokeWeight: selected ? 2.5 : 1.5,
          strokeColor: selected ? SELECTED_STROKE : MUTED_FILL,
          fillColor: selected ? SELECTED_FILL : MUTED_FILL,
          fillOpacity: selected ? 0.38 : 0.16,
          clickable: !drawing,
          zIndex: selected ? 2 : 1,
        });
      }
    }

    const draftPath = drawing ? vertices.map((point) => ({ lat: point.lat, lng: point.lng })) : [];
    if (draftPath.length >= 2) {
      if (!draftRef.current) {
        draftRef.current = new google.maps.Polyline({
          map,
          path: draftPath,
          strokeColor: SELECTED_FILL,
          strokeWeight: 2,
          clickable: false,
        });
      } else {
        draftRef.current.setPath(draftPath);
        draftRef.current.setMap(map);
      }
    } else {
      draftRef.current?.setMap(null);
    }

    map.setOptions({
      draggableCursor: drawing ? "crosshair" : undefined,
      disableDoubleClickZoom: drawing,
    });
  }, [zones, selectedKey, drawing, vertices, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || drawing || typeof google === "undefined") {
      for (const marker of markersRef.current) {
        marker.setMap(null);
      }
      markersRef.current = [];
      return;
    }
    for (const marker of markersRef.current) {
      marker.setMap(null);
    }
    markersRef.current = vertices.map((point, index) => {
      const marker = new google.maps.Marker({
        map,
        position: { lat: point.lat, lng: point.lng },
        draggable: true,
        cursor: "grab",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: SELECTED_FILL,
          fillOpacity: 1,
          strokeColor: SELECTED_STROKE,
          strokeWeight: 2,
        },
      });
      marker.addListener("dragend", () => {
        const position = marker.getPosition();
        if (!position) {
          return;
        }
        const next = uniqueVertices(zonesRef.current.find((zone) => zone.key === selectedRef.current)?.polygon ?? []);
        next[index] = { lat: position.lat(), lng: position.lng() };
        onPolygonChangeRef.current(selectedRef.current, uniqueVertices(next));
      });
      return marker;
    });
    return () => {
      for (const marker of markersRef.current) {
        marker.setMap(null);
      }
      markersRef.current = [];
    };
  }, [vertices, selectedKey, drawing, ready]);

  useEffect(() => {
    const polygon = zonesRef.current.find((zone) => zone.key === selectedKey)?.polygon;
    setDrawing(!isValidPolygon(polygon));
  }, [selectedKey]);

  function finish() {
    if (!isValidPolygon(selected?.polygon)) {
      return;
    }
    setDrawing(false);
  }

  function redraw() {
    onPolygonChange(selectedKey, []);
    setDrawing(true);
  }

  return (
    <div className="grid gap-3">
      <div
        ref={container}
        className="h-[28rem] w-full overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/10"
        role="application"
        aria-label="Draw delivery area on the map"
      />
      {process.env.NODE_ENV !== "production" && mapNote ? (
        <p data-testid="map-diagnostics" className="font-mono text-xs text-muted-foreground">
          Map: {mapNote}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {drawing ? (
          <>
            <Button type="button" size="touch" disabled={!isValidPolygon(vertices)} onClick={finish}>
              Finish area
            </Button>
            <Button type="button" size="touch" variant="outline" onClick={redraw}>
              Clear points
            </Button>
          </>
        ) : (
          <Button type="button" size="touch" variant="outline" onClick={redraw}>
            Redraw area
          </Button>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        {drawing
          ? "Click the map to place corners. You need at least three. Double-click or press Finish area to close the shape."
          : "Drag a corner to adjust. Redraw area to start a new shape. Guests can order when their pin falls inside an active shape."}
      </p>
    </div>
  );
}

function fitToZones(map: google.maps.Map, zones: ZoneMapItem[]) {
  const bounds = new google.maps.LatLngBounds();
  let count = 0;
  for (const zone of zones) {
    for (const point of uniqueVertices(zone.polygon)) {
      bounds.extend({ lat: point.lat, lng: point.lng });
      count += 1;
    }
  }
  if (count < 2) {
    map.setCenter({ lat: UPPSALA.lat, lng: UPPSALA.lng });
    map.setZoom(12);
    return;
  }
  map.fitBounds(bounds, 48);
}
