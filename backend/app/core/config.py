from functools import lru_cache
from typing import Literal
from urllib.parse import urlsplit

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: Literal["development", "test", "production"] = "development"
    mongo_url: str = "mongodb://localhost:27017"
    mongo_database: str = "feedme"
    mongo_server_selection_timeout_ms: int = 2_000
    jwt_secret: str = Field(
        default="dev-only-secret-change-me-32-bytes-minimum",
        min_length=32,
    )
    jwt_expire_minutes: int = 60 * 24
    frontend_origin: str = "http://localhost:3000"
    overpass_url: str = "https://api-overpass.pikamap.fr/api/interpreter"
    overpass_timeout_seconds: float = Field(default=30.0, gt=0, le=60)
    nominatim_url: str = "https://nominatim.openstreetmap.org/search"
    osm_user_agent: str = "FeedMe/1.0 (restaurant discovery; configure OSM_USER_AGENT)"
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.5-flash"
    gemini_timeout_seconds: float = Field(default=30.0, gt=0, le=120)
    gemini_max_output_tokens: int = Field(default=800, ge=128, le=4000)
    gemini_web_search_enabled: bool = False

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @model_validator(mode="after")
    def validate_security_settings(self) -> "Settings":
        origin = urlsplit(self.frontend_origin)
        if (
            origin.scheme not in {"http", "https"}
            or not origin.netloc
            or origin.path
            or origin.query
            or origin.fragment
            or origin.username
            or origin.password
        ):
            raise ValueError("FRONTEND_ORIGIN doit être une origine HTTP(S) sans chemin.")
        if self.app_env == "production":
            if self.jwt_secret == "dev-only-secret-change-me-32-bytes-minimum":
                raise ValueError("JWT_SECRET doit être défini explicitement en production.")
            if origin.scheme != "https":
                raise ValueError("FRONTEND_ORIGIN doit utiliser HTTPS en production.")
        return self

    @property
    def auth_cookie_secure(self) -> bool:
        return self.app_env == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
