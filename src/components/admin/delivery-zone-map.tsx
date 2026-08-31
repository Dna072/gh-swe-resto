"use client";

import { useEffect, useRef, useState } from "react";
import type { GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Button } from "@/components/ui/button";
import { osmRasterStyle } from "@/lib/maps/style";
import { attachMapDiagnostics, isTileNetworkError, logMapError, logMapWarn, mapLibreTransformLogger } from "@/lib/maps/diagnostics";
import { loadBrowserMapStyle } from "@/lib/maps/load-browser-style";
import { bindMapLibreWorker } from "@/lib/maps/worker";
import { isValidPolygon, toGeoJsonRing, uniqueVertices, type LatLng } from "@/lib/geo/polygon";

const UPPSALA: LatLng = { lat: 59.8586, lng: 17.6389 };
const SOURCE = "delivery-zones";
const DRAFT = "delivery-draft";

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
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const markersRef = useRef<import("maplibre-gl").Marker[]>([]);
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
    let map: import("maplibre-gl").Map | undefined;
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
      setMapNote(loaded.note);
      try {
        map = new maplibregl.Map({
          container: container.current,
          style: loaded.style,
          center: [UPPSALA.lng, UPPSALA.lat],
          zoom: 12,
          attributionControl: { compact: true },
          transformRequest: mapLibreTransformLogger(),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Map failed to start.";
        logMapError("map_constructor_failed", { component: "delivery-zone-map", message });
        container.current.textContent = "This browser cannot show the map. Try Chrome or Safari.";
        container.current.classList.add("grid", "place-items-center", "p-6", "text-sm", "text-muted-foreground");
        setMapNote(`constructor failed · ${message}`);
        return;
      }
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      let usedRasterFallback = loaded.usedFallback;
      detachDiagnostics = attachMapDiagnostics(
        map,
        {
          component: "delivery-zone-map",
          provider: loaded.config.provider,
          styleUrl: loaded.config.styleUrl,
        },
        (message, sourceId) => {
          if (usedRasterFallback || !map || !isTileNetworkError(message, sourceId)) {
            setMapNote((current) => `${current ?? loaded.note} · ${message}`);
            return;
          }
          usedRasterFallback = true;
          logMapWarn("vector_tiles_failed_using_osm_raster", { message });
          setMapNote(`${loaded.note} · tile error, OSM raster fallback · ${message}`);
          map.setStyle(osmRasterStyle());
        },
      );
      const ensureLayers = () => {
        if (!map) {
          return;
        }
        if (!map.getSource(SOURCE)) {
          map.addSource(SOURCE, { type: "geojson", data: emptyCollection() });
          map.addLayer({
            id: `${SOURCE}-fill`,
            type: "fill",
            source: SOURCE,
            paint: {
              "fill-color": ["case", ["get", "selected"], "#C4A35A", "#8A7A6A"],
              "fill-opacity": ["case", ["get", "selected"], 0.38, 0.16],
            },
          });
          map.addLayer({
            id: `${SOURCE}-line`,
            type: "line",
            source: SOURCE,
            paint: {
              "line-color": ["case", ["get", "selected"], "#8B5A2B", "#8A7A6A"],
              "line-width": ["case", ["get", "selected"], 2.5, 1.5],
            },
          });
        }
        if (!map.getSource(DRAFT)) {
          map.addSource(DRAFT, { type: "geojson", data: emptyCollection() });
          map.addLayer({
            id: `${DRAFT}-line`,
            type: "line",
            source: DRAFT,
            paint: {
              "line-color": "#C4A35A",
              "line-width": 2,
              "line-dasharray": [1.4, 1.2],
            },
          });
        }
        const source = map.getSource(SOURCE) as GeoJSONSource | undefined;
        source?.setData(zonesToCollection(zonesRef.current, selectedRef.current));
        mapRef.current = map;
        setReady(true);
        fitToZones(map, maplibregl, zonesRef.current);
      };
      map.on("load", ensureLayers);
      map.on("style.load", ensureLayers);
      map.on("click", (event) => {
        if (drawingRef.current) {
          const current = zonesRef.current.find((zone) => zone.key === selectedRef.current);
          const next = uniqueVertices([
            ...(current?.polygon ?? []),
            { lat: event.lngLat.lat, lng: event.lngLat.lng },
          ]);
          onPolygonChangeRef.current(selectedRef.current, next);
          return;
        }
        const hits = map?.queryRenderedFeatures(event.point, { layers: [`${SOURCE}-fill`] }) ?? [];
        const key = hits[0]?.properties?.key;
        if (typeof key === "string") {
          onSelectRef.current(key);
        }
      });
      map.on("dblclick", (event) => {
        if (!drawingRef.current) {
          return;
        }
        event.preventDefault();
        const current = zonesRef.current.find((zone) => zone.key === selectedRef.current);
        if (isValidPolygon(current?.polygon)) {
          drawingRef.current = false;
          setDrawing(false);
        }
      });
    });

    return () => {
      cancelled = true;
      detachDiagnostics?.();
      for (const marker of markersRef.current) {
        marker.remove();
      }
      markersRef.current = [];
      map?.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) {
      return;
    }
    const source = map.getSource(SOURCE) as GeoJSONSource | undefined;
    source?.setData(zonesToCollection(zones, selectedKey));
    const draft = map.getSource(DRAFT) as GeoJSONSource | undefined;
    draft?.setData(draftCollection(drawing ? vertices : []));
    map.getCanvas().style.cursor = drawing ? "crosshair" : "";
    if (drawing) {
      map.doubleClickZoom.disable();
    } else {
      map.doubleClickZoom.enable();
    }
  }, [zones, selectedKey, drawing, vertices, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || drawing) {
      return;
    }
    let cancelled = false;
    void import("maplibre-gl").then((maplibregl) => {
      if (cancelled || mapRef.current !== map) {
        return;
      }
      for (const marker of markersRef.current) {
        marker.remove();
      }
      markersRef.current = vertices.map((point, index) => {
        const marker = new maplibregl.Marker({ color: "#C4A35A", draggable: true })
          .setLngLat([point.lng, point.lat])
          .addTo(map);
        marker.on("dragend", () => {
          const position = marker.getLngLat();
          const next = uniqueVertices(zonesRef.current.find((zone) => zone.key === selectedRef.current)?.polygon ?? []);
          next[index] = { lat: position.lat, lng: position.lng };
          onPolygonChangeRef.current(selectedRef.current, uniqueVertices(next));
        });
        return marker;
      });
    });
    return () => {
      cancelled = true;
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

function emptyCollection(): GeoJSON.FeatureCollection {
  return { type: "FeatureCollection", features: [] };
}

function zonesToCollection(zones: ZoneMapItem[], selectedKey: string): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: zones.flatMap((zone) => {
      const ring = toGeoJsonRing(zone.polygon);
      if (ring.length < 4) {
        return [];
      }
      return [
        {
          type: "Feature",
          properties: { key: zone.key, name: zone.name, selected: zone.key === selectedKey, active: zone.active },
          geometry: { type: "Polygon", coordinates: [ring] },
        },
      ];
    }),
  };
}

function draftCollection(points: LatLng[]): GeoJSON.FeatureCollection {
  if (points.length < 2) {
    return emptyCollection();
  }
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: points.map((point) => [point.lng, point.lat]),
        },
      },
    ],
  };
}

function fitToZones(
  map: import("maplibre-gl").Map,
  maplibregl: typeof import("maplibre-gl"),
  zones: ZoneMapItem[],
) {
  const bounds = new maplibregl.LngLatBounds();
  let count = 0;
  for (const zone of zones) {
    for (const point of uniqueVertices(zone.polygon)) {
      bounds.extend([point.lng, point.lat]);
      count += 1;
    }
  }
  if (count < 2) {
    map.setCenter([UPPSALA.lng, UPPSALA.lat]);
    map.setZoom(12);
    return;
  }
  map.fitBounds(bounds, { padding: 48, maxZoom: 14, duration: 0 });
}
