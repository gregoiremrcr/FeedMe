from fastapi import FastAPI, HTTPException
from app.schemas.restaurant import SearchParams
from app.services.restaurant_service import search_restaurants_with_ai

app = FastAPI(
    title="FeedMe API",
    version="0.1.0",
    description="API backend de FeedMe avec intégration IA.",
)

@app.get("/health", tags=["system"])
async def health() -> dict[str, str]:
    """Endpoint simple de vérification de l'état du serveur (liveness)."""
    return {"status": "ok", "service": "feedme-backend"}

@app.post("/api/v1/restaurants/search", tags=["restaurants"])
async def search_restaurants(params: SearchParams):
    """Route principale : reçoit les critères du front et délègue la recherche à l'IA."""
    try:
        restaurants = await search_restaurants_with_ai(params)
        return {
            "success": True,
            "count": len(restaurants),
            "data": restaurants,
        }
    except Exception as e:
        # Capture globale des erreurs pour éviter de crasher le serveur HTTP
        raise HTTPException(status_code=500, detail=str(e))