import { describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const { searchRestaurantsFromOSM } = vi.hoisted(() => ({
  searchRestaurantsFromOSM: vi.fn(),
}));

vi.mock('../../../../services/restaurantService', () => ({
  searchRestaurantsFromOSM,
}));

describe('POST /api/v1/restaurants/search', () => {
  it('rejects invalid search criteria', async () => {
    const response = await POST(new Request('http://localhost/api/v1/restaurants/search', {
      method: 'POST',
      body: JSON.stringify({ lat: 200, lon: 2.3 }),
    }));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ success: false });
    expect(searchRestaurantsFromOSM).not.toHaveBeenCalled();
  });

  it('returns validated restaurant results', async () => {
    searchRestaurantsFromOSM.mockResolvedValueOnce([{ id: '1', name: 'Test' }]);
    const response = await POST(new Request('http://localhost/api/v1/restaurants/search', {
      method: 'POST',
      body: JSON.stringify({ lat: 48.9, lon: 2.3 }),
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      count: 1,
      data: [{ id: '1', name: 'Test' }],
    });
    expect(searchRestaurantsFromOSM).toHaveBeenCalledWith({
      lat: 48.9,
      lon: 2.3,
      radius: 1500,
    });
  });

  it('hides provider errors from the client', async () => {
    searchRestaurantsFromOSM.mockRejectedValueOnce(new Error('provider failure'));
    const response = await POST(new Request('http://localhost/api/v1/restaurants/search', {
      method: 'POST',
      body: JSON.stringify({ lat: 48.9, lon: 2.3 }),
    }));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      success: false,
      error: 'Une erreur interne est survenue sur le serveur.',
    });
  });
});
