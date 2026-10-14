import { NextResponse } from 'next/server';
import { z } from 'zod';
import { searchRestaurantsFromOSM } from '../../../../services/restaurantService';

const searchSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  radius: z.number().positive().max(10000).optional().default(1500),
  cuisine: z.string().optional(),
  budget: z.number().min(1).max(3).optional(),
});

export async function POST(request: Request) {
  try {
    const validationResult = searchSchema.safeParse(await request.json());

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Données de requête invalides.',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const restaurants = await searchRestaurantsFromOSM(validationResult.data);

    return NextResponse.json({
      success: true,
      count: restaurants.length,
      data: restaurants,
    });
  } catch (error: unknown) {
    console.error(
      'Erreur interne du serveur:',
      error instanceof Error ? error.message : String(error)
    );

    return NextResponse.json(
      { success: false, error: 'Une erreur interne est survenue sur le serveur.' },
      { status: 500 }
    );
  }
}
