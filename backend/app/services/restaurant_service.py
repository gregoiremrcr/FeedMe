import httpx
import urllib.parse
from app.schemas.restaurant import SearchParams
async def search_restaurants_from_osm(params: SearchParams):
    overpass_query = f"""
    [out:json][timeout:8];
    node["amenity"="restaurant"](around:{params.radius},{params.lat},{params.lon});
    out body 15;
    """
    
    url = f"https://overpass-api.de/api/interpreter?data={urllib.parse.quote(overpass_query)}"
    
    headers = {
        "Accept": "*/*",
        "User-Agent": "FeedMeApp/1.0 (Student Project)"
    }
    
    try:
            print(f"🔍 [OSM] Requête lancée pour lat: {params.lat}, lon: {params.lon}")
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.get(url, headers=headers)
                
                print(f"📡 [OSM] Code statut HTTP reçu: {response.status_code}")
                
                if response.status_code != 200:
                    print(f" [OSM] Erreur serveur externe: {response.text}")
                    return get_fallback_restaurants(params)
                    
                data = response.json()
                elements = data.get("elements", [])
                
                if not elements:
                    print(" [OSM] Aucun restaurant trouvé dans cette zone par OSM.")
                    return get_fallback_restaurants(params)
                    
                print(f" [OSM] Succès ! {len(elements)} restaurants bruts trouvés.")
                # ... (le reste de ton code de mapping)
                
    except Exception as e:
            print(f" [ERREUR CRITIQUE / TIMEOUT]: {type(e).__name__} - {e}")
            return get_fallback_restaurants(params)

def get_fallback_restaurants(params: SearchParams):
    mock_list = [
        {"id": "101", "name": "Le Petit Bistro", "lat": params.lat, "lon": params.lon, "cuisine": "french", "budgetLevel": 2, "address": "10 Rue de Paris, Paris"},
        {"id": "102", "name": "Pizza Bella", "lat": params.lat, "lon": params.lon, "cuisine": "italian", "budgetLevel": 1, "address": "15 Avenue des Fleurs, Paris"},
        {"id": "103", "name": "Sakura Sushi", "lat": params.lat, "lon": params.lon, "cuisine": "japanese", "budgetLevel": 3, "address": "8 Boulevard Saint-Michel, Paris"}
    ]
    
    filtered = mock_list
    if params.cuisine:
        filtered = [r for r in filtered if params.cuisine.lower() in r["cuisine"].lower()]
    if params.budget:
        filtered = [r for r in filtered if r["budgetLevel"] == params.budget]
        
    return filtered if filtered else mock_list