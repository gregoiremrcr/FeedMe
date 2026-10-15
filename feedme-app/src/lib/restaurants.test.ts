import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { restaurantApi } from "./restaurants";

describe("restaurantApi", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000");
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("envoie la recherche au backend avec le cookie de session", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ results: [], count: 0 }), { status: 200 }));
    await restaurantApi.search({ lat: 48.85, lon: 2.35, radius_m: 1000 });
    expect(fetch).toHaveBeenCalledWith("http://localhost:8000/api/v1/restaurants/search", expect.objectContaining({
      method: "POST",
      credentials: "include",
      body: JSON.stringify({ lat: 48.85, lon: 2.35, radius_m: 1000 }),
    }));
  });

  it("retourne une erreur API lisible", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ detail: "OpenStreetMap indisponible" }), { status: 502 }));
    await expect(restaurantApi.search({ address: "Paris" })).rejects.toThrow("OpenStreetMap indisponible");
  });
});
