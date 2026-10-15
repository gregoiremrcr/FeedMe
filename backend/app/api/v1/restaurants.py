from fastapi import APIRouter, Depends, Request
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.v1.auth import PublicUser, current_user, optional_current_user
from app.core.database import get_database
from app.core.security import limiter, verify_auth_origin
from app.schemas.restaurants import (
    Location,
    RestaurantSearchRequest,
    RestaurantSearchResponse,
    UserPreferencesUpdate,
)
from app.services.osm import geocode_address, search_osm, unavailable_filters

router = APIRouter()


async def _account_radius(user: PublicUser | None, database: AsyncIOMotorDatabase) -> int:
    if user is None:
        return 1000
    from bson import ObjectId

    document = await database.users.find_one({"_id": ObjectId(user.id)}, {"preferences.radius_m": 1})
    return int((document or {}).get("preferences", {}).get("radius_m", 1000))


@router.post("/restaurants/search", response_model=RestaurantSearchResponse)
@limiter.limit("30/minute")
async def restaurant_search(
    request: Request,
    payload: RestaurantSearchRequest,
    user: PublicUser | None = Depends(optional_current_user),  # noqa: B008
    database: AsyncIOMotorDatabase = Depends(get_database),  # noqa: B008
) -> RestaurantSearchResponse:
    if payload.address:
        location = await geocode_address(payload.address)
    else:
        location = Location(lat=payload.lat, lon=payload.lon, source="browser")  # type: ignore[arg-type]
    radius = payload.radius_m or await _account_radius(user, database)
    results = await search_osm(payload, location, radius)
    missing_filters = unavailable_filters(payload)
    if payload.cuisines and any(not item.cuisines for item in results):
        missing_filters.append("cuisines")
    if payload.dietary and any(not item.dietary_tags for item in results):
        missing_filters.append("dietary")
    return RestaurantSearchResponse(
        results=results,
        count=len(results),
        location=location,
        radius_m=radius,
        unavailable_filters=sorted(set(missing_filters)),
    )


@router.get("/users/me/preferences")
async def read_preferences(
    user: PublicUser = Depends(current_user),  # noqa: B008
    database: AsyncIOMotorDatabase = Depends(get_database),  # noqa: B008
) -> dict[str, int | str]:
    from bson import ObjectId

    document = await database.users.find_one({"_id": ObjectId(user.id)}, {"preferences": 1, "language": 1})
    preferences = (document or {}).get("preferences", {})
    return {
        "radius_m": preferences.get("radius_m", 1000),
        "language": preferences.get("language", (document or {}).get("language", "fr")),
    }


@router.patch("/users/me/preferences")
async def update_preferences(
    payload: UserPreferencesUpdate,
    user: PublicUser = Depends(current_user),  # noqa: B008
    database: AsyncIOMotorDatabase = Depends(get_database),  # noqa: B008
    _: None = Depends(verify_auth_origin),
) -> dict[str, int | str]:
    from bson import ObjectId
    changes = {}
    if payload.radius_m is not None:
        changes["preferences.radius_m"] = payload.radius_m
    if payload.language is not None:
        changes["preferences.language"] = payload.language
    await database.users.update_one({"_id": ObjectId(user.id)}, {"$set": changes})
    return await read_preferences(user, database)
