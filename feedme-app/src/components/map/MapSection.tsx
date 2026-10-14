"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Utensils } from "lucide-react";
import { formatPrice } from "@/lib/restaurant";
import { getSpots, KIND_LABELS, Spot, SpotKind } from "@/lib/spots";

const CampusMap = dynamic(() => import("./CampusMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-surface-container-high" />,
});

const ALL_KINDS = Object.keys(KIND_LABELS) as SpotKind[];

export default function MapSection() {
  const [budget, setBudget] = useState(8);
  const [kinds, setKinds] = useState<SpotKind[]>(ALL_KINDS);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSpots(budget)
      .then((data) => {
        if (!cancelled) {
          setSpots(data);
          setError(null);
        }
      })
      .catch(() => !cancelled && setError("Impossible de charger les restaurants."));
    return () => {
      cancelled = true;
    };
  }, [budget]);

  const visible = spots.filter((s) => kinds.includes(s.kind));

  const toggleKind = (kind: SpotKind) =>
    setKinds((current) =>
      current.includes(kind) ? current.filter((k) => k !== kind) : [...current, kind]
    );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-5 rounded-2xl bg-surface-container-lowest p-6 shadow-sm md:flex-row md:items-end md:justify-between">
        <div className="flex-1">
          <label htmlFor="budget" className="text-xs font-semibold uppercase tracking-wider text-secondary">
            Ton budget max
          </label>
          <div className="mt-1 flex items-center gap-4">
            <span className="w-24 font-headline text-4xl font-bold">{formatPrice(budget)}</span>
            <input
              id="budget"
              type="range"
              min={3}
              max={15}
              step={0.5}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="h-3 flex-1 cursor-pointer appearance-none rounded-lg bg-surface-container accent-primary"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {ALL_KINDS.map((kind) => {
            const active = kinds.includes(kind);
            return (
              <button
                key={kind}
                type="button"
                aria-pressed={active}
                onClick={() => toggleKind(kind)}
                className={`rounded-xl px-4 py-2 text-sm transition-all ${
                  active
                    ? "bg-primary-fixed font-semibold text-on-primary-fixed shadow-sm"
                    : "bg-surface-container font-medium hover:bg-surface-container-high"
                }`}
              >
                {KIND_LABELS[kind]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
        <div className="relative z-0 h-[420px] overflow-hidden rounded-2xl shadow-inner lg:col-span-8 lg:h-[520px]">
          <CampusMap spots={visible} selectedId={selectedId} onSelect={setSelectedId} />
        </div>

        <div className="flex flex-col gap-3 lg:col-span-4">
          <h2 className="font-headline text-xl font-bold">
            {visible.length} spot{visible.length > 1 ? "s" : ""} à moins de {formatPrice(budget)}
          </h2>

          {error && <p className="text-sm text-tertiary">{error}</p>}
          {!error && visible.length === 0 && (
            <p className="text-sm text-on-surface-variant">
              Rien à ce prix-là. Monte un peu ton budget ou ajoute un type de lieu.
            </p>
          )}

          <ul className="flex max-h-[440px] flex-col gap-2.5 overflow-y-auto pr-1">
            {visible.map((spot) => {
              const active = spot.id === selectedId;
              return (
                <li key={spot.id}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedId(spot.id)}
                    className={`flex w-full items-center justify-between rounded-xl bg-surface-container-lowest p-3.5 text-left shadow-sm transition-all hover:shadow-md ${
                      active ? "border-l-4 border-l-primary" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          active ? "bg-primary-fixed text-primary" : "bg-surface-container"
                        }`}
                      >
                        <Utensils size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold">{spot.name}</h3>
                        <p className="text-xs text-on-surface-variant">
                          {spot.distanceM} m • {spot.walkMinutes} min • {KIND_LABELS[spot.kind]}
                        </p>
                      </div>
                    </div>
                    <span className={`font-bold ${active ? "text-primary" : ""}`}>
                      {spot.priceIsEstimate ? "~" : ""}
                      {formatPrice(spot.price)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}