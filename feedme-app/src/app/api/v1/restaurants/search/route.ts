import { NextResponse } from 'next/server';
import { z } from 'zod';
import { searchRestaurantsFromOSM } from '../../../../services/restaurantService';

// Schéma de validation strict avec Zod incluant le budget
const searchSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  radius: z.number().positive().max(10000).optional().default(1500),
  cuisine: z.string().optional(),
  budget: z.number().min(1).max(3).optional(), // 1: Économique, 2: Moyen, 3: Élevé
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

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

    // On récupère maintenant aussi le budget validé
    const { lat, lon, radius, cuisine, budget } = validationResult.data;

    // Appel du service en transmettant le budget
    const restaurants = await searchRestaurantsFromOSM({ lat, lon, radius, cuisine, budget });

    return NextResponse.json({
      success: true,
      count: restaurants.length,
      data: restaurants,
    });

  } catch (error: any) {
    console.error("Erreur interne du serveur:", error.message);

    
    return NextResponse.json(
      { success: false, error: 'Une erreur interne est survenue sur le serveur.' },
      { status: 500 }
    );
  }
}