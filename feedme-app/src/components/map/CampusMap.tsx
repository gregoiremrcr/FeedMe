"use client";

import { useEffect, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { formatPrice } from "@/lib/restaurant";
import { CAMPUS_CENTER, Spot } from "@/lib/spots";

const centerIcon = L.divIcon({
  className: "",
  html: `<div class="relative -translate-x-1/2 -translate-y-1/2">
    <span class="absolute h-8 w-8 -translate-x-1/4 -translate-y-1/4 animate-ping rounded-full bg-primary/30"></span>
    <span class="block h-4 w-4 rounded-full border-2 border-white bg-primary shadow-md"></span>
  </div>`,
  iconSize: [0, 0],
});

function priceIcon(spot: Spot, selected: boolean) {
  const style = selected
    ? "bg-primary text-on-primary"
    : "bg-surface-container-lowest text-on-surface";

  return L.divIcon({
    className: "",
    html: `<div class="w-fit -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-full px-2.5 py-1 text-sm font-bold shadow-lg ${style}">${spot.priceIsEstimate ? "~" : ""}${formatPrice(spot.price)}</div>`,
    iconSize: [0, 0],
  });
}

function FlyToSelected({ spot }: { spot?: Spot }) {
  const map = useMap();

  useEffect(() => {
    if (spot) map.flyTo([spot.lat, spot.lng], Math.max(map.getZoom(), 16), { duration: 0.6 });
  }, [spot, map]);

  return null;
}

function RecenterOnChange({ center }: { center: [number, number] }) {
  const map = useMap();
  const [lat, lng] = center;

  useEffect(() => {
    map.setView([lat, lng], 15);
  }, [lat, lng, map]);

  return null;
}

type Props = {
  spots: Spot[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  center?: [number, number];
};

export default function CampusMap({ spots, selectedId, onSelect, center = CAMPUS_CENTER }: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    return () => setReady(false);
  }, []);

  if (!ready) {
    return <div className="h-full w-full animate-pulse bg-surface-container-high" />;
  }

  const selected = spots.find((s) => s.id === selectedId);

  return (
    <MapContainer center={center} zoom={16} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker position={center} icon={centerIcon} title="Toi" interactive={false} />

      {spots.map((spot) => (
        <Marker
          key={spot.id}
          position={[spot.lat, spot.lng]}
          icon={priceIcon(spot, spot.id === selectedId)}
          title={spot.name}
          eventHandlers={{ click: () => onSelect(spot.id) }}
        />
      ))}

      <RecenterOnChange center={center} />
      <FlyToSelected spot={selected} />
    </MapContainer>
  );
}