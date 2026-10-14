import { Place } from "@/lib/geocode";

export const BUDGET_MIN = 3;
export const BUDGET_MAX = 15;
export const BUDGET_STEP = 0.5;
export const BUDGET_DEFAULT = 7.5;

export const WISHES = [
  { id: "hot", label: "Un truc chaud" },
  { id: "fast", label: "Pressé·e" },
  { id: "veggie", label: "Végétarien" },
  { id: "halal", label: "Halal" },
  { id: "takeaway", label: "À emporter" },
] as const;

export type WishId = (typeof WISHES)[number]["id"];

export type Criteria = {
  place: Place;
  budget: number;
  wishes: WishId[];
};

/** Critères pré-remplis (depuis l'URL) : le lieu peut manquer. */
export type Prefill = {
  place: Place | null;
  budget: number;
  wishes: WishId[];
};

export const DEFAULT_PREFILL: Prefill = {
  place: null,
  budget: BUDGET_DEFAULT,
  wishes: [],
};

export function budgetLabel(value: number): string {
  if (value <= 5) return "Mode radin malin";
  if (value <= 7.5) return "Ça passe bien";
  if (value <= 10) return "Menu complet";
  return "Jour de paie";
}

const WISH_IDS: string[] = WISHES.map((w) => w.id);

function clampBudget(value: number): number {
  const stepped = Math.round(value / BUDGET_STEP) * BUDGET_STEP;
  return Math.min(BUDGET_MAX, Math.max(BUDGET_MIN, stepped));
}

function readNumber(raw: string | null): number | null {
  if (raw === null || raw.trim() === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

/** Lit l'URL. Tout ce qui vient de l'URL est vérifié, rien n'est pris tel quel. */
export function parsePrefill(search: string): Prefill {
  const params = new URLSearchParams(search);

  const rawBudget = readNumber(params.get("budget"));
  const budget = rawBudget === null ? BUDGET_DEFAULT : clampBudget(rawBudget);

  const wishes = Array.from(
    new Set((params.get("wishes") ?? "").split(",").filter((w) => WISH_IDS.includes(w)))
  ) as WishId[];

  const lat = readNumber(params.get("lat"));
  const lng = readNumber(params.get("lng"));
  const label = (params.get("q") ?? "").trim().slice(0, 120);

  const place: Place | null =
    lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && label
      ? { id: "url", label, lat, lng }
      : null;

  return { place, budget, wishes };
}

/** Construit l'URL. Une position GPS n'est jamais écrite dans l'URL. */
export function buildSearchString(criteria: Criteria): string {
  const params = new URLSearchParams();
  params.set("budget", String(criteria.budget));
  if (criteria.wishes.length > 0) params.set("wishes", criteria.wishes.join(","));

  if (criteria.place.id !== "geolocation") {
    params.set("lat", criteria.place.lat.toFixed(5));
    params.set("lng", criteria.place.lng.toFixed(5));
    params.set("q", criteria.place.label);
  }

  return `?${params.toString()}`;
}