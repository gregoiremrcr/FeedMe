"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/restaurant";
import { Criteria, WISHES } from "@/lib/search";
import SearchForm from "@/components/home/SearchForm";

export default function HomeSearch() {
  const [criteria, setCriteria] = useState<Criteria | null>(null);

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-12 lg:px-12 lg:py-16">
      <div className="flex max-w-3xl flex-col gap-10">
        <div>
          <h1 className="font-headline text-5xl font-medium leading-[1.05] tracking-tight sm:text-6xl">
            T’as faim ? Dis-nous{" "}
            <span className="rounded-md bg-accent px-2 [box-decoration-break:clone]">
              ce qu’il te reste.
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-on-surface-variant">
            Ton adresse, ton budget, ton envie : on te sort les meilleurs plans autour de toi.
          </p>
        </div>

        <SearchForm onSubmit={setCriteria} />

        {/* TEMPORAIRE : remplacé par les résultats à l'étape 5 */}
        {criteria && (
          <div
            role="status"
            className="rounded-2xl border border-dashed border-on-surface-variant p-6 text-sm"
          >
            <p className="font-bold">Critères reçus (les résultats arrivent à l’étape 5)</p>
            <ul className="mt-2 space-y-1 text-on-surface-variant">
              <li>Lieu : {criteria.place.label}</li>
              <li>Budget : {formatPrice(criteria.budget)}</li>
              <li>
                Envies :{" "}
                {criteria.wishes.length
                  ? criteria.wishes.map((id) => WISHES.find((w) => w.id === id)?.label).join(", ")
                  : "aucune"}
              </li>
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}