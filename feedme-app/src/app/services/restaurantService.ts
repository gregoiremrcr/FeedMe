export interface SearchParams {
  lat: number;
  lon: number;
  radius: number;
}

export async function searchRestaurantsFromOSM(params: SearchParams) {
  // Requête Overpass QL pour interroger OpenStreetMap
  const overpassQuery = `
    [out:json][timeout:25];
    (
      node["amenity"="restaurant"](around:${params.radius},${params.lat},${params.lon});
      way["amenity"="restaurant"](around:${params.radius},${params.lat},${params.lon});
    );
    out body;
    >;
    out skel qt;
  `;

  // Appel HTTP vers l'API externe
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

  // Transformation et nettoyage des données brutes
  const restaurants = data.elements
    .filter((el: any) => el.tags && el.tags.name)
    .map((el: any) => ({
      id: el.id.toString(),
      name: el.tags.name,
      lat: el.lat || (el.center && el.center.lat),
      lon: el.lon || (el.center && el.center.lon),
      cuisine: el.tags.cuisine || 'Non spécifié',
      address: el.tags['addr:street']
        ? `${el.tags['addr:housenumber'] || ''} ${el.tags['addr:street']}, ${el.tags['addr:city'] || ''}`
        : 'Adresse non disponible',
    }));

  return restaurants;
}