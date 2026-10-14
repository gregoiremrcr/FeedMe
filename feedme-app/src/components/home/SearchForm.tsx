"use client";

import { SyntheticEvent, useState } from "react";
import { ArrowRight } from "lucide-react";
import BudgetSlider from "./BudgetSlider";
import LocationPicker from "@/components/location/LocationPicker";
import { Place } from "@/lib/geocode";
import { formatPrice } from "@/lib/restaurant";
import {
  BUDGET_DEFAULT,
  BUDGET_MAX,
  BUDGET_MIN,
  BUDGET_STEP,
  budgetLabel,
  Criteria,
  WishId,
  WISHES,
} from "@/lib/search";

function StepTitle({ n, id, children }: { n: number; id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mb-3 flex items-center gap-3">
      <span
        aria-hidden="true"
        className="flex h-6 w-6 items-center justify-center rounded-full border border-on-surface text-xs font-bold"
      >
        {n}
      </span>
      <span className="text-xs font-bold uppercase tracking-[0.08em] text-on-surface-variant">
        {children}
      </span>
    </h2>
  );
}

export default function SearchForm({ onSubmit }: { onSubmit: (criteria: Criteria) => void }) {
  const [place, setPlace] = useState<Place | null>(null);
  const [budget, setBudget] = useState(BUDGET_DEFAULT);
  const [wishes, setWishes] = useState<WishId[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const missingPlace = submitted && !place;

  const toggleWish = (id: WishId) =>
    setWishes((current) => (current.includes(id) ? current.filter((w) => w !== id) : [...current, id]));

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    if (!place) return;
    onSubmit({ place, budget, wishes });
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-8 rounded-2xl border border-surface-container-high bg-surface-container-lowest p-6 sm:p-8"
    >
      <section aria-labelledby="step-place">
        <StepTitle n={1} id="step-place">T’es où ?</StepTitle>
        <LocationPicker value={place} onChange={setPlace} />
        {missingPlace && (
          <p role="alert" className="mt-1 text-sm font-medium text-tertiary">
            Dis-nous où tu es pour qu’on cherche autour de toi.
          </p>
        )}
      </section>

      <section aria-labelledby="step-budget">
        <StepTitle n={2} id="step-budget">Ton budget du jour</StepTitle>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <span
            className="w-[140px] font-headline text-5xl font-medium leading-none tabular-nums"
            aria-live="polite"
          >
            {formatPrice(budget)}
          </span>
          <span className="rounded-md bg-accent px-2.5 py-1 text-xs font-bold text-on-surface">
            {budgetLabel(budget)}
          </span>
        </div>
        <BudgetSlider
        value={budget}
        min={BUDGET_MIN}
        max={BUDGET_MAX}
        step={BUDGET_STEP}
        onChange={setBudget}
        labelledBy="step-budget"
        valueText={formatPrice(budget)}
        />
        <div className="mt-2 flex justify-between text-xs font-medium text-on-surface-variant">
          <span>{BUDGET_MIN} €</span>
          <span>9 €</span>
          <span>{BUDGET_MAX} €</span>
        </div>
      </section>

      <section aria-labelledby="step-wishes">
        <StepTitle n={3} id="step-wishes">Ton envie du moment (optionnel)</StepTitle>
        <div role="group" aria-labelledby="step-wishes" className="flex flex-wrap gap-2">
          {WISHES.map(({ id, label }) => {
            const active = wishes.includes(id);
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                onClick={() => toggleWish(id)}
                className={`h-10 rounded-[10px] px-4 text-sm transition-colors ${
                  active
                    ? "bg-on-surface font-semibold text-surface"
                    : "border border-surface-container-high font-medium hover:border-on-surface"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-7 text-[15px] font-bold text-on-primary transition-opacity hover:opacity-90 active:scale-[0.99] sm:w-auto"
        >
          Trouve-moi à manger
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}