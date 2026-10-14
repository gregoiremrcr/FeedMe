export type Place = {
  id: string;
  label: string;
  lat: number;
  lng: number;
};

export const MIN_QUERY_LENGTH = 3;

const API_URL = process.env.NEXT_PUBLIC_API_URL;


const MOCK_PLACES: Place[] = [
  { id: "m1", label: "12 rue des Arts, Aubervilliers", lat: 48.9152, lng: 2.3688 },
  { id: "m2", label: "Place du Front Populaire, Aubervilliers", lat: 48.9138, lng: 2.3664 },
  { id: "m3", label: "Campus Condorcet, Aubervilliers", lat: 48.9145, lng: 2.368 },
  { id: "m4", label: "Avenue de la République, Aubervilliers", lat: 48.9159, lng: 2.3658 },
  { id: "m5", label: "Gare du Nord, Paris", lat: 48.8809, lng: 2.3553 },
];

const normalize = (text: string) =>
  text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

async function mockSuggest(query: string): Promise<Place[]> {
  await new Promise((resolve) => setTimeout(resolve, 350));
  const needle = normalize(query);
  return MOCK_PLACES.filter((p) => normalize(p.label).includes(needle)).slice(0, 5);
}


export async function suggestPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const q = query.trim();
  if (q.length < MIN_QUERY_LENGTH) return [];
  if (!API_URL) return mockSuggest(q);

  const res = await fetch(`${API_URL}/api/v1/geocode/suggest?q=${encodeURIComponent(q)}`, {
    credentials: "include",
    signal,
  });
  if (!res.ok) throw new Error("La recherche d'adresse est indisponible.");
  return res.json();
}

export type LocateErrorKind = "denied" | "unavailable" | "unsupported";

export class LocateError extends Error {
  kind: LocateErrorKind;

  constructor(kind: LocateErrorKind) {
    super(kind);
    this.kind = kind;
  }
}

/** Position du navigateur. Demande la permission, ne la stocke pas. */
export function getCurrentPlace(): Promise<Place> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new LocateError("unsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve({ id: "geolocation", label: "Ma position", lat: coords.latitude, lng: coords.longitude }),
      (error) => reject(new LocateError(error.code === 1 ? "denied" : "unavailable")),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  });
}
