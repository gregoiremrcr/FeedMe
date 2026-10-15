import type { Place } from "@/lib/geocode";

export const BUDGET_MIN = 3;
export const BUDGET_MAX = 15;
export const BUDGET_STEP = 0.5;
export const BUDGET_DEFAULT = 7.5;
export const WISHES = [
  { id: "fast", label: "Rapide" }, { id: "veggie", label: "Végétarien" },
  { id: "halal", label: "Halal" }, { id: "takeaway", label: "À emporter" },
] as const;
export type WishId = (typeof WISHES)[number]["id"];
export const RADII = [500, 1000, 2000, 5000] as const;
export type Radius = (typeof RADII)[number];
export const CUISINES = [
  { id: "french", label: "Français" }, { id: "italian", label: "Italien" },
  { id: "japanese", label: "Japonais" }, { id: "indian", label: "Indien" },
  { id: "fast_food", label: "Fast-food" }, { id: "cafe", label: "Café" }, { id: "other", label: "Autre" },
] as const;
export type CuisineId = (typeof CUISINES)[number]["id"];
export const DIETARY = [{ id: "vegetarian", label: "Végétarien" }, { id: "vegan", label: "Végan" }, { id: "halal", label: "Halal" }, { id: "gluten_free", label: "Sans gluten" }] as const;
export type DietaryId = (typeof DIETARY)[number]["id"];
export const ALLERGIES = [{ id: "peanuts", label: "Arachides" }, { id: "seafood", label: "Fruits de mer" }, { id: "dairy", label: "Produits laitiers" }, { id: "gluten", label: "Gluten" }] as const;
export type AllergyId = (typeof ALLERGIES)[number]["id"];
export const MEAL_TYPES = [{ id: "restaurant", label: "Restaurant" }, { id: "fast_food", label: "Fast-food" }, { id: "cafe", label: "Café" }, { id: "takeaway", label: "À emporter" }] as const;
export type MealType = (typeof MEAL_TYPES)[number]["id"];
export const SORTS = [{ id: "distance", label: "Distance" }, { id: "relevance", label: "Pertinence" }, { id: "rating", label: "Note" }] as const;
export type SortBy = (typeof SORTS)[number]["id"];
export type Filters = { radius_m: Radius; cuisines: CuisineId[]; dietary: DietaryId[]; allergies: AllergyId[]; dish_type: MealType | null; max_wait_minutes: number | null; sort_by: SortBy };
export type Criteria = { place: Place; budget: number; wishes: WishId[] } & Filters;
export type Prefill = { place: Place | null; budget: number; wishes: WishId[] } & Filters;
export const DEFAULT_FILTERS: Filters = { radius_m: 1000, cuisines: [], dietary: [], allergies: [], dish_type: null, max_wait_minutes: null, sort_by: "distance" };
export const DEFAULT_PREFILL: Prefill = { place: null, budget: BUDGET_DEFAULT, wishes: [], ...DEFAULT_FILTERS };
export const formatPrice = (value: number) => `${value.toFixed(2).replace(".", ",")} €`;
export function budgetLabel(value: number) { return value <= 5 ? "Petit budget" : value <= 7.5 ? "Ça passe bien" : value <= 10 ? "Menu complet" : "Jour de paie"; }
export function parsePrefill(search: string): Prefill {
  const p = new URLSearchParams(search); const budget = Number(p.get("budget"));
  const lat = Number(p.get("lat")); const lng = Number(p.get("lng")); const label = p.get("q")?.trim();
  const ids = WISHES.map((w) => w.id); const wishes = (p.get("wishes") ?? "").split(",").filter((id): id is WishId => ids.includes(id as WishId));
  const valid = <T extends readonly string[]>(values: T, key: string) => (p.get(key) ?? "").split(",").filter((id): id is T[number] => values.includes(id as T[number]));
  const radius = Number(p.get("radius"));
  const radius_m = (RADII as readonly number[]).includes(radius) ? radius as Radius : DEFAULT_FILTERS.radius_m;
  const cuisines = valid(CUISINES.map((x) => x.id), "cuisines") as CuisineId[];
  const dietary = valid(DIETARY.map((x) => x.id), "dietary") as DietaryId[];
  const allergies = valid(ALLERGIES.map((x) => x.id), "allergies") as AllergyId[];
  const meal = p.get("meal"); const dish_type = MEAL_TYPES.some((x) => x.id === meal) ? meal as MealType : null;
  const sort = p.get("sort"); const sort_by = SORTS.some((x) => x.id === sort) ? sort as SortBy : DEFAULT_FILTERS.sort_by;
  const waitValue = Number(p.get("wait"));
  const place = label && Number.isFinite(lat) && Number.isFinite(lng) ? { id: "url", label, lat, lng } : null;
  return { place, budget: Number.isFinite(budget) ? Math.min(BUDGET_MAX, Math.max(BUDGET_MIN, budget)) : BUDGET_DEFAULT, wishes, radius_m, cuisines, dietary, allergies, dish_type, max_wait_minutes: Number.isInteger(waitValue) && waitValue >= 0 ? waitValue : null, sort_by };
}
export function buildSearchString(criteria: Criteria) {
  const p = new URLSearchParams({ budget: String(criteria.budget), radius: String(criteria.radius_m), sort: criteria.sort_by });
  if (criteria.wishes.length) p.set("wishes", criteria.wishes.join(","));
  if (criteria.cuisines.length) p.set("cuisines", criteria.cuisines.join(","));
  if (criteria.dietary.length) p.set("dietary", criteria.dietary.join(","));
  if (criteria.allergies.length) p.set("allergies", criteria.allergies.join(","));
  if (criteria.dish_type) p.set("meal", criteria.dish_type);
  if (criteria.max_wait_minutes !== null) p.set("wait", String(criteria.max_wait_minutes));
  if (criteria.place.id !== "geolocation") { p.set("lat", criteria.place.lat.toFixed(5)); p.set("lng", criteria.place.lng.toFixed(5)); p.set("q", criteria.place.label); }
  return `?${p}`;
}
