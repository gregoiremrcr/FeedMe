"use client";

import { useEffect, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Spot } from "@/lib/spots";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

function restaurantIcon(spot: Spot, selected: boolean) {
  const style = selected ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface";

  return L.divIcon({
    className: "",
    html: `<div class="w-fit -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold shadow-lg ${style}">${escapeHtml(spot.name)}</div>`,
    iconSize: [0, 0],
  });
}

function FlyToSelected({ spot }: { spot?: Spot }) {
  const map = useMap();

  useEffect(() => {
    if (spot) map.flyTo([spot.lat, spot.lon], Math.max(map.getZoom(), 16), { duration: 0.6 });
  }, [spot, map]);

  return null;
}

function FlyToCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.flyTo(center, Math.max(map.getZoom(), 14), { duration: 0.5 }); }, [center, map]);
  return null;
}

type Props = {
  center: [number, number];
  spots: Spot[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export default function CampusMap({ center, spots, selectedId, onSelect }: Props) {
  // La carte n'est créée qu'après le montage, et détruite au démontage,
  // pour éviter l'erreur "Map container is being reused".
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!ready) {
    return <div className="h-full w-full animate-pulse bg-surface-container-high" />;
  }

  const selected = spots.find((s) => s.id === selectedId);

  return (
    <MapContainer center={center} zoom={14} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {spots.map((spot) => (
        <Marker
          key={spot.id}
          position={[spot.lat, spot.lon]}
          icon={restaurantIcon(spot, spot.id === selectedId)}
          title={spot.name}
          eventHandlers={{ click: () => onSelect(spot.id) }}
        />
      ))}

      <FlyToSelected spot={selected} />
      <FlyToCenter center={center} />
    </MapContainer>
  );
}
