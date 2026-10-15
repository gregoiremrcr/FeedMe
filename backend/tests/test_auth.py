from collections.abc import AsyncIterator
from typing import Any

from bson import ObjectId
from fastapi.testclient import TestClient

from app.api.v1 import auth
from app.core import security
from app.core.config import Settings
from app.core.database import get_database
from app.main import app


class InsertResult:
    def __init__(self, inserted_id: ObjectId) -> None:
        self.inserted_id = inserted_id


class FakeUsers:
    def __init__(self) -> None:
        self.documents: list[dict[str, Any]] = []

    async def insert_one(self, document: dict[str, Any]) -> InsertResult:
        document["_id"] = ObjectId()
        self.documents.append(document.copy())
        return InsertResult(document["_id"])

    async def find_one(self, query: dict[str, Any]) -> dict[str, Any] | None:
        for document in self.documents:
            if all(document.get(key) == value for key, value in query.items()):
                return document.copy()
        return None

    async def update_one(self, query: dict[str, Any], update: dict[str, Any]) -> None:
        document = await self.find_one(query)
        if document is not None:
            document.update(update.get("$set", {}))
            for stored in self.documents:
                if stored["_id"] == document["_id"]:
                    stored.update(document)


class FakeDatabase:
    def __init__(self) -> None:
        self.users = FakeUsers()


async def fake_database() -> AsyncIterator[FakeDatabase]:
    yield database


database = FakeDatabase()
app.dependency_overrides[get_database] = fake_database
FRONTEND_HEADERS = {"Origin": "http://localhost:3000"}


def test_register_login_and_me() -> None:
    with TestClient(app) as client:
        register = client.post(
            "/api/v1/auth/register",
            headers=FRONTEND_HEADERS,
            json={
                "name": "Alex",
                "email": " Alex@Example.com ",
                "campus": "Campus Arch",
                "password": "secret123",
            },
        )
        assert register.status_code == 201
        assert register.json()["email"] == "alex@example.com"
        assert "password_hash" not in register.json()
        cookie = register.headers["set-cookie"].lower()
        assert "httponly" in cookie and "samesite=lax" in cookie
        assert "secure" not in cookie
        assert client.get("/api/v1/auth/me").status_code == 200

        client.post("/api/v1/auth/logout", headers=FRONTEND_HEADERS)
        assert client.get("/api/v1/auth/me").status_code == 401

        login = client.post(
            "/api/v1/auth/login",
            headers=FRONTEND_HEADERS,
            json={"email": "alex@example.com", "password": "secret123"},
        )
        assert login.status_code == 200
        assert login.json()["email"] == "alex@example.com"


def test_login_rejects_invalid_credentials() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/auth/login",
            headers=FRONTEND_HEADERS,
            json={"email": "unknown@example.com", "password": "secret123"},
        )
        assert response.status_code == 401


def test_auth_mutations_reject_untrusted_origin() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/auth/login",
            headers={"Origin": "https://attacker.example"},
            json={"email": "alex@example.com", "password": "secret123"},
        )
    assert response.status_code == 403


def test_register_rejects_name_that_is_too_short_after_trimming() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/auth/register",
            headers=FRONTEND_HEADERS,
            json={
                "name": "A ",
                "email": "short-name@example.com",
                "campus": "Campus Arch",
                "password": "secret123",
            },
        )
    assert response.status_code == 422


def test_cors_allows_only_configured_frontend_with_credentials() -> None:
    with TestClient(app) as client:
        allowed = client.options(
            "/api/v1/auth/login",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
        )
        denied = client.options(
            "/api/v1/auth/login",
            headers={
                "Origin": "https://attacker.example",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
        )
    assert allowed.headers.get("access-control-allow-origin") == "http://localhost:3000"
    assert allowed.headers.get("access-control-allow-credentials") == "true"
    assert "access-control-allow-origin" not in denied.headers


def test_auth_cookie_secure_flag_tracks_environment(monkeypatch) -> None:
    production_settings = Settings(
        app_env="production",
        frontend_origin="https://feedme.example",
        jwt_secret="production-test-secret-with-more-than-32-characters",
    )
    monkeypatch.setattr(auth, "get_settings", lambda: production_settings)
    monkeypatch.setattr(security, "get_settings", lambda: production_settings)

    with TestClient(app) as client:
        response = client.post(
            "/api/v1/auth/register",
            headers={"Origin": "https://feedme.example"},
            json={
                "name": "Alex",
                "email": "alex-production@example.com",
                "campus": "Campus Arch",
                "password": "secret123",
            },
        )
    assert response.status_code == 201
    assert "access_token=" in response.headers["set-cookie"]
    assert "httponly" in response.headers["set-cookie"].lower()
    assert "secure" in response.headers["set-cookie"].lower()


def test_login_rate_limit_returns_429() -> None:
    with TestClient(app) as client:
        login_responses = [
            client.post(
                "/api/v1/auth/login",
                headers=FRONTEND_HEADERS,
                json={"email": "unknown@example.com", "password": "secret123"},
            )
            for _ in range(15)
        ]
        register_responses = [
            client.post(
                "/api/v1/auth/register",
                headers=FRONTEND_HEADERS,
                json={
                    "name": "Alex",
                    "email": f"rate-limit-{index}@example.com",
                    "campus": "Campus Arch",
                    "password": "secret123",
                },
            )
            for index in range(10)
        ]
    assert any(response.status_code == 429 for response in login_responses)
    assert any(response.status_code == 429 for response in register_responses)
