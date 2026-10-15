import asyncio
from collections.abc import AsyncIterator
from typing import Any, ClassVar, Self
from unittest.mock import AsyncMock

import httpx
import pytest
from app.api.v1 import assistant, restaurants
from app.api.v1.auth import PublicUser, current_user
from app.core.config import Settings
from app.core.database import get_database
from app.main import app
from app.schemas.restaurants import Location, Restaurant, RestaurantSearchRequest
from app.services import osm
from fastapi.testclient import TestClient


class FakeUsers:
    radius_m = 1000
    language = "fr"

    async def find_one(self, *args: Any, **kwargs: Any) -> None:
        return {"preferences": {"radius_m": self.radius_m, "language": self.language}}

    async def update_one(self, query: dict[str, Any], update: dict[str, Any]) -> None:
        self.radius_m = update["$set"].get("preferences.radius_m", self.radius_m)
        self.language = update["$set"].get("preferences.language", self.language)


class FakeDatabase:
    users = FakeUsers()


database = FakeDatabase()


async def fake_database() -> AsyncIterator[FakeDatabase]:
    yield database


@pytest.fixture(autouse=True)
def use_fake_database():
    previous = app.dependency_overrides.get(get_database)
    app.dependency_overrides[get_database] = fake_database
    database.users.radius_m = 1000
    database.users.language = "fr"
    osm._geocode_cache.clear()
    osm._overpass_cache.clear()
    yield
    if previous is None:
        app.dependency_overrides.pop(get_database, None)
    else:
        app.dependency_overrides[get_database] = previous


def test_search_rejects_request_without_location() -> None:
    with TestClient(app) as client:
        response = client.post("/api/v1/restaurants/search", json={})
    assert response.status_code == 422


def test_search_uses_default_radius_and_keeps_unknown_price_unavailable(monkeypatch: pytest.MonkeyPatch) -> None:
    item = {
        "id": "node/1", "name": "Test Bistro", "lat": 48.9, "lon": 2.3,
        "distance_m": 80, "address": None, "cuisines": [], "kind": "restaurant",
        "website": None, "phone": None, "opening_hours": None, "dietary_tags": [],
        "price": None, "wait_minutes": None, "menu_url": None, "rating": None,
        "sources": [{"name": "OpenStreetMap", "url": "https://www.openstreetmap.org/node/1"}],
    }
    monkeypatch.setattr(restaurants, "search_osm", AsyncMock(return_value=[item]))
    with TestClient(app) as client:
        response = client.post("/api/v1/restaurants/search", json={"lat": 48.9, "lon": 2.3, "max_price_eur": 12})
    assert response.status_code == 200
    assert response.json()["radius_m"] == 1000
    assert response.json()["results"][0]["price"] is None
    assert response.json()["unavailable_filters"] == ["max_price_eur"]


def test_address_geocoding_is_used(monkeypatch: pytest.MonkeyPatch) -> None:
    expected = Location(lat=48.85, lon=2.35, label="Paris", source="address")
    geocode = AsyncMock(return_value=expected)
    search = AsyncMock(return_value=[])
    monkeypatch.setattr(restaurants, "geocode_address", geocode)
    monkeypatch.setattr(restaurants, "search_osm", search)
    with TestClient(app) as client:
        response = client.post("/api/v1/restaurants/search", json={"address": "Paris, France"})
    assert response.status_code == 200
    assert response.json()["location"]["source"] == "address"
    geocode.assert_awaited_once_with("Paris, France")
    assert response.json()["results"] == []


def test_account_radius_preference_can_be_read_and_updated() -> None:
    account = PublicUser(id="507f1f77bcf86cd799439011", name="Test", email="test@example.com", campus="Campus")
    app.dependency_overrides[current_user] = lambda: account
    try:
        with TestClient(app) as client:
            before = client.get("/api/v1/users/me/preferences")
            changed = client.patch(
                "/api/v1/users/me/preferences",
                headers={"Origin": "http://localhost:3000"},
                json={"radius_m": 2500, "language": "en"},
            )
            after = client.get("/api/v1/users/me/preferences")
        assert before.json()["radius_m"] == 1000
        assert changed.status_code == 200
        assert after.json()["radius_m"] == 2500
        assert after.json()["language"] == "en"
    finally:
        app.dependency_overrides.pop(current_user, None)


