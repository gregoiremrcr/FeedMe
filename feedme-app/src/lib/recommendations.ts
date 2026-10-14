import { formatPrice } from "@/lib/restaurant";
import { Criteria } from "@/lib/search";
import { getSpots, Spot } from "@/lib/spots";

export type Pick = {
  spot: Spot;
  reason: string;
};

export type Recommendations = {
  summary: string;
  picks: Pick[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/* ------------------------------------------------------------------
 * MODE SIMULÉ (temporaire) : actif tant que NEXT_PUBLIC_API_URL est absent.
 * Ce n'est PAS de l'IA : filtre par budget, tri par distance (ou "pressé·e"),
 * phrases générées à partir des données. À supprimer quand l'API existe.
 * ---------------------------------------------------------------- */
async function mockRecommend({ budget, wishes }: Criteria): Promise<Recommendations> {
  await new Promise((resolve) => setTimeout(resolve, 900));

  let spots = await getSpots(budget);
  if (wishes.includes("fast")) {
    spots = [...spots].sort((a, b) => a.walkMinutes - b.walkMinutes);
  }

  const picks = spots.map((spot) => ({
    spot,
    reason: `À ${spot.walkMinutes} min à pied, et il te reste ${formatPrice(budget - spot.price)} sur ton budget.`,
  }));

  const n = picks.length;
  const summary =
    n === 0
      ? `Rien à moins de ${formatPrice(budget)} près de toi.`
      : `${n} plan${n > 1 ? "s" : ""} qui ${n > 1 ? "passent" : "passe"} avec ${formatPrice(budget)}.`;

  return { summary, picks };
}
/* ------------------------------------------------------------------ */

export async function getRecommendations(
  criteria: Criteria,
  signal?: AbortSignal
): Promise<Recommendations> {
  if (!API_URL) return mockRecommend(criteria);

  const res = await fetch(`${API_URL}/api/v1/recommendations`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lat: criteria.place.lat,
      lng: criteria.place.lng,
      budget: criteria.budget,
      wishes: criteria.wishes,
    }),
    signal,
  });

  if (!res.ok) throw new Error("Les recommandations sont indisponibles.");
  return res.json();
}