from fastapi import HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import get_settings

limiter = Limiter(key_func=get_remote_address, default_limits=[])


async def verify_auth_origin(request: Request) -> None:
    """Require browser mutations to originate from the configured frontend."""
    origin = request.headers.get("origin")
    if origin != get_settings().frontend_origin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Origine de la requête non autorisée.",
        )
