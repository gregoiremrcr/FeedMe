import { Spot } from "@/lib/spots";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function request(path: string, init?: RequestInit) {
  const res = await fetch(`${API_URL}/api/v1/favorites${path}`, {
    ...init,
    credentials: "include",
  });
  if (!res.ok) throw new Error("Requête favoris refusée");
  return res;
}

const mockKey = (userId: string) => `feedme-mock-favorites:${userId}`;

function mockRead(userId: string): Spot[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(mockKey(userId)) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mockWrite(userId: string, spots: Spot[]) {
  localStorage.setItem(mockKey(userId), JSON.stringify(spots));
}


export const favoritesApi = {
  list: async (userId: string): Promise<Spot[]> => {
    if (!API_URL) return mockRead(userId);
    return (await request("")).json();
  },

  add: async (userId: string, spot: Spot): Promise<void> => {
    if (!API_URL) {
      mockWrite(userId, [spot, ...mockRead(userId).filter((s) => s.id !== spot.id)]);
      return;
    }
    await request(`/${encodeURIComponent(spot.id)}`, { method: "PUT" });
  },

  remove: async (userId: string, spotId: string): Promise<void> => {
    if (!API_URL) {
      mockWrite(userId, mockRead(userId).filter((s) => s.id !== spotId));
      return;
    }
    await request(`/${encodeURIComponent(spotId)}`, { method: "DELETE" });
  },
};