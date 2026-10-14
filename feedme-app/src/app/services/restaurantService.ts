export interface SearchParams {
  lat: number;
  lon: number;
  radius: number;
  cuisine?: string;
  budget?: number; // 1, 2 ou 3
}

export async function searchRestaurantsFromOSM(params: SearchParams) {
  const overpassQuery = `
    [out:json][timeout:25];
    (
      node["amenity"="restaurant"](around:${params.radius},${params.lat},${params.lon});
      way["amenity"="restaurant"](around:${params.radius},${params.lat},${params.lon});
      node["amenity"="fast_food"](around:${params.radius},${params.lat},${params.lon});
    );
    out body;
    >;
    out skel qt;
  `;

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: overpassQuery,
    headers: {
      'Content-Type': 'text/plain',
    },
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la communication avec le fournisseur de cartes.');
  }

  const data = await response.json();

  let restaurants = data.elements
    .filter((el: any) => el.tags && el.tags.name)
    .map((el: any) => {
      // Déduction simple du budget selon le type d'établissement OSM (fast_food = 1, restaurant standard = 2)
      const isFastFood = el.tags.amenity === 'fast_food';
      const estimatedBudget = isFastFood ? 1 : 2; 

      return {
        id: el.id.toString(),
        name: el.tags.name,
        lat: el.lat || (el.center && el.center.lat),
        lon: el.lon || (el.center && el.center.lon),
        cuisine: el.tags.cuisine || (isFastFood ? 'Fast-food' : 'Non spécifié'),
        budgetLevel: estimatedBudget, // Niveau de prix estimé (1 à 3)
        address: el.tags['addr:street']
          ? `${el.tags['addr:housenumber'] || ''} ${el.tags['addr:street']}, ${el.tags['addr:city'] || ''}`
          : 'Adresse non disponible',
      };
    });

  // 1. Filtrage par type de cuisine si demandé
  if (params.cuisine) {
    const searchTerm = params.cuisine.toLowerCase();
    restaurants = restaurants.filter((r: any) => 
      r.cuisine.toLowerCase().includes(searchTerm) || r.name.toLowerCase().includes(searchTerm)
    );
  }

  // 2. Filtrage par budget si demandé par le client/IA
  if (params.budget) {
    restaurants = restaurants.filter((r: any) => r.budgetLevel === params.budget);
  }

  return restaurants;
}