import { resolveApiBaseUrl } from "@/lib/auth";

export type Restaurant = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distance_m: number;
  address: string | null;
  cuisines: string[];
  kind: string;
  website: string | null;
  phone: string | null;
  opening_hours: string | null;
  dietary_tags: string[];
  price: number | null;
  wait_minutes: number | null;
  menu_url: string | null;
  rating: number | null;
  sources: { name: string; url: string }[];
};

export type RestaurantSearchResponse = {
  results: Restaurant[];
  count: number;
  location: { lat: number; lon: number; label: string | null; source: "browser" | "address" };
  radius_m: number;
  provider: string;
  attribution: string;
  unavailable_filters: string[];
};

export type UserPreferences = { radius_m: number; language: string };
export type ChatTurn = { role: "user" | "assistant"; content: string };
export type AssistantResponse = {
  answer: string;
  results: Restaurant[];
  needs_location: boolean;
  location: RestaurantSearchResponse["location"] | null;
  sources: { name: string; url: string }[];
};

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${resolveApiBaseUrl(process.env.NEXT_PUBLIC_API_URL)}${path}`;
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      credentials: "include",
      headers: {
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new Error("Impossible de joindre l’API FeedMe. Vérifie que le backend est démarré.");
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = typeof body?.detail === "string" ? body.detail : `La requête a échoué (${response.status}).`;
    throw new Error(message);
  }
  return response.status === 204 ? (undefined as T) : (await response.json()) as T;
}

export const restaurantApi = {
  search: (input: {
    lat?: number;
    lon?: number;
    address?: string;
    radius_m?: number;
    cuisines?: string[];
    dietary?: string[];
    allergies?: string[];
    dish_type?: string;
    max_price_eur?: number;
    max_wait_minutes?: number;
  }) => apiRequest<RestaurantSearchResponse>("/api/v1/restaurants/search", {
    method: "POST",
    body: JSON.stringify(input),
  }),

  preferences: () => apiRequest<UserPreferences>("/api/v1/users/me/preferences"),
  updatePreferences: (input: { radius_m?: number; language?: string }) => apiRequest<UserPreferences>("/api/v1/users/me/preferences", {
    method: "PATCH",
    body: JSON.stringify(input),
  }),

  ask: (input: { message: string; history: ChatTurn[]; lat?: number; lon?: number }) =>
    apiRequest<AssistantResponse>("/api/v1/assistant/messages", {
      method: "POST",
      body: JSON.stringify(input),
    }),
};
