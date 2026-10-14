from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    mongo_url: str = "mongodb://localhost:27017"
    mongo_database: str = "feedme"
    mongo_server_selection_timeout_ms: int = 2_000
    jwt_secret: str = "dev-only-secret-change-me"
    jwt_expire_minutes: int = 60 * 24
    frontend_origin: str = "http://localhost:3000"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
