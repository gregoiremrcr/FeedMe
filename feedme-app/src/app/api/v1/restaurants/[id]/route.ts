import { NextResponse } from 'next/server';

type OverpassElement = {
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string>;
};

type OverpassResponse = { elements?: OverpassElement[] };

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  void request;

  try {
    const { id: restaurantId } = await params;

    if (!restaurantId) {
      return NextResponse.json(
        { success: false, error: "L'identifiant du restaurant est obligatoire." },
        { status: 400 }
      );
    }

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
      headers: { 'Content-Type': 'text/plain' },
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la communication avec OpenStreetMap.');
    }

    const data = (await response.json()) as OverpassResponse;

    if (!data.elements || data.elements.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Restaurant introuvable.' },
        { status: 404 }
      );
    }

    const el = data.elements[0];
    const restaurant = {
      id: el.id.toString(),
      name: el.tags?.name || 'Nom inconnu',
      lat: el.lat ?? el.center?.lat,
      lon: el.lon ?? el.center?.lon,
      cuisine: el.tags?.cuisine || 'Non spécifié',
      address: el.tags?.['addr:street']
        ? `${el.tags['addr:housenumber'] || ''} ${el.tags['addr:street']}, ${el.tags['addr:city'] || ''}`
        : 'Adresse non disponible',
    };

    return NextResponse.json({ success: true, data: restaurant });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Erreur interne (Détails restaurant):', errorMessage);

    return NextResponse.json(
      { success: false, error: 'Une erreur interne est survenue sur le serveur.' },
      { status: 500 }
    );
  }
}
