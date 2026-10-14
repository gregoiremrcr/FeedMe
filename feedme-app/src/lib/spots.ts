export type SpotKind = "restaurant" | "fast_food" | "cafe";

export type Spot = {
  id: string;
  name: string;
  kind: SpotKind;
  description: string;
  price: number; // prix moyen d'un repas en €
  priceIsEstimate: boolean;
  walkMinutes: number;
  distanceM: number;
  lat: number;
  lng: number;
};

export const KIND_LABELS: Record<SpotKind, string> = {
  restaurant: "Restaurant",
  fast_food: "Fast-food",
  cafe: "Café",
};

export const CAMPUS_CENTER: [number, number] = [48.9145, 2.368];

const MOCK_SPOTS: Spot[] = [
  { id: "1", name: "Le Fournil des Arts", kind: "cafe", description: "Formule quiche + cookie", price: 4.9, priceIsEstimate: false, walkMinutes: 2, distanceM: 140, lat: 48.9152, lng: 2.3688 },
  { id: "2", name: "La Cantine d’Émile", kind: "fast_food", description: "Sandwich baguette + boisson", price: 5.2, priceIsEstimate: false, walkMinutes: 3, distanceM: 250, lat: 48.9138, lng: 2.3664 },
  { id: "3", name: "Chez Marcel Smash", kind: "fast_food", description: "Smash burger du jour", price: 6.5, priceIsEstimate: true, walkMinutes: 4, distanceM: 320, lat: 48.9159, lng: 2.3658 },
  { id: "4", name: "Bao & Bol", kind: "restaurant", description: "Nouilles sautées tofu ou poulet", price: 6.8, priceIsEstimate: false, walkMinutes: 5, distanceM: 380, lat: 48.9131, lng: 2.3702 },
  { id: "5", name: "Café de la Passerelle", kind: "cafe", description: "Wrap étudiant + espresso", price: 7.5, priceIsEstimate: true, walkMinutes: 6, distanceM: 450, lat: 48.9165, lng: 2.3712 },
  { id: "6", name: "Trattoria Bella", kind: "restaurant", description: "Pâtes fraîches du jour", price: 11.9, priceIsEstimate: true, walkMinutes: 7, distanceM: 520, lat: 48.9124, lng: 2.3645 },
  { id: "7", name: "Le Bistrot du Parvis", kind: "restaurant", description: "Plat + dessert", price: 14.5, priceIsEstimate: true, walkMinutes: 8, distanceM: 610, lat: 48.9171, lng: 2.3649 },
];

/**
 * TODO (quand l'API existe) : remplacer le contenu par
 *   const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/restaurants?lat=...&lng=...&budget=${budget}`);
 *   return res.json();
 * Le reste du front ne change pas.
 */
export async function getSpots(budget: number): Promise<Spot[]> {
  return MOCK_SPOTS.filter((s) => s.price <= budget).sort((a, b) => a.distanceM - b.distanceM);
}