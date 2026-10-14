"use client";

import { useEffect, useRef, useState } from "react";
import { SearchX } from "lucide-react";
import { getRecommendations, Recommendations } from "../../lib/recommendations";
import { formatPrice } from "../../lib/restaurant";
import { Criteria } from "../../lib/search";
import ResultsView from "./ResultsView";
import SearchForm from "./SearchForm";

type Status = "idle" | "loading" | "error" | "done";

export default function HomeSearch() {
  const [criteria, setCriteria] = useState<Criteria | null>(null);
  const [result, setResult] = useState<Recommendations | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const controllerRef = useRef<AbortController | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  useEffect(() => {
    if (status === "loading") {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [status]);

  const search = async (next: Criteria) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setCriteria(next);
    setStatus("loading");

    try {
      const data = await getRecommendations(next, controller.signal);
      if (controller.signal.aborted) return;
      setResult(data);
      setStatus("done");
    } catch {
      if (!controller.signal.aborted) setStatus("error");
    }
  };

  const empty = status === "done" && result !== null && result.picks.length === 0;

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

        <SearchForm onSubmit={search} />
      </div>

      <div ref={resultsRef} className="mt-14 scroll-mt-24" aria-live="polite">
        {status === "loading" && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12" aria-label="Recherche en cours">
            <div className="flex flex-col gap-4 lg:col-span-5">
              <div className="h-10 w-3/4 animate-pulse rounded-lg bg-surface-container-high" />
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-surface-container-low" />
              ))}
            </div>
            <div className="h-[420px] animate-pulse rounded-2xl bg-surface-container-low lg:col-span-7 lg:h-[640px]" />
          </div>
        )}

        {status === "error" && criteria && (
          <div role="alert" className="max-w-xl rounded-2xl bg-tertiary-fixed p-6 text-on-tertiary-fixed">
            <p className="font-bold">On n’a pas réussi à charger les plans.</p>
            <p className="mt-1 text-sm">Vérifie ta connexion, puis réessaie.</p>
            <button
              type="button"
              onClick={() => search(criteria)}
              className="mt-4 h-10 rounded-lg bg-on-surface px-5 text-sm font-bold text-surface"
            >
              Réessayer
            </button>
          </div>
        )}

        {empty && criteria && (
          <div className="max-w-xl rounded-2xl border border-surface-container-high bg-surface-container-lowest p-8">
            <SearchX size={28} aria-hidden="true" className="text-primary" />
            <h2 className="mt-4 font-headline text-3xl font-medium leading-tight">
              Rien à {formatPrice(criteria.budget)} par ici.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
              Monte un peu ta jauge de budget, retire une envie ou change d’adresse, puis relance
              la recherche.
            </p>
          </div>
        )}

        {status === "done" && !empty && criteria && result && (
          <ResultsView criteria={criteria} result={result} />
        )}
      </div>
    </section>
  );
}