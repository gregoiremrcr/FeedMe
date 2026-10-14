from fastapi import FastAPI, HTTPException
from app.schemas.restaurant import SearchParams  # Assure-toi que ton schema s'appelle bien restaurant.py
from app.services.restaurant_service import search_restaurants_from_osm

app = FastAPI(
    title="FeedMe API",
    version="0.1.0",
    description="API backend de FeedMe.",
)

@app.get("/health", tags=["system"])
async def health() -> dict[str, str]:
    """Return a stable liveness response without requiring external services."""
    return {"status": "ok", "service": "feedme-backend"}

@app.post("/api/v1/restaurants/search", tags=["restaurants"])
async def search_restaurants(params: SearchParams):
    """
    Recherche des restaurants autour d'une position géographique (lat, lon) 
    via l'API Overpass d'OpenStreetMap, avec gestion des filtres et du fallback.
    """
    try:
        restaurants = await search_restaurants_from_osm(params)
        return {
            "success": True,
            "count": len(restaurants),
            "data": restaurants,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))