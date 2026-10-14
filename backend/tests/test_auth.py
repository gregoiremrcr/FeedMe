from collections.abc import AsyncIterator
from typing import Any

from bson import ObjectId
from fastapi.testclient import TestClient

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


def test_register_login_and_me() -> None:
    with TestClient(app) as client:
        register = client.post(
            "/api/v1/auth/register",
            json={
                "name": "Alex",
                "email": "alex@example.com",
                "campus": "Campus Arch",
                "password": "secret123",
            },
        )
        assert register.status_code == 201
        assert register.json()["email"] == "alex@example.com"
        assert "password_hash" not in register.json()
        assert client.get("/api/v1/auth/me").status_code == 200

        client.post("/api/v1/auth/logout")
        assert client.get("/api/v1/auth/me").status_code == 401

        login = client.post(
            "/api/v1/auth/login",
            json={"email": "alex@example.com", "password": "secret123"},
        )
        assert login.status_code == 200
        assert login.json()["email"] == "alex@example.com"


def test_login_rejects_invalid_credentials() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "unknown@example.com", "password": "secret123"},
        )
        assert response.status_code == 401
