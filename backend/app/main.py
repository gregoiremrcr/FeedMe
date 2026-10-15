from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import PyMongoError
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.v1.assistant import router as assistant_router
from app.api.v1.auth import router as auth_router
from app.api.v1.restaurants import router as restaurants_router
from app.core.config import get_settings
from app.core.database import create_mongo_client
from app.core.security import limiter


@asynccontextmanager
async def lifespan(application: FastAPI):
    settings = get_settings()
    client = create_mongo_client(settings)
    application.state.mongo_client = client
    application.state.mongo_database = client[settings.mongo_database]
    try:
        yield
    finally:
        client.close()


app = FastAPI(
    title="FeedMe API",
    version="0.1.0",
    description="API backend de FeedMe.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[get_settings().frontend_origin],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["Content-Type"],
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(restaurants_router, prefix="/api/v1", tags=["restaurants"])
app.include_router(assistant_router, prefix="/api/v1", tags=["assistant"])


@app.get("/health", tags=["system"])
async def health() -> dict[str, str]:
    """Return a stable liveness response without requiring external services."""
    return {"status": "ok", "service": "feedme-backend"}


@app.get("/health/ready", tags=["system"])
async def readiness(request: Request) -> JSONResponse:
    """Check that the backend can reach MongoDB."""
    client: AsyncIOMotorClient | None = getattr(request.app.state, "mongo_client", None)
    if client is None:
        return JSONResponse(
            status_code=503,
            content={"status": "unavailable", "service": "mongodb"},
        )

    try:
        await client.admin.command("ping")
    except PyMongoError:
        return JSONResponse(
            status_code=503,
            content={"status": "unavailable", "service": "mongodb"},
        )

    return JSONResponse(content={"status": "ok", "service": "mongodb"})