def test_osm_parser_supports_ways_without_fabricating_price() -> None:
    result = osm._to_restaurant(
        {
            "type": "way", "id": 42, "center": {"lat": 48.85, "lon": 2.35},
            "tags": {"name": "Restaurant Test", "amenity": "restaurant", "cuisine": "italian;pizza"},
        },
        Location(lat=48.85, lon=2.35, source="browser"),
    )
    assert result is not None
    assert result.id == "way/42"
    assert result.cuisines == ["italian", "pizza"]
    assert result.price is None
    assert result.distance_m == 0


def test_nominatim_geocoder_uses_app_user_agent_and_caches(monkeypatch: pytest.MonkeyPatch) -> None:
    class Response:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> list[dict[str, str]]:
            return [{"lat": "48.85", "lon": "2.35", "display_name": "Paris"}]

    class Client:
        calls = 0

        async def __aenter__(self) -> Self:
            return self

        async def __aexit__(self, *args: object) -> None:
            return None

        async def get(self, *args: Any, **kwargs: Any) -> Response:
            self.calls += 1
            assert kwargs["headers"]["User-Agent"].startswith("FeedMe/")
            return Response()

    client = Client()
    monkeypatch.setattr(osm.httpx, "AsyncClient", lambda *args, **kwargs: client)
    first = asyncio.run(osm.geocode_address("Paris, France"))
    second = asyncio.run(osm.geocode_address(" paris,   france "))
    assert first.lat == second.lat == 48.85
    assert client.calls == 1


def test_osm_search_returns_empty_list_without_mock_fallback(monkeypatch: pytest.MonkeyPatch) -> None:
    configured_timeout = 45.0

    class Response:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict[str, list[Any]]:
            return {"elements": []}

    class Client:
        def __init__(self, timeout: float) -> None:
            assert timeout == configured_timeout

        async def __aenter__(self) -> Self:
            return self

        async def __aexit__(self, *args: object) -> None:
            return None

        async def post(self, *args: Any, **kwargs: Any) -> Response:
            return Response()

    monkeypatch.setattr(
        osm,
        "get_settings",
        lambda: Settings(_env_file=None, overpass_timeout_seconds=configured_timeout),
    )
    monkeypatch.setattr(osm.httpx, "AsyncClient", lambda *args, **kwargs: Client(**kwargs))
    request = RestaurantSearchRequest(lat=48.85, lon=2.35)
    result = asyncio.run(
        osm.search_osm(request, Location(lat=48.85, lon=2.35, source="browser"), 1000)
    )
    assert result == []


def test_osm_search_posts_to_configured_provider_and_maps_elements(monkeypatch: pytest.MonkeyPatch) -> None:
    configured_url = "https://api-overpass.pikamap.fr/api/interpreter"
    request = RestaurantSearchRequest(lat=48.85, lon=2.35)
    captured: dict[str, Any] = {}

    class Response:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict[str, list[dict[str, Any]]]:
            return {
                "elements": [
                    {
                        "type": "node",
                        "id": 1,
                        "lat": 48.851,
                        "lon": 2.351,
                        "tags": {
                            "name": "Node Bistro",
                            "cuisine": "french;wine",
                            "addr:housenumber": "1",
                            "addr:street": "Rue Test",
                            "phone": "+33123456789",
                            "website": "https://node.example",
                            "opening_hours": "Mo-Su 10:00-22:00",
                        },
                    },
                    {
                        "type": "way",
                        "id": 2,
                        "center": {"lat": 48.852, "lon": 2.352},
                        "tags": {"name": "Way Cafe", "amenity": "cafe"},
                    },
                    {
                        "type": "relation",
                        "id": 3,
                        "center": {"lat": 48.853, "lon": 2.353},
                        "tags": {"name": "Relation Restaurant", "amenity": "restaurant"},
                    },
                ]
            }

    class Client:
        def __init__(self, timeout: float) -> None:
            assert timeout == 17.0

        async def __aenter__(self) -> Self:
            return self

        async def __aexit__(self, *args: object) -> None:
            return None

        async def post(self, url: str, **kwargs: Any) -> Response:
            captured["url"] = url
            captured.update(kwargs)
            return Response()

    monkeypatch.setattr(
        osm,
        "get_settings",
        lambda: Settings(_env_file=None, overpass_url=configured_url, overpass_timeout_seconds=17.0),
    )
    monkeypatch.setattr(osm.httpx, "AsyncClient", lambda *args, **kwargs: Client(**kwargs))

    result = asyncio.run(osm.search_osm(request, Location(lat=48.85, lon=2.35, source="browser"), 1000))

    assert captured["url"] == configured_url
    assert captured["headers"]["Accept"] == "application/json"
    assert captured["headers"]["User-Agent"].startswith("FeedMe/")
    assert captured["data"]["data"].startswith("\n[out:json]")
    assert {restaurant.id for restaurant in result} == {"node/1", "way/2", "relation/3"}
    node = next(restaurant for restaurant in result if restaurant.id == "node/1")
    assert node.address == "1, Rue Test"
    assert node.phone == "+33123456789"
    assert node.website == "https://node.example"
    assert node.opening_hours == "Mo-Su 10:00-22:00"
    assert node.price is None
    assert node.rating is None
    assert node.wait_minutes is None


