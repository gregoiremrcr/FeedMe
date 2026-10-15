"use client";

import { FormEvent, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, Search, Utensils } from "lucide-react";
import { restaurantApi, Restaurant, RestaurantSearchResponse } from "@/lib/restaurants";
import { KIND_LABELS, SpotKind } from "@/lib/spots";

const CampusMap = dynamic(() => import("./CampusMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-surface-container-high" />,
});

const ALL_KINDS: SpotKind[] = ["restaurant", "fast_food", "cafe"];

export default function MapSection() {
  const [address, setAddress] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [radius, setRadius] = useState(1000);
  const [spots, setSpots] = useState<Restaurant[]>([]);
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [kinds, setKinds] = useState<SpotKind[]>(ALL_KINDS);
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    restaurantApi.preferences().then((preferences) => setRadius(preferences.radius_m)).catch(() => undefined);
  }, []);

  const applyResults = (response: RestaurantSearchResponse) => {
    setSpots(response.results);
    setCenter([response.location.lat, response.location.lon]);
    setUnavailable(response.unavailable_filters);
    setSelectedId(null);
  };

  const search = async (input: { lat: number; lon: number } | { address: string }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await restaurantApi.search({
        ...input,
        radius_m: radius,
        ...(cuisine.trim() ? { cuisines: [cuisine.trim()] } : {}),
      });
      applyResults(response);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible de charger les restaurants.");
      setSpots([]);
    } finally {
      setLoading(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("La géolocalisation n’est pas disponible dans ce navigateur. Saisis une adresse.");
      return;
    }
    setError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => void search({ lat: coords.latitude, lon: coords.longitude }),
      () => setError("Position inaccessible. Autorise la localisation ou saisis une adresse."),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  };

  const searchAddress = (event: FormEvent) => {
    event.preventDefault();
    if (address.trim()) void search({ address: address.trim() });
  };

  const visible = spots.filter((spot) => kinds.includes(spot.kind as SpotKind));
  const toggleKind = (kind: SpotKind) => setKinds((current) =>
    current.includes(kind) ? current.filter((item) => item !== kind) : [...current, kind]
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row">
          <button type="button" onClick={useCurrentLocation} disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-on-primary disabled:opacity-60">
            <MapPin size={18} /> Utiliser ma position
          </button>
          <form onSubmit={searchAddress} className="flex flex-1 gap-2">
            <label className="sr-only" htmlFor="restaurant-address">Adresse de recherche</label>
            <input id="restaurant-address" value={address} onChange={(event) => setAddress(event.target.value)}
              placeholder="Ou saisis une adresse" maxLength={300}
              className="min-w-0 flex-1 rounded-xl bg-surface-container px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <button type="submit" disabled={loading || !address.trim()} aria-label="Chercher autour de cette adresse"
              className="rounded-xl bg-surface-container px-4 text-primary disabled:opacity-50"><Search size={20} /></button>
          </form>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="cuisine" className="text-xs font-semibold uppercase tracking-wider text-secondary">Cuisine</label>
            <input id="cuisine" value={cuisine} onChange={(event) => setCuisine(event.target.value)} maxLength={100}
              placeholder="Ex. italienne, japonaise" className="mt-1 w-full rounded-xl bg-surface-container px-4 py-2.5 text-sm" />
          </div>
          <p className="text-sm text-on-surface-variant">Rayon du compte : {radius >= 1000 ? `${(radius / 1000).toLocaleString("fr-FR")} km` : `${radius} m`}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {ALL_KINDS.map((kind) => {
            const active = kinds.includes(kind);
            return <button key={kind} type="button" aria-pressed={active} onClick={() => toggleKind(kind)}
              className={`rounded-xl px-4 py-2 text-sm ${active ? "bg-primary-fixed font-semibold text-on-primary-fixed" : "bg-surface-container"}`}>
              {KIND_LABELS[kind]}
            </button>;
          })}
        </div>
      </div>

      {error && <p role="alert" className="rounded-xl bg-tertiary-fixed p-4 text-sm text-on-tertiary-fixed">{error}</p>}
      {unavailable.length > 0 && <p className="text-sm text-on-surface-variant">Certaines informations ne sont pas fournies par OpenStreetMap : {unavailable.join(", ")}.</p>}
      {loading && <p role="status" className="text-sm text-on-surface-variant">Recherche des restaurants…</p>}

      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
        <div className="relative z-0 h-[420px] overflow-hidden rounded-2xl shadow-inner lg:col-span-8 lg:h-[520px]">
          {center ? <CampusMap center={center} spots={visible} selectedId={selectedId} onSelect={setSelectedId} /> :
            <div className="flex h-full items-center justify-center bg-surface-container-high p-6 text-center text-sm text-on-surface-variant">Autorise ta position ou saisis une adresse pour afficher les restaurants autour de toi.</div>}
        </div>
        <div className="flex flex-col gap-3 lg:col-span-4">
          <h2 className="font-headline text-xl font-bold">{visible.length} restaurant{visible.length === 1 ? "" : "s"} trouvé{visible.length === 1 ? "" : "s"}</h2>
          {!loading && center && !error && visible.length === 0 && <p className="text-sm text-on-surface-variant">Aucun résultat dans ce rayon.</p>}
          <ul className="flex max-h-[440px] flex-col gap-2.5 overflow-y-auto pr-1">
            {visible.map((spot) => <li key={spot.id}>
              <button type="button" aria-pressed={spot.id === selectedId} onClick={() => setSelectedId(spot.id)}
                className={`flex w-full items-start gap-3 rounded-xl bg-surface-container-lowest p-4 text-left shadow-sm ${spot.id === selectedId ? "border-l-4 border-l-primary" : ""}`}>
                <Utensils size={19} className="mt-0.5 shrink-0 text-primary" />
                <span className="min-w-0 flex-1">
                  <strong className="block text-sm">{spot.name}</strong>
                  <span className="mt-1 block text-xs text-on-surface-variant">{spot.distance_m} m · {spot.cuisines.join(", ") || "Cuisine non renseignée"}</span>
                  <span className="mt-1 block text-xs text-on-surface-variant">{spot.address || "Adresse non renseignée"} · Prix et attente indisponibles</span>
                </span>
              </button>
            </li>)}
          </ul>
          <p className="text-xs text-on-surface-variant">Données géographiques © OpenStreetMap contributors.</p>
        </div>
      </div>
    </div>
  );
}
