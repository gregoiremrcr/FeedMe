"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { getRecommendations, type Recommendations } from "@/lib/recommendations";
import { buildSearchString, type Criteria, parsePrefill } from "@/lib/search";
import BudgetExamples from "./BudgetExamples";
import ResultsView from "./ResultsView";
import SearchForm from "./SearchForm";
export default function HomeSearch() {
  const [criteria, setCriteria] = useState<Criteria | null>(null);
  const [prefill] = useState(() => typeof window === "undefined" ? undefined : parsePrefill(window.location.search));
  const [result, setResult] = useState<Recommendations | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error" | "done">("idle");
  const last = useRef<Criteria | null>(null);
  const search = useCallback(async (next: Criteria) => { last.current = next; setCriteria(next); setState("loading"); window.history.replaceState(null, "", `/${buildSearchString(next)}`); try { setResult(await getRecommendations(next)); setState("done"); } catch { setState("error"); } }, []);
  useEffect(() => { if (prefill?.place) { const timer = window.setTimeout(() => void search(prefill as Criteria), 0); return () => window.clearTimeout(timer); } }, [prefill, search]);
  const initial = prefill?.place ? { ...prefill, place: prefill.place } : undefined;
  return <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-12 lg:py-16"><div className="grid gap-8 lg:grid-cols-12 lg:gap-10"><div className="flex min-w-0 flex-col gap-7 lg:col-span-7"><div><h1 className="font-headline text-4xl font-medium leading-tight sm:text-5xl lg:text-6xl">T’as faim ? Dis-nous <span className="rounded bg-primary-fixed px-2">ce qu’il te reste.</span></h1><p className="mt-4 max-w-xl text-sm leading-relaxed text-on-surface-variant sm:text-base">Ton adresse, ton budget, ton envie : on te sort les meilleurs plans autour de toi.</p></div><SearchForm onSubmit={search} initial={initial} /></div><BudgetExamples /></div><div className="mt-10 sm:mt-14" aria-live="polite">{state === "loading" && <p role="status">Recherche des restaurants…</p>}{state === "error" && <div role="alert" className="rounded-xl bg-tertiary-fixed p-5">Impossible de charger les recommandations. <button className="font-bold underline" onClick={() => last.current && search(last.current)}>Réessayer</button></div>}{state === "done" && criteria && result && <ResultsView criteria={criteria} result={result} onChange={search} />}</div></section>;
}