def test_assistant_calls_osm_tool_and_returns_structured_candidates(monkeypatch: pytest.MonkeyPatch) -> None:
    class ToolUse:
        type = "tool_use"
        name = "search_nearby_restaurants"
        id = "tool-1"
        input: ClassVar[dict[str, Any]] = {"cuisines": ["italian"]}

    class Text:
        type = "text"
        text = "J’ai trouvé un restaurant italien à proximité."

    class FirstResponse:
        content: ClassVar[list[ToolUse]] = [ToolUse()]

    class FinalResponse:
        content: ClassVar[list[Text]] = [Text()]

    class Messages:
        calls = 0

        async def create(self, **kwargs: Any) -> Any:
            self.calls += 1
            return FirstResponse() if self.calls == 1 else FinalResponse()

    class FakeClaude:
        messages = Messages()

        async def close(self) -> None:
            return None

    monkeypatch.setattr(assistant, "_client", lambda: FakeClaude())
    item = {
        "id": "node/5", "name": "Trattoria", "lat": 48.9, "lon": 2.3,
        "distance_m": 90, "address": None, "cuisines": ["italian"], "kind": "restaurant",
        "website": None, "phone": None, "opening_hours": None, "dietary_tags": [],
        "price": None, "wait_minutes": None, "menu_url": None, "rating": None,
        "sources": [{"name": "OpenStreetMap", "url": "https://www.openstreetmap.org/node/5"}],
    }
    monkeypatch.setattr(assistant, "search_osm", AsyncMock(return_value=[Restaurant.model_validate(item)]))
    with TestClient(app) as client:
        response = client.post("/api/v1/assistant/messages", json={"message": "Un italien proche", "lat": 48.9, "lon": 2.3})
    assert response.status_code == 200
    assert response.json()["answer"] == "J’ai trouvé un restaurant italien à proximité."
    assert response.json()["results"][0]["name"] == "Trattoria"


def test_overpass_provider_error_is_controlled(monkeypatch: pytest.MonkeyPatch) -> None:
    class Client:
        async def __aenter__(self) -> Self:
            return self

        async def __aexit__(self, *args: object) -> None:
            return None

        async def post(self, *args: Any, **kwargs: Any) -> None:
            raise httpx.ConnectError("offline")

    monkeypatch.setattr(osm.httpx, "AsyncClient", lambda *args, **kwargs: Client())
    with TestClient(app) as client:
        response = client.post("/api/v1/restaurants/search", json={"lat": 48.85, "lon": 2.35})
    assert response.status_code == 502
    assert response.json()["detail"] == "La recherche OpenStreetMap est temporairement indisponible."


def test_overpass_invalid_json_is_controlled(monkeypatch: pytest.MonkeyPatch) -> None:
    class Response:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict[str, Any]:
            raise ValueError("invalid JSON")

    class Client:
        async def __aenter__(self) -> Self:
            return self

        async def __aexit__(self, *args: object) -> None:
            return None

        async def post(self, *args: Any, **kwargs: Any) -> Response:
            return Response()

    monkeypatch.setattr(osm.httpx, "AsyncClient", lambda *args, **kwargs: Client())
    with TestClient(app) as client:
        response = client.post("/api/v1/restaurants/search", json={"lat": 48.85, "lon": 2.35})
    assert response.status_code == 502
    assert response.json()["detail"] == "La recherche OpenStreetMap est temporairement indisponible."
