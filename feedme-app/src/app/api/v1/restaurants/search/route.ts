import { NextResponse } from 'next/server';
import { z } from 'zod'; // Outil de validation strict (Pilier 4)
import { searchRestaurantsFromOSM } from '../../../../services/restaurantService';
// Définition du schéma de validation strict pour bloquer les champs mal formés ou non désirés (Allowlist)
const searchSchema = z.object({
  lat: z.number().min(-90).max(90),   // Latitude valide obligatoire
  lon: z.number().min(-180).max(180), // Longitude valide obligatoire
  radius: z.number().positive().max(10000).optional().default(1500), // Rayon maximum 10km
});

export async function POST(request: Request) {
  try {
    // 1. Récupération des données JSON de la requête
    const body = await request.json();

    // 2. Validation stricte des données entrantes (Controller Layer)
    // Si un champ est invalide ou inconnu, Zod rejette la requête immédiatement (Pilier 4)
    const validationResult = searchSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Données de requête invalides.', 
          details: (validationResult.error as any).errors 
        },
        { status: 400 }
      );
    }

    const { lat, lon, radius } = validationResult.data;

    // 3. Appel de la couche Service pour exécuter la logique métier
    const restaurants = await searchRestaurantsFromOSM({ lat, lon, radius });

    // 4. Retour de la réponse HTTP propre[cite: 5]
    return NextResponse.json({
      success: true,
      count: restaurants.length,
      data: restaurants,
    });

  } catch (error: any) {
    // 5. Gestion sécurisée des erreurs (Pilier 6 : Masquage absolu des erreurs au client)[cite: 4]
    // On ne renvoie jamais de "stack trace" technique brute, mais un message générique propre.
    console.error("Erreur interne du serveur:", error.message);

    return NextResponse.json(
      { success: false, error: 'Une erreur interne est survenue sur le serveur.' },
      { status: 500 }
    );
  }
}
