"use client";

import { KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { Crosshair, MapPin, X } from "lucide-react";
import { getCurrentPlace, LocateError, MIN_QUERY_LENGTH, Place, suggestPlaces } from "@/lib/geocode";

type Props = {
  value: Place | null;
  onChange: (place: Place | null) => void;
  invalid?: boolean;
  inputId?: string;
};

const LOCATE_MESSAGES = {
  denied: "Localisation refusée. Tu peux plutôt écrire ton adresse.",
  unavailable: "Impossible de te localiser pour l’instant. Écris plutôt ton adresse.",
  unsupported: "Ton navigateur ne gère pas la localisation. Écris ton adresse.",
};

export default function LocationPicker({ value, onChange, invalid = false, inputId }: Props) {
  const generatedId = useId();
  const id = inputId ?? generatedId;
  const listId = `${id}-list`;
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState(value?.label ?? "");
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [searchedFor, setSearchedFor] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [active, setActive] = useState(-1);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  const trimmed = query.trim();
  const canSearch = open && trimmed.length >= MIN_QUERY_LENGTH && trimmed !== value?.label;
  const list = canSearch ? suggestions : [];
  const noResult = canSearch && !searching && !searchError && searchedFor === trimmed && list.length === 0;

  useEffect(() => {
    if (!canSearch) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      setSearchError(false);
      try {
        const places = await suggestPlaces(trimmed, controller.signal);
        if (controller.signal.aborted) return;
        setSuggestions(places);
        setSearchedFor(trimmed);
        setActive(-1);
      } catch {
        if (!controller.signal.aborted) setSearchError(true);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [canSearch, trimmed]);

  const select = (place: Place) => {
    onChange(place);
    setQuery(place.label);
    setOpen(false);
    setLocateError(null);
  };

  const handleInput = (text: string) => {
    setQuery(text);
    setOpen(true);
    setLocateError(null);
    if (value) onChange(null); // l'utilisateur modifie : l'ancien choix n'est plus valide
  };

  const clear = () => {
    setQuery("");
    setSuggestions([]);
    setSearchedFor(null);
    onChange(null);
    inputRef.current?.focus();
  };

  const locate = async () => {
    setLocating(true);
    setLocateError(null);
    try {
      select(await getCurrentPlace());
    } catch (e) {
      setLocateError(LOCATE_MESSAGES[e instanceof LocateError ? e.kind : "unavailable"]);
    } finally {
      setLocating(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, list.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && open && active >= 0 && list[active]) {
      e.preventDefault();
      select(list[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showPanel = open && (list.length > 0 || noResult || searchError || searching);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div
          ref={wrapperRef}
          className="relative flex-1"
          onBlur={(e) => {
            if (!wrapperRef.current?.contains(e.relatedTarget)) setOpen(false);
          }}
        >
          <label htmlFor={id} className="sr-only">
            Ton adresse ou ta position
          </label>
          <MapPin
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-secondary"
          />
          <input
            ref={inputRef}
            id={id}
            type="text"
            role="combobox"
            aria-expanded={showPanel}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-invalid={invalid}
            aria-activedescendant={active >= 0 ? `${id}-option-${active}` : undefined}
            autoComplete="off"
            maxLength={120}
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Ton adresse, ta fac, ta rue…"
            className={`h-[52px] w-full rounded-xl border bg-surface-container-lowest pl-11 pr-11 text-[15px] transition placeholder:text-secondary/70 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 ${
              invalid ? "border-tertiary" : "border-surface-container-high"
            }`}
          />
          {query && (
            <button
              type="button"
              onClick={clear}
              aria-label="Effacer l’adresse"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-secondary transition-colors hover:text-on-surface"
            >
              <X size={18} />
            </button>
          )}

          {showPanel && (
            <ul
              id={listId}
              role="listbox"
              aria-label="Adresses suggérées"
              className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 overflow-hidden rounded-xl border border-surface-container-high bg-surface-container-lowest shadow-lg"
            >
              {list.map((place, index) => (
                <li
                  key={place.id}
                  id={`${id}-option-${index}`}
                  role="option"
                  aria-selected={index === active}
                  onMouseDown={(e) => {
                    e.preventDefault(); // garde le focus dans le champ
                    select(place);
                  }}
                  onMouseEnter={() => setActive(index)}
                  className={`flex cursor-pointer items-center gap-3 px-4 py-3 text-sm ${
                    index === active ? "bg-surface-container" : ""
                  }`}
                >
                  <MapPin size={16} aria-hidden="true" className="shrink-0 text-secondary" />
                  <span>{place.label}</span>
                </li>
              ))}

              {searching && list.length === 0 && (
                <li role="presentation" className="px-4 py-3 text-sm text-on-surface-variant">
                  Recherche en cours…
                </li>
              )}
              {noResult && (
                <li role="presentation" className="px-4 py-3 text-sm text-on-surface-variant">
                  Aucune adresse trouvée. Essaie avec le nom de la rue ou de la ville.
                </li>
              )}
              {searchError && (
                <li role="presentation" className="px-4 py-3 text-sm text-tertiary">
                  La recherche d’adresse est indisponible. Réessaie dans un instant.
                </li>
              )}
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={locate}
          disabled={locating}
          className="inline-flex h-[52px] shrink-0 items-center justify-center gap-2 rounded-xl border border-on-surface bg-surface-container-lowest px-5 text-sm font-semibold transition-colors hover:bg-surface-container disabled:opacity-60"
        >
          <Crosshair size={18} aria-hidden="true" className={locating ? "animate-pulse" : ""} />
          {locating ? "Localisation…" : "Me localiser"}
        </button>
      </div>

      <p role="status" className="min-h-5 text-xs text-on-surface-variant">
        {locateError ? (
          <span className="text-tertiary">{locateError}</span>
        ) : value?.id === "geolocation" ? (
          "Ta position sert uniquement à cette recherche, on ne l’enregistre pas."
        ) : null}
      </p>
    </div>
  );
}