"use client";

import { FormEvent, useState } from "react";
import { Bot, MapPin, Search, Utensils } from "lucide-react";
import { restaurantApi, ChatTurn, Restaurant } from "@/lib/restaurants";

export default function AssistantSection() {
  const [query, setQuery] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [results, setResults] = useState<Restaurant[]>([]);
  const [sources, setSources] = useState<{ name: string; url: string; date?: string }[]>([]);
  const [location, setLocation] = useState<{ lat: number; lon: number } | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError("La géolocalisation n’est pas disponible. Tu peux indiquer une adresse dans ton message.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setLocation({ lat: coords.latitude, lon: coords.longitude }); setError(null); },
      () => setError("Position inaccessible. Autorise la localisation ou précise une adresse dans le chat."),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const message = query.trim();
    if (!message || loading) return;
    setLoading(true);
    setError(null);
    setSources([]);
    try {
      const response = await restaurantApi.ask({ message, history: turns, ...location });
      setTurns((current) => [...current, { role: "user", content: message }, { role: "assistant", content: response.answer }]);
      setResults(response.results);
      setSources(response.sources);
      setQuery("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "L’assistant est indisponible pour le moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mb-12 w-full px-6 py-10 lg:px-12">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[24px] bg-surface-container-low p-8 shadow-[0_4px_24px_rgba(58,48,42,0.03)] sm:p-12">
        <div className="relative z-10 grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <div className="flex flex-col gap-4 lg:col-span-7">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-surface-container-high px-3 py-1">
              <Bot size={16} className="text-primary" />
              <span className="text-xs font-semibold">Assistant FeedMe</span>
            </div>
            <h2 className="font-headline text-3xl font-bold leading-tight sm:text-4xl">Trouvons un restaurant près de toi.</h2>
            <p className="max-w-xl text-sm leading-relaxed text-on-surface-variant sm:text-base">
              Dis-moi ce que tu cherches. Tu peux autoriser ta position ou indiquer une adresse dans ton message.
            </p>
            <button type="button" onClick={requestLocation} className="inline-flex w-fit items-center gap-2 rounded-xl bg-surface-container px-4 py-2.5 text-sm font-semibold">
              <MapPin size={17} /> {location ? "Position autorisée" : "Utiliser ma position"}
            </button>
            <form onSubmit={handleSubmit} className="mt-1 flex max-w-xl flex-col items-stretch gap-2.5 sm:flex-row">
              <label className="sr-only" htmlFor="assistant-query">Demande de recherche</label>
              <input id="assistant-query" type="text" value={query} onChange={(event) => setQuery(event.target.value)}
                maxLength={4000} placeholder="Ex. un restaurant italien près de la gare, pas trop cher…"
                className="w-full min-w-0 flex-1 rounded-xl bg-surface-container-lowest px-4 py-3.5 text-sm shadow-sm placeholder:text-secondary/70 focus:outline-none focus:ring-2 focus:ring-primary/40" />
              <button type="submit" disabled={loading || !query.trim()}
                className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-on-primary disabled:opacity-60">
                {loading ? "Recherche…" : "Rechercher"}<Search size={17} />
              </button>
            </form>
            {error && <p role="alert" className="rounded-xl bg-tertiary-fixed p-3 text-sm text-on-tertiary-fixed">{error}</p>}
            <div aria-live="polite" className="flex flex-col gap-3">
              {turns.map((turn, index) => <p key={`${index}-${turn.role}`} className={`rounded-xl p-4 text-sm ${turn.role === "assistant" ? "bg-surface-container-lowest text-on-surface-variant" : "bg-primary-fixed text-on-primary-fixed"}`}>
                <strong>{turn.role === "assistant" ? "FeedMe" : "Toi"} : </strong>{turn.content}
              </p>)}
              {loading && <p role="status" className="text-sm text-on-surface-variant">Recherche en cours…</p>}
            </div>
            {sources.length > 0 && <div className="text-xs text-on-surface-variant">
              <p className="font-semibold">Sources consultées</p>
              <ul className="mt-1 flex flex-col gap-1">{sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer" className="underline">{source.name}</a>{source.date && ` · ${source.date}`}</li>)}</ul>
            </div>}
          </div>

          <div className="flex flex-col gap-3 lg:col-span-5">
            <h3 className="font-headline text-xl font-bold">Restaurants trouvés</h3>
            {results.length === 0 && <p className="rounded-xl bg-surface-container-lowest p-4 text-sm text-on-surface-variant">Les résultats de recherche apparaîtront ici.</p>}
            {results.map((restaurant) => <article key={restaurant.id} className="rounded-2xl bg-surface-container-lowest p-5 shadow-sm">
              <h4 className="flex items-center gap-2 font-bold"><Utensils size={17} className="text-primary" />{restaurant.name}</h4>
              <p className="mt-2 text-sm text-on-surface-variant">{restaurant.distance_m} m · {restaurant.cuisines.join(", ") || "Cuisine non renseignée"}</p>
              <p className="mt-1 text-sm text-on-surface-variant">{restaurant.address || "Adresse non renseignée"}</p>
              <p className="mt-2 text-xs text-on-surface-variant">Prix, menu, avis et attente affichés uniquement s’ils sont vérifiables.</p>
              {restaurant.menu_url && <a href={restaurant.menu_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-primary underline">Voir le menu</a>}
              {restaurant.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-primary underline">Source : {source.name}</a>)}
            </article>)}
            <p className="text-xs text-on-surface-variant">Données géographiques © OpenStreetMap contributors.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
