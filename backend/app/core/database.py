from collections.abc import AsyncIterator

from fastapi import Request
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import Settings


def create_mongo_client(settings: Settings) -> AsyncIOMotorClient:
    return AsyncIOMotorClient(
        settings.mongo_url,
        serverSelectionTimeoutMS=settings.mongo_server_selection_timeout_ms,
    )


async def get_database(request: Request) -> AsyncIterator[AsyncIOMotorDatabase]:
    state = request.app.state
    database = getattr(state, "mongo_database", None)
    if database is None:
        raise RuntimeError("La connexion MongoDB n'est pas initialisée.")
    yield database
