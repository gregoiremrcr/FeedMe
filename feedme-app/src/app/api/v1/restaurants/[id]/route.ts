import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  // Next.js récupère automatiquement les paramètres de l'URL (le fameux {id})
  { params }: { params: { id: string } }
) {
  try {
    const restaurantId = params.id;

    // 1. Validation basique : s'assurer que l'ID est bien présent
    if (!restaurantId) {
      return NextResponse.json(
        { success: false, error: "L'identifiant du restaurant est obligatoire." },
        { status: 400 }
      );
    }

    // 2. On interroge OpenStreetMap pour retrouver cet élément précis par son ID
    // En Overpass QL, on peut chercher directement un "node" ou un "way" avec id(numéro)
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node(${restaurantId});
        way(${restaurantId});
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
      throw new Error("Erreur lors de la communication avec OpenStreetMap.");
    }

    const data = await response.json();

    // Si aucun élément ne correspond à cet ID
    if (!data.elements || data.elements.length === 0) {
      return NextResponse.json(
        { success: false, error: "Restaurant introuvable." },
        { status: 404 } // Code 404 = Ressource non trouvée
      );
    }

    // On prend le premier élément trouvé et on le nettoie
    const el = data.elements[0];
    const restaurant = {
      id: el.id.toString(),
      name: el.tags?.name || 'Nom inconnu',
      lat: el.lat || (el.center && el.center.lat),
      lon: el.lon || (el.center && el.center.lon),
      cuisine: el.tags?.cuisine || 'Non spécifié',
      address: el.tags && el.tags['addr:street']
        ? `${el.tags['addr:housenumber'] || ''} ${el.tags['addr:street']}, ${el.tags['addr:city'] || ''}`
        : 'Adresse non disponible',
    };

    // 3. On retourne les détails du restaurant au client
    return NextResponse.json({
      success: true,
      data: restaurant,
    });

  } catch (error: any) {
    // Gestion sécurisée des erreurs (Pilier 6 : Masquage technique)
    console.error("Erreur interne (Détails restaurant):", error.message);

    return NextResponse.json(
      { success: false, error: 'Une erreur interne est survenue sur le serveur.' },
      { status: 500 }
    );
  }
}