import { useRef, useEffect, useCallback, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import { PinPanel } from "./pin-panel";
import { NewPinPanel } from "./new-pin-panel";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN as string;

const categoryColors: Record<string, string> = {
  food: "#C4654A",
  activity: "#D4923B",
  hotel: "#5B7FC4",
  landmark: "#7C9A82",
  transport: "#8A8279",
  other: "#A68B7C",
};

type PendingPin = { lat: number; lng: number };

export function TripMap({
  tripId,
  initialFlyTo,
}: {
  tripId: Id<"trips">;
  initialFlyTo?: { lat: number; lng: number } | null;
}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const pendingMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const pins = useQuery(api.pins.list, { tripId });
  const createPin = useMutation(api.pins.create);
  const [selectedPinId, setSelectedPinId] = useState<Id<"pins"> | null>(null);
  const [pendingPin, setPendingPin] = useState<PendingPin | null>(null);

  const selectedPin = pins?.find((p) => p._id === selectedPinId) ?? null;

  function clearPending() {
    setPendingPin(null);
    pendingMarkerRef.current?.remove();
    pendingMarkerRef.current = null;
  }

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [0, 20],
      zoom: 2,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.addControl(
      new MapboxGeocoder({
        accessToken: mapboxgl.accessToken as string,
        mapboxgl,
        marker: false,
        placeholder: "Search for a place…",
        collapsed: true,
      }),
      "top-left",
    );
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Fly to a location when requested (e.g. after URL ingest creates a pin)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !initialFlyTo) return;
    map.flyTo({
      center: [initialFlyTo.lng, initialFlyTo.lat],
      zoom: 14,
      duration: 1500,
    });
  }, [initialFlyTo]);

  // Handle map clicks — show pending pin
  const handleMapClick = useCallback(
    (e: mapboxgl.MapMouseEvent) => {
      const map = mapRef.current;
      if (!map) return;

      // Clear any existing selection
      setSelectedPinId(null);

      // Remove old pending marker
      pendingMarkerRef.current?.remove();

      // Create pending marker (pulsing/dashed style)
      const el = document.createElement("div");
      el.className = "cursor-pointer";
      el.style.width = "28px";
      el.style.height = "28px";
      el.innerHTML = `
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="11" fill="none" stroke="#C4654A" stroke-width="2" stroke-dasharray="4 3"/>
          <circle cx="14" cy="14" r="4" fill="#C4654A"/>
        </svg>
      `;

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([e.lngLat.lng, e.lngLat.lat])
        .addTo(map);

      pendingMarkerRef.current = marker;
      setPendingPin({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    },
    [],
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.on("click", handleMapClick);
    return () => {
      map.off("click", handleMapClick);
    };
  }, [handleMapClick]);

  // Sync markers with pins
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !pins) return;

    const currentIds = new Set(pins.map((p) => p._id));
    const existing = markersRef.current;

    // Remove markers for deleted pins
    for (const [id, marker] of existing) {
      if (!currentIds.has(id as Id<"pins">)) {
        marker.remove();
        existing.delete(id);
      }
    }

    // Add or update markers
    for (const pin of pins) {
      const existingMarker = existing.get(pin._id);
      if (existingMarker) {
        existingMarker.setLngLat([pin.lng, pin.lat]);
        const el = existingMarker.getElement();
        const svg = el.querySelector("circle");
        if (svg) svg.setAttribute("fill", categoryColors[pin.category] ?? categoryColors.other);
      } else {
        const el = createMarkerElement(pin);
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          clearPending();
          setSelectedPinId(pin._id);
        });

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([pin.lng, pin.lat])
          .addTo(map);

        existing.set(pin._id, marker);
      }
    }
  }, [pins]);

  async function handleConfirmPin(data: {
    name: string;
    category: Doc<"pins">["category"];
    notes?: string;
  }) {
    if (!pendingPin) return;

    const pinId = await createPin({
      tripId,
      lat: pendingPin.lat,
      lng: pendingPin.lng,
      name: data.name,
      category: data.category,
      notes: data.notes,
      confirmed: true,
      createdBy: "",
    });

    clearPending();
    setSelectedPinId(pinId);
  }

  return (
    <div className="relative h-full flex">
      <div ref={mapContainer} className="flex-1" />
      {selectedPin && (
        <PinPanel
          pin={selectedPin}
          onClose={() => setSelectedPinId(null)}
          onFlyTo={() => {
            mapRef.current?.flyTo({
              center: [selectedPin.lng, selectedPin.lat],
              zoom: 14,
              duration: 1500,
            });
          }}
        />
      )}
      {pendingPin && !selectedPin && (
        <NewPinPanel
          lat={pendingPin.lat}
          lng={pendingPin.lng}
          onConfirm={handleConfirmPin}
          onCancel={clearPending}
        />
      )}
    </div>
  );
}

function createMarkerElement(pin: Doc<"pins">) {
  const color = categoryColors[pin.category] ?? categoryColors.other;
  const el = document.createElement("div");
  el.className = "cursor-pointer";
  el.style.width = "24px";
  el.style.height = "24px";
  el.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
    </svg>
  `;
  return el;
}
