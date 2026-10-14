// Interface définissant la structure des paramètres attendus pour la recherche
export interface SearchParams {
  lat: number;       // Latitude géographique du point de recherche
  lon: number;       // Longitude géographique du point de recherche
  radius: number;    // Rayon de recherche autour du point (en mètres)
  cuisine?: string;  // Type de cuisine optionnel (ex: "italian", "french")
  budget?: number;   // Niveau de budget optionnel (1: Économique, 2: Moyen, 3: Élevé)
}

/**
 * Fonction principale : interroge l'API Overpass d'OpenStreetMap, nettoie et enrichit 
 * les données, applique les filtres, et intègre un système de secours (fallback).
 */
export async function searchRestaurantsFromOSM(params: SearchParams) {
  
  // 1. Construction de la requête Overpass QL (Langage de requêtes géographiques d'OSM)
  // On cible les "nodes" (points) ayant le tag "amenity=restaurant" dans le rayon et aux coordonnées spécifiées.
  const overpassQuery = `
    [out:json][timeout:8];
    node["amenity"="restaurant"](around:${params.radius},${params.lat},${params.lon});
    out body 15;
  `;

  // On encode la requête textuelle pour la passer proprement en paramètre d'URL (méthode GET, plus rapide)
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;

  // 2. Gestion du délai d'attente (Timeout) avec AbortController pour éviter les blocages infinis
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // Stoppe la requête si elle dépasse 8 secondes

  try {
    // 3. Appel HTTP vers le serveur public OpenStreetMap
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal, // Associe le minuteur d'annulation à la requête fetch
      headers: {
        'Accept': '*/*',
        'User-Agent': 'FeedMeApp/1.0 (Student Project)', // En-tête obligatoire pour identifier l'application auprès d'OSM
      },
    });

    clearTimeout(timeoutId); // Annule le minuteur puisque la réponse est bien arrivée

    // Si le serveur externe renvoie une erreur, on bascule directement sur les données de secours
    if (!response.ok) {
      console.warn("Serveur externe injoignable, utilisation des données de secours.");
      return getFallbackRestaurants(params);
    }

    // 4. Conversion de la réponse brute en format JSON
    const data = await response.json();

    // Si aucun élément géographique n'est retourné, on bascule aussi sur le secours
    if (!data.elements || data.elements.length === 0) {
      return getFallbackRestaurants(params);
    }

    // 5. Nettoyage, formatage et enrichissement des données brutes reçues
    let restaurants = data.elements
      .filter((el: any) => el.tags && el.tags.name) // On ignore les éléments qui n'ont pas de nom officiel
      .map((el: any) => {
        const cuisineType = (el.tags.cuisine || '').toLowerCase();
        let estimatedBudget = 2; // Valeur par défaut (Moyen)

        // Logique métier : estimation du niveau de budget selon les mots-clés du type de cuisine
        if (cuisineType.includes('fast_food') || cuisineType.includes('pizza')) {
          estimatedBudget = 1; // Économique
        } else if (cuisineType.includes('gourmet') || cuisineType.includes('fine_dining')) {
          estimatedBudget = 3; // Élevé
        }

        // Reconstruction intelligente de l'adresse postale pour éviter les mentions "non disponible"
        let formattedAddress = 'Adresse non disponible';
        if (el.tags['addr:street']) {
          const houseNumber = el.tags['addr:housenumber'] || '';
          const street = el.tags['addr:street'];
          const city = el.tags['addr:city'] || 'Paris';
          formattedAddress = `${houseNumber} ${street}, ${city}`.trim();
        } else if (el.tags['addr:full']) {
          formattedAddress = el.tags['addr:full']; // Utilise l'adresse complète si disponible dans OSM
        }

        // Objet restaurant propre prêt à être renvoyé au client/frontend
        return {
          id: el.id.toString(),
          name: el.tags.name,
          lat: el.lat,
          lon: el.lon,
          cuisine: el.tags.cuisine || 'Non spécifié',
          budgetLevel: estimatedBudget,
          address: formattedAddress,
        };
      });

    // 6. Application des filtres optionnels de recherche (Cuisine et Budget)
    if (params.cuisine) {
      const searchTerm = params.cuisine.toLowerCase();
      restaurants = restaurants.filter((r: any) => 
        r.cuisine.toLowerCase().includes(searchTerm) || r.name.toLowerCase().includes(searchTerm)
      );
    }

    if (params.budget) {
      restaurants = restaurants.filter((r: any) => r.budgetLevel === params.budget);
    }

    // Si les filtres de recherche suppriment tous les résultats, on renvoie les secours pour ne pas renvoyer un tableau vide
    if (restaurants.length === 0) {
      return getFallbackRestaurants(params);
    }

    return restaurants;

  } catch (error: any) {
    clearTimeout(timeoutId); // Sécurité : s'assure d'annuler le minuteur en cas d'erreur
    console.warn("Erreur réseau ou timeout, passage automatique aux données de secours:", error.message);
    return getFallbackRestaurants(params); // Empêche l'application de crasher (évite l'erreur 500)
  }
}

/**
 * Fonction de secours (Mock) : fournit des données de test réalistes 
 * si le serveur OpenStreetMap est en panne ou inaccessible.
 */
function getFallbackRestaurants(params: SearchParams) {
  // Liste statique de secours
  const mockList = [
    { id: "101", name: "Le Petit Bistro", lat: params.lat, lon: params.lon, cuisine: "french", budgetLevel: 2, address: "10 Rue de Paris, Paris" },
    { id: "102", name: "Pizza Bella", lat: params.lat, lon: params.lon, cuisine: "italian", budgetLevel: 1, address: "15 Avenue des Fleurs, Paris" },
    { id: "103", name: "Sakura Sushi", lat: params.lat, lon: params.lon, cuisine: "japanese", budgetLevel: 3, address: "8 Boulevard Saint-Michel, Paris" }
  ];

  let filtered = mockList;

  // Réapplique les filtres de recherche sur les données de secours pour garder une cohérence
  if (params.cuisine) {
    filtered = filtered.filter(r => r.cuisine.toLowerCase().includes(params.cuisine!.toLowerCase()));
  }
  if (params.budget) {
    filtered = filtered.filter(r => r.budgetLevel === params.budget);
  }

  // Retourne les mocks filtrés s'il y en a, sinon renvoie toute la liste de secours par défaut
  return filtered.length > 0 ? filtered : mockList;
}