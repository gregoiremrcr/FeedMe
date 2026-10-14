export interface SearchParams {
  lat: number;
  lon: number;
  radius: number;
  cuisine?: string;
  budget?: number;
}

type OSMElement = {
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
};

type OSMResponse = { elements?: OSMElement[] };

export type RestaurantResult = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  cuisine: string;
  budgetLevel: number;
  address: string;
};

export async function searchRestaurantsFromOSM(
  params: SearchParams
): Promise<RestaurantResult[]> {
  const overpassQuery = `
    [out:json][timeout:8];
    node["amenity"="restaurant"](around:${params.radius},${params.lat},${params.lon});
    out body 15;
  `;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: '*/*',
        'User-Agent': 'FeedMeApp/1.0 (Student Project)',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) return getFallbackRestaurants(params);

    const data = (await response.json()) as OSMResponse;
    if (!data.elements || data.elements.length === 0) {
      return getFallbackRestaurants(params);
    }

    let restaurants: RestaurantResult[] = data.elements
      .filter((element) => Boolean(element.tags?.name))
      .map((element) => {
        const tags = element.tags ?? {};
        const cuisineType = (tags.cuisine ?? '').toLowerCase();
        const budgetLevel = cuisineType.includes('fast_food') || cuisineType.includes('pizza')
          ? 1
          : cuisineType.includes('gourmet') || cuisineType.includes('fine_dining')
            ? 3
            : 2;
        const address = tags['addr:street']
          ? `${tags['addr:housenumber'] ?? ''} ${tags['addr:street']}, ${tags['addr:city'] ?? 'Paris'}`.trim()
          : tags['addr:full'] ?? 'Adresse non disponible';

        return {
          id: element.id.toString(),
          name: tags.name as string,
          lat: element.lat,
          lon: element.lon,
          cuisine: tags.cuisine ?? 'Non spécifié',
          budgetLevel,
          address,
        };
      });

    if (params.cuisine) {
      const searchTerm = params.cuisine.toLowerCase();
      restaurants = restaurants.filter((restaurant) =>
        restaurant.cuisine.toLowerCase().includes(searchTerm) ||
        restaurant.name.toLowerCase().includes(searchTerm)
      );
    }
    if (params.budget) {
      restaurants = restaurants.filter((restaurant) => restaurant.budgetLevel === params.budget);
    }

    return restaurants.length > 0 ? restaurants : getFallbackRestaurants(params);
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    console.warn(
      'Erreur réseau ou timeout, passage automatique aux données de secours:',
      error instanceof Error ? error.message : String(error)
    );
    return getFallbackRestaurants(params);
  }
}

function getFallbackRestaurants(params: SearchParams): RestaurantResult[] {
  const mockList: RestaurantResult[] = [
    { id: '101', name: 'Le Petit Bistro', lat: params.lat, lon: params.lon, cuisine: 'french', budgetLevel: 2, address: '10 Rue de Paris, Paris' },
    { id: '102', name: 'Pizza Bella', lat: params.lat, lon: params.lon, cuisine: 'italian', budgetLevel: 1, address: '15 Avenue des Fleurs, Paris' },
    { id: '103', name: 'Sakura Sushi', lat: params.lat, lon: params.lon, cuisine: 'japanese', budgetLevel: 3, address: '8 Boulevard Saint-Michel, Paris' },
  ];

  const filtered = mockList.filter((restaurant) =>
    (!params.cuisine || restaurant.cuisine.includes(params.cuisine.toLowerCase())) &&
    (!params.budget || restaurant.budgetLevel === params.budget)
  );
  return filtered.length > 0 ? filtered : mockList;
}
