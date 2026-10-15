import { restaurantApi, type Restaurant } from "@/lib/restaurants";
import type { Criteria } from "@/lib/search";
export type Pick = { restaurant: Restaurant; reason: string };
export type Recommendations = { summary: string; picks: Pick[]; location: { lat: number; lon: number }; unavailableFilters: string[] };
export async function getRecommendations(criteria: Criteria): Promise<Recommendations> {
  const wishDiet = criteria.wishes.includes("veggie") ? ["vegetarian"] : criteria.wishes.includes("halal") ? ["halal"] : [];
  const response = await restaurantApi.search({ lat: criteria.place.lat, lon: criteria.place.lng, radius_m: criteria.radius_m, max_price_eur: criteria.budget, cuisines: criteria.cuisines, dietary: [...criteria.dietary, ...wishDiet], allergies: criteria.allergies, dish_type: criteria.dish_type ?? undefined, max_wait_minutes: criteria.max_wait_minutes ?? undefined, sort_by: criteria.sort_by });
  const results = criteria.wishes.includes("fast") ? [...response.results].sort((a, b) => (a.wait_minutes ?? 999) - (b.wait_minutes ?? 999)) : response.results;
  return { summary: results.length ? `${results.length} résultats trouvés.` : "Aucun restaurant ne correspond à ces filtres.", picks: results.map((restaurant) => ({ restaurant, reason: restaurant.address ?? "Une option proche de ta position." })), location: response.location, unavailableFilters: response.unavailable_filters };
}
