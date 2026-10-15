import type { Restaurant } from "@/lib/restaurants";

export type Spot = Restaurant;
export type SpotKind = "restaurant" | "fast_food" | "cafe";

export const KIND_LABELS: Record<SpotKind, string> = {
  restaurant: "Restaurant",
  fast_food: "Restauration rapide",
  cafe: "Café",
};
