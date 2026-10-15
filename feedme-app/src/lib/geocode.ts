export type Place = { id: string; label: string; lat: number; lng: number };
export const MIN_QUERY_LENGTH = 3;

const apiUrl = () => process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

export async function suggestPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const base = apiUrl();
  if (!base || query.trim().length < MIN_QUERY_LENGTH) return [];
  const response = await fetch(`${base}/api/v1/restaurants/search`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ address: query.trim() }), signal });
  if (!response.ok) throw new Error("La recherche d’adresse est indisponible.");
  const data = await response.json() as { location?: { lat: number; lon: number; label?: string | null } };
  return data.location ? [{ id: `address-${data.location.lat}-${data.location.lon}`, label: data.location.label ?? query.trim(), lat: data.location.lat, lng: data.location.lon }] : [];
}

export type LocateErrorKind = "denied" | "unavailable" | "unsupported";
export class LocateError extends Error { constructor(readonly kind: LocateErrorKind) { super(kind); } }

export function getCurrentPlace(): Promise<Place> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return reject(new LocateError("unsupported"));
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ id: "geolocation", label: "Ma position", lat: coords.latitude, lng: coords.longitude }),
      (error) => reject(new LocateError(error.code === 1 ? "denied" : "unavailable")),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  });
}
