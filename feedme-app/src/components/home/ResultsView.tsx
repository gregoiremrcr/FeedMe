"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Footprints } from "lucide-react";
import { formatPrice } from "@/lib/restaurant";
import { Recommendations } from "@/lib/recommendations";
import { KIND_LABELS } from "@/lib/spots";
import { Criteria } from "@/lib/search";
import FavoriteButton from "@/components/favorites/FavoriteButton";

const CampusMap = dynamic(() => import("@/components/map/CampusMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-surface-container-high" />,
});

const VISIBLE_COUNT = 3;

type Props = {
  criteria: Criteria;
  result: Recommendations;
};

export default function ResultsView({ criteria, result }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const { picks, summary } = result;
  const visible = showAll ? picks : picks.slice(0, VISIBLE_COUNT);
  const hasEstimate = picks.some((p) => p.spot.priceIsEstimate);
  const center: [number, number] = [criteria.place.lat, criteria.place.lng];

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-5">
        <h2 className="font-headline text-3xl font-medium leading-tight sm:text-4xl">{summary}</h2>
        {hasEstimate && (
          <p className="mt-2 text-sm text-on-surface-variant">Le ~ veut dire prix estimé.</p>
        )}

        <ol className="mt-4">
          {visible.map(({ spot, reason }, index) => {
            const active = spot.id === selectedId;
            return (
              <li key={spot.id} className="relative">
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedId(spot.id)}
                  className={`flex w-full gap-5 px-2 py-5 text-left transition-colors hover:bg-surface-container-low ${
                    active ? "bg-surface-container-low" : ""
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`w-7 shrink-0 font-headline text-3xl font-medium leading-none ${
                      index === 0 ? "text-primary" : ""
                    }`}
                  >
                    {index + 1}
                  </span>

                  <span className="flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="flex flex-wrap items-center gap-2 text-[17px] font-bold">
                        {spot.name}
                        {index === 0 && (
                          <span className="rounded-md bg-accent px-2 py-0.5 text-[11px] font-bold">
                            Notre pick
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-lg font-bold tabular-nums text-primary">
                        {spot.priceIsEstimate ? "~" : ""}
                        {formatPrice(spot.price)}
                      </span>
                    </span>

                    <span className="mt-1 flex items-center gap-1.5 text-[13px] font-medium text-on-surface-variant">
                      <Footprints size={14} aria-hidden="true" />
                      {spot.walkMinutes} min à pied · {spot.distanceM} m · {KIND_LABELS[spot.kind]}
                    </span>

                    <span className="mt-2.5 block pr-10 text-sm leading-relaxed">{reason}</span>
                  </span>
                </button>
                <div className="absolute bottom-3 right-3">
                <FavoriteButton spot={spot} />
                </div>
              </li>

            );
          })}
        </ol>

        {picks.length > VISIBLE_COUNT && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="mt-4 text-sm font-bold text-primary hover:underline"
          >
            {showAll ? "Voir moins" : `Voir les ${picks.length - VISIBLE_COUNT} autres →`}
          </button>
        )}
      </div>

      <div className="relative z-0 h-[420px] overflow-hidden rounded-2xl border border-surface-container-high lg:sticky lg:top-24 lg:col-span-7 lg:h-[640px]">
        <CampusMap
          spots={picks.map((p) => p.spot)}
          selectedId={selectedId}
          onSelect={setSelectedId}
          center={center}
        />
      </div>
    </div>
  );
}