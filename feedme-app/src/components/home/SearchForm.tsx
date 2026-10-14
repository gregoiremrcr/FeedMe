"use client";

import { SyntheticEvent, useState } from "react";
import { AlertCircle, ArrowRight, Check } from "lucide-react";
import LocationPicker from "@/components/location/LocationPicker";
import { Place } from "@/lib/geocode";
import { formatPrice } from "@/lib/restaurant";
import {
  BUDGET_MAX,
  BUDGET_MIN,
  BUDGET_STEP,
  budgetLabel,
  Criteria,
  DEFAULT_PREFILL,
  Prefill,
  WishId,
  WISHES,
} from "@/lib/search";
import BudgetSlider from "./BudgetSlider";

const PLACE_INPUT_ID = "place-input";

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

type Props = {
  initial?: Prefill;
  onSubmit: (criteria: Criteria) => void;
  onCancel?: () => void;
};

export default function SearchForm({ initial = DEFAULT_PREFILL, onSubmit, onCancel }: Props) {
  const [place, setPlace] = useState<Place | null>(initial.place);
  const [budget, setBudget] = useState(initial.budget);
  const [wishes, setWishes] = useState<WishId[]>(initial.wishes);
  const [submitted, setSubmitted] = useState(false);

  const missingPlace = submitted && !place;

  const toggleWish = (id: WishId) =>
    setWishes((current) => (current.includes(id) ? current.filter((w) => w !== id) : [...current, id]));

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    if (!place) {
      document.getElementById(PLACE_INPUT_ID)?.focus();
      return;
    }
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
        <LocationPicker value={place} onChange={setPlace} invalid={missingPlace} inputId={PLACE_INPUT_ID} />
        {missingPlace && (
          <p
            role="alert"
            className="mt-2 flex items-center gap-2 rounded-lg bg-tertiary-fixed px-3 py-2.5 text-sm font-semibold text-on-tertiary-fixed"
          >
            <AlertCircle size={18} aria-hidden="true" className="shrink-0" />
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
                className={`inline-flex h-10 items-center gap-1.5 rounded-[10px] border px-4 text-sm transition-colors ${
                  active
                    ? "border-primary bg-primary font-semibold text-on-primary"
                    : "border-surface-container-high bg-surface-container-lowest font-medium hover:border-on-surface"
                }`}
              >
                {active && <Check size={15} aria-hidden="true" />}
                {label}
              </button>
            );
          })}
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="h-[52px] px-5 text-sm font-semibold text-on-surface-variant transition-colors hover:text-on-surface"
          >
            Annuler
          </button>
        )}
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