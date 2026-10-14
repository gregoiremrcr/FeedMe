import { afterEach, describe, expect, it, vi } from 'vitest';
import { searchRestaurantsFromOSM } from './restaurantService';

const params = { lat: 48.9145, lon: 2.368, radius: 1500 };

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('searchRestaurantsFromOSM', () => {
  it('maps and filters an OSM response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        elements: [
          {
            id: 10,
            lat: 48.9,
            lon: 2.3,
            tags: { name: 'Pizza Test', cuisine: 'pizza', 'addr:street': 'Rue Test' },
          },
          { id: 11, lat: 48.8, lon: 2.2, tags: { amenity: 'restaurant' } },
        ],
      }),
    }));

    const result = await searchRestaurantsFromOSM({ ...params, cuisine: 'pizza', budget: 1 });

    expect(result).toEqual([expect.objectContaining({
      id: '10',
      name: 'Pizza Test',
      cuisine: 'pizza',
      budgetLevel: 1,
      address: 'Rue Test, Paris',
    })]);
  });

  it('uses filtered fallback data when the provider fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network failure')));

    const result = await searchRestaurantsFromOSM({ ...params, cuisine: 'italian', budget: 1 });

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Pizza Bella');
  });

  it('uses fallback data for an empty provider response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ elements: [] }),
    }));

    const result = await searchRestaurantsFromOSM(params);

    expect(result).toHaveLength(3);
  });
});
