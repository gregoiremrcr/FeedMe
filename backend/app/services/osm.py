import asyncio
import math
import time
from collections import OrderedDict
from typing import Any

import httpx
from fastapi import HTTPException, status
from pydantic import ValidationError

from app.core.config import get_settings
from app.schemas.restaurants import Location, Restaurant, RestaurantSearchRequest

_geocode_lock = asyncio.Lock()
_last_geocode_at = 0.0
_geocode_cache: dict[str, tuple[float, Location]] = {}
_overpass_lock = asyncio.Lock()
_overpass_cache: OrderedDict[str, tuple[float, list[dict[str, Any]]]] = OrderedDict()


def _cached_geocode(key: str) -> Location | None:
    cached = _geocode_cache.get(key)
    if cached is None:
        return None
    expires_at, location = cached
    if expires_at <= time.monotonic():
        _geocode_cache.pop(key, None)
        return None
    return location


def _distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> int:
    radius = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    value = min(1.0, math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2)
    return round(radius * 2 * math.atan2(math.sqrt(value), math.sqrt(1 - value)))


async def geocode_address(address: str) -> Location:
    """Resolve one user-entered address while respecting public Nominatim pacing."""
    global _last_geocode_at
    settings = get_settings()
    key = " ".join(address.casefold().split())
    cached = _cached_geocode(key)
    if cached:
        return cached
    async with _geocode_lock:
        cached = _cached_geocode(key)
        if cached:
            return cached
        delay = 1.0 - (time.monotonic() - _last_geocode_at)
        if delay > 0:
            await asyncio.sleep(delay)
        try:
            async with httpx.AsyncClient(timeout=settings.overpass_timeout_seconds) as client:
                response = await client.get(
                    settings.nominatim_url,
                    params={"q": address, "format": "jsonv2", "limit": 1},
                    headers={"User-Agent": settings.osm_user_agent, "Accept": "application/json"},
                )
                response.raise_for_status()
                matches = response.json()
        except (httpx.HTTPError, ValueError):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Le service de recherche d’adresse est temporairement indisponible.",
            ) from None
        finally:
            _last_geocode_at = time.monotonic()

    if not isinstance(matches, list) or not matches:
        raise HTTPException(status_code=422, detail="Cette adresse n’a pas pu être localisée.")
    match = matches[0]
    try:
        lat, lon = float(match["lat"]), float(match["lon"])
    except (KeyError, TypeError, ValueError):
        raise HTTPException(status_code=502, detail="Le service d’adresse a renvoyé une réponse invalide.") from None
    try:
        location = Location(lat=lat, lon=lon, label=match.get("display_name"), source="address")
    except ValidationError:
        raise HTTPException(status_code=502, detail="Le service d’adresse a renvoyé des coordonnées invalides.") from None
    _geocode_cache[key] = (time.monotonic() + 86_400, location)
    return location


def _address(tags: dict[str, str]) -> str | None:
    if tags.get("addr:full"):
        return tags["addr:full"]
    parts = [tags.get("addr:housenumber"), tags.get("addr:street"), tags.get("addr:postcode"), tags.get("addr:city")]
    value = ", ".join(part.strip() for part in parts if part and part.strip())
    return value or None


def _safe_http_url(value: str | None) -> str | None:
    if isinstance(value, str) and value.startswith(("https://", "http://")):
        return value
    return None


