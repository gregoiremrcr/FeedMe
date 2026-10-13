"use client";

import { FormEvent, useState } from "react";
import { Bot, Coffee, Search, Sparkles, Users, Zap } from "lucide-react";

export default function AssistantSection() {
  const [query, setQuery] = useState("");
  const [answered, setAnswered] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // TODO : appeler l’API backend (FastAPI) qui interroge Claude
    setAnswered(true);
  };

  return (
    <section className="mb-12 w-full px-6 py-10 lg:px-12">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[24px] bg-surface-container-low p-8 shadow-[0_4px_24px_rgba(58,48,42,0.03)] sm:p-12">
        <div className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-primary/10 blur-2xl" />

        <div className="relative z-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          <div className="flex flex-col gap-4 lg:col-span-7">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-surface-container-high px-3 py-1">
              <Bot size={16} className="text-primary" />
              <span className="text-xs font-semibold">Assistant IA Casse-Croûte</span>
            </div>
            <h2 className="font-headline text-3xl font-bold leading-tight sm:text-4xl">
              T’as seulement 15 minutes entre deux amphis ?
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-on-surface-variant sm:text-base">
              L’assistant IA te déniche le sandwich le plus rapide sans faire la queue. Spécifie tes
              envies ou ton bâtiment d’études, il calcule la foule en temps réel.
            </p>

            <form onSubmit={handleSubmit} className="mt-3 flex max-w-xl flex-col items-stretch gap-2.5 sm:flex-row">
              <div className="relative flex-1">
                <Search size={20} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Question pour l’assistant"
                  placeholder="Pose ta question (ex: un pad thaï pas cher à côté du labo)..."
                  className="w-full rounded-xl bg-surface-container-lowest py-3.5 pl-11 pr-4 text-xs shadow-sm placeholder:text-secondary/70 focus:outline-none focus:ring-2 focus:ring-primary/40 sm:text-sm"
                />
              </div>
              <button
                type="submit"
                className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-xs font-semibold text-on-primary shadow-sm transition-all hover:opacity-90 active:scale-[0.98] sm:text-sm"
              >
                Demander à l’IA
                <Zap size={17} />
              </button>
            </form>

            {answered && (
              <div className="mt-2 rounded-xl bg-surface-container-lowest p-4 text-xs sm:text-sm">
                <div className="mb-1 flex items-center gap-2 font-semibold text-primary">
                  <Sparkles size={18} />
                  Recommandation éclair pour toi :
                </div>
                <p className="text-on-surface-variant">
                  File au <strong>Fournil des Arts (2 min)</strong> : 0 personne en caisse
                  actuellement et la formule quiche + cookie à 4,90 € est prête à emporter !
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 lg:col-span-5">
            <div className="flex flex-col gap-3 rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-tertiary">
                  Bon plan du jour
                </span>
                <span className="rounded bg-tertiary-fixed px-2 py-0.5 text-[11px] font-bold text-on-tertiary-fixed">
                  -20% sur la carte
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Coffee size={26} />
                </div>
                <div>
                  <h4 className="font-headline text-lg font-bold leading-tight">Café de la Passerelle</h4>
                  <p className="mt-0.5 text-xs text-on-surface-variant">
                    Espresso offert pour tout wrap étudiant acheté
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 text-xs text-secondary">
                <span>
                  Code : <strong className="text-on-surface">CAMPUS20</strong>
                </span>
                <span className="font-medium text-primary">Jusqu’à 14h30</span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-surface-container p-4 text-xs text-on-surface-variant">
              <span className="flex items-center gap-2">
                <Users size={18} className="text-primary" />
                324 étudiants ont mangé pour &lt; 6 € aujourd’hui
              </span>
              <span className="font-bold text-on-surface">#Solidarité</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}