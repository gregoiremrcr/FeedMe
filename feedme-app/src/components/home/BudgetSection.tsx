"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Bike } from "lucide-react";
import { formatPrice } from "../../lib/restaurant";

const filters = [
  "⚡ À emporter vite",
  "🍲 Plat chaud réconfortant",
  "🌱 100% Végé",
  "🎓 Formule étudiante",
];

function getBudgetBadge(value: number) {
  if (value <= 5) return { text: "Gros radin malin ", style: "bg-surface-container text-tertiary" };
  if (value <= 7.5) return { text: "Imbattable ", style: "bg-primary-fixed text-on-primary-fixed" };
  if (value <= 10) return { text: "Menu complet ", style: "bg-surface-container text-on-surface" };
  return { text: "Festin de roi ", style: "bg-primary text-on-primary" };
}

export default function BudgetSection() {
  const [budget, setBudget] = useState(6.5);
  const [activeFilters, setActiveFilters] = useState<string[]>([filters[0]]);

  const badge = getBudgetBadge(budget);

  const toggleFilter = (filter: string) =>
    setActiveFilters((current) =>
      current.includes(filter) ? current.filter((f) => f !== filter) : [...current, filter]
    );

  return (
    <section className="relative w-full overflow-hidden px-6 pb-16 pt-8 lg:px-12">
      <div className="pointer-events-none absolute -top-32 right-10 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-surface-container px-4 py-1.5 shadow-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Campus Arch • Midi express ⏱️
          </span>
        </div>

        <h1 className="max-w-4xl font-headline text-5xl font-bold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
          T’as faim ? On a ton plan à{" "}
          <span className="italic font-normal text-primary underline decoration-primary/30 underline-offset-8">
            moins de 7 €.
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-on-surface-variant sm:text-lg">
          Dis-nous combien il te reste en poche, l’assistant et les potes du campus te trouvent la
          pépite à 5 min à pied.
        </p>

        <div className="mt-12 flex w-full max-w-3xl flex-col gap-8 rounded-[24px] bg-surface-container-lowest p-8 text-left shadow-[0_4px_30px_rgba(58,48,42,0.06)] sm:p-10">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
                Ton budget max ce midi
              </span>
              <div className="mt-1 flex items-baseline gap-3">
                <span className="font-headline text-5xl font-bold leading-none sm:text-6xl">
                  {formatPrice(budget)}
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge.style}`}>
                  {badge.text}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
              <BadgeCheck size={16} className="text-primary" />
              14 spots ouverts actuellement
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <input
              type="range"
              min={3}
              max={15}
              step={0.5}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              aria-label="Budget maximum pour le midi"
              className="h-3 w-full cursor-pointer appearance-none rounded-lg bg-surface-container accent-primary"
            />
            <div className="flex justify-between px-1 text-xs font-medium text-secondary">
              {[3, 6, 9, 12, 15].map((n) => (
                <span key={n}>{n} €</span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
              Tes envies immédiates
            </span>
            <div className="flex flex-wrap gap-2.5">
              {filters.map((filter) => {
                const active = activeFilters.includes(filter);
                return (
                  <button
                    key={filter}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleFilter(filter)}
                    className={`rounded-xl px-4 py-2 text-xs transition-all sm:text-sm ${
                      active
                        ? "bg-primary-fixed font-semibold text-on-primary-fixed shadow-sm"
                        : "bg-surface-container font-medium hover:bg-surface-container-high"
                    }`}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 pt-2 sm:flex-row">
            <div className="order-2 flex items-center gap-2 text-xs text-on-surface-variant sm:order-1">
              <Bike size={18} className="text-tertiary" />
              Aucune livraison payante • Trajets à pied uniquement
            </div>
            <Link
              href={`/carte?budget=${budget}`}
              className="order-1 inline-flex w-full items-center justify-center gap-3 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-on-primary shadow-md transition-all hover:opacity-90 active:scale-[0.99] sm:order-2 sm:w-auto"
            >
              Montre-moi tout autour
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}