def _to_restaurant(element: dict[str, Any], origin: Location) -> Restaurant | None:
    raw_tags = element.get("tags")
    tags = {key: value for key, value in raw_tags.items() if isinstance(key, str) and isinstance(value, str)} if isinstance(raw_tags, dict) else {}
    name = tags.get("name")
    if not isinstance(name, str) or not name.strip():
        return None
    center = element.get("center")
    position = center if isinstance(center, dict) else element
    try:
        lat, lon = float(position["lat"]), float(position["lon"])
    except (KeyError, TypeError, ValueError):
        return None
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        return None

    kind = tags.get("amenity", "restaurant")
    cuisine = [item.strip()[:80] for item in tags.get("cuisine", "").split(";") if item.strip()][:20]
    dietary = [key.removeprefix("diet:")[:80] for key, value in tags.items() if key.startswith("diet:") and value == "yes"][:30]
    osm_type = element.get("type", "node")
    osm_id = element.get("id")
    if not isinstance(osm_id, int) or osm_id < 0 or osm_type not in {"node", "way", "relation"}:
        return None
    website = _safe_http_url(tags.get("website") or tags.get("contact:website"))
    return Restaurant(
        id=f"{osm_type}/{osm_id}",
        name=name.strip()[:300],
        lat=lat,
        lon=lon,
        distance_m=_distance_m(origin.lat, origin.lon, lat, lon),
        address=(_address(tags) or "")[:500] or None,
        cuisines=cuisine,
        kind=kind,
        website=website,
        phone=(tags.get("phone") or tags.get("contact:phone") or "")[:100] or None,
        opening_hours=(tags.get("opening_hours") or "")[:300] or None,
        dietary_tags=dietary,
        menu_url=_safe_http_url(tags.get("menu:website") or tags.get("website:menu")),
        sources=[{"name": "OpenStreetMap", "url": f"https://www.openstreetmap.org/{osm_type}/{osm_id}"}],
    )


async def search_osm(
    request: RestaurantSearchRequest,
    location: Location,
    radius_m: int,
) -> list[Restaurant]:
    settings = get_settings()
    query = f"""
[out:json][timeout:10];
(nwr["amenity"~"^(restaurant|fast_food|cafe)$"](around:{radius_m},{location.lat},{location.lon}););
out center tags;
"""
    cache_key = f"{location.lat:.5f}:{location.lon:.5f}:{radius_m}"
    cached_elements: list[dict[str, Any]] | None = None
    async with _overpass_lock:
        cached = _overpass_cache.get(cache_key)
        if cached and cached[0] > time.monotonic():
            cached_elements = cached[1]
            _overpass_cache.move_to_end(cache_key)
        elif cached:
            _overpass_cache.pop(cache_key, None)

    if cached_elements is None:
        try:
            async with httpx.AsyncClient(timeout=settings.overpass_timeout_seconds) as client:
                response = await client.post(
                    settings.overpass_url,
                    data={"data": query},
                    headers={"User-Agent": settings.osm_user_agent, "Accept": "application/json"},
                )
                response.raise_for_status()
                payload = response.json()
        except (httpx.HTTPError, ValueError):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="La recherche OpenStreetMap est temporairement indisponible.",
            ) from None
        elements = payload.get("elements") if isinstance(payload, dict) else None
        if not isinstance(elements, list):
            raise HTTPException(status_code=502, detail="OpenStreetMap a renvoyé une réponse invalide.")
        async with _overpass_lock:
            _overpass_cache[cache_key] = (time.monotonic() + 60, elements)
            _overpass_cache.move_to_end(cache_key)
            while len(_overpass_cache) > 128:
                _overpass_cache.popitem(last=False)
    else:
        elements = cached_elements

    results: dict[str, Restaurant] = {}
    for element in elements:
        if not isinstance(element, dict):
            continue
        restaurant = _to_restaurant(element, location)
        if restaurant:
            results[restaurant.id] = restaurant

    normalized = sorted(results.values(), key=lambda restaurant: restaurant.distance_m)[:100]
    cuisine_terms = [value.casefold() for value in request.cuisines]
    if cuisine_terms:
        normalized = [
            restaurant for restaurant in normalized
            if not restaurant.cuisines
            or any(term in " ".join(restaurant.cuisines).casefold() for term in cuisine_terms)
        ]
    return normalized


def unavailable_filters(request: RestaurantSearchRequest) -> list[str]:
    unavailable = []
    if request.max_price_eur is not None:
        unavailable.append("max_price_eur")
    if request.max_wait_minutes is not None:
        unavailable.append("max_wait_minutes")
    if request.dish_type:
        unavailable.append("dish_type")
    if request.dietary:
        unavailable.append("dietary")
    if request.allergies:
        unavailable.append("allergies")
    return unavailable
