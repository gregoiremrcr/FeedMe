import os
import json
from dotenv import load_dotenv  # <-- 1. Importer load_dotenv
from google import genai
from google.genai import types
from app.schemas.restaurant import SearchParams

load_dotenv()  # <-- 2. Charger le fichier .env de ton dossier backend

# Initialisation du client (il récupérera automatiquement GEMINI_API_KEY)
client = genai.Client()

async def search_restaurants_with_ai(params: SearchParams):
    prompt = f"""
    Tu es l'assistant intelligent de l'application de découverte de restaurants "FeedMe".
    Un utilisateur se trouve aux coordonnées géographiques suivantes : Latitude {params.lat}, Longitude {params.lon}.
    Il cherche des restaurants dans un rayon de {params.radius} mètres.
    {f"Filtre de cuisine souhaité : {params.cuisine}" if params.cuisine else ""}
    {f"Niveau de budget souhaité (1 à 3) : {params.budget}" if params.budget else ""}

    Génère une liste réaliste de 3 à 5 restaurants situés à ces coordonnées.
    Réponds STRICTEMENT sous la forme d'un tableau JSON valide contenant des objets avec ces clés :
    id, name, lat, lon, cuisine, budgetLevel, address. Pas de texte superflu.
    """

    try:
        # On force Gemini à répondre avec un format JSON strict via la configuration du modèle
        response = client.models.generate_content(
            model='gemini-3.8-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.7,
                response_mime_type="application/json"
            ),
        )
        
        # Transformation de la réponse textuelle de l'IA en objets exploitables par l'API
        return json.loads(response.text)

    except Exception as e:
        print(f"❌ [ERREUR IA] : {e}")
        # En cas de panne de l'IA, on bascule sur les données de secours pour garder l'app stable
        return get_fallback_restaurants(params)

def get_fallback_restaurants(params: SearchParams):
    mock_list = [
        {"id": "201", "name": "Le Bistrot de l'IA", "lat": params.lat, "lon": params.lon, "cuisine": "française", "budgetLevel": 2, "address": "12 Rue de la République"},
        {"id": "202", "name": "Prompt Pizza", "lat": params.lat, "lon": params.lon, "cuisine": "italienne", "budgetLevel": 1, "address": "45 Avenue des Algorithmes"},
        {"id": "203", "name": "Neural Sushi", "lat": params.lat, "lon": params.lon, "cuisine": "japonaise", "budgetLevel": 3, "address": "8 Boulevard du Réseau"}
    ]
    
    filtered = mock_list
    if params.cuisine:
        filtered = [r for r in filtered if params.cuisine.lower() in r["cuisine"].lower()]
    if params.budget:
        filtered = [r for r in filtered if r["budgetLevel"] == params.budget]
        
    return filtered if filtered else mock_list