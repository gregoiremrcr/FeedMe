from fastapi import FastAPI


app = FastAPI(
    title="FeedMe API",
    version="0.1.0",
    description="API backend de FeedMe.",
)


@app.get("/health", tags=["system"])
async def health() -> dict[str, str]:
    """Return a stable liveness response without requiring external services."""
    return {"status": "ok", "service": "feedme-backend"}

