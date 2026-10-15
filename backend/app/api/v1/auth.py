import re
from datetime import UTC, datetime, timedelta

import jwt
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pwdlib import PasswordHash
from pydantic import BaseModel, Field, field_validator
from pymongo.errors import DuplicateKeyError

from app.core.config import get_settings
from app.core.database import get_database
from app.core.security import limiter, verify_auth_origin

router = APIRouter()
password_hash = PasswordHash.recommended()
EMAIL_PATTERN = r"(?:[A-Za-z0-9_'+-]+\.)*[A-Za-z0-9_'+-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9-]*\.)+[A-Za-z]{2,}"


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=60)
    email: str = Field(min_length=3, max_length=254)
    campus: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("name", "campus")
    @classmethod
    def normalize_required_text(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Ce champ ne peut pas être vide")
        return normalized

    @field_validator("name")
    @classmethod
    def validate_name_length(cls, value: str) -> str:
        if len(value) < 2:
            raise ValueError("Le nom doit contenir au moins 2 caractères")
        return value

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not re.fullmatch(EMAIL_PATTERN, normalized):
            raise ValueError("Adresse email invalide")
        return normalized

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not re.search(r"[A-Za-z]", value) or not re.search(r"[0-9]", value):
            raise ValueError("Le mot de passe doit contenir une lettre et un chiffre")
        return value


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not re.fullmatch(EMAIL_PATTERN, normalized):
            raise ValueError("Adresse email invalide")
        return normalized


class PublicUser(BaseModel):
    id: str
    name: str
    email: str
    campus: str


def user_response(document: dict) -> PublicUser:
    return PublicUser(
        id=str(document["_id"]),
        name=document["display_name"],
        email=document["email"],
        campus=document.get("campus", ""),
    )


def create_access_token(user_id: str) -> str:
    settings = get_settings()
    expires_at = datetime.now(UTC) + timedelta(minutes=settings.jwt_expire_minutes)
    return jwt.encode(
        {"sub": user_id, "exp": expires_at, "iat": datetime.now(UTC), "type": "access"},
        settings.jwt_secret,
        algorithm="HS256",
    )


def set_auth_cookie(response: Response, token: str) -> None:
    settings = get_settings()
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite="none",
        max_age=settings.jwt_expire_minutes * 60,
        path="/",
    )


async def current_user(
    request: Request,
    database: AsyncIOMotorDatabase = Depends(get_database),  # noqa: B008
) -> PublicUser:
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentification requise")

    try:
        payload = jwt.decode(token, get_settings().jwt_secret, algorithms=["HS256"])
        user_id = payload.get("sub")
        if not isinstance(user_id, str) or not ObjectId.is_valid(user_id):
            raise ValueError
    except (jwt.InvalidTokenError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentification requise") from None

    document = await database.users.find_one({"_id": ObjectId(user_id), "is_active": True})
    if document is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentification requise")
    return user_response(document)


async def optional_current_user(
    request: Request,
    database: AsyncIOMotorDatabase = Depends(get_database),  # noqa: B008
) -> PublicUser | None:
    """Allow public restaurant search while using account preferences when signed in."""
    if not request.cookies.get("access_token"):
        return None
    return await current_user(request, database)


@router.post("/register", response_model=PublicUser, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(
    request: Request,
    payload: RegisterRequest,
    response: Response,
    database: AsyncIOMotorDatabase = Depends(get_database),  # noqa: B008
    _: None = Depends(verify_auth_origin),
) -> PublicUser:
    now = datetime.now(UTC)
    document = {
        "email": payload.email,
        "password_hash": password_hash.hash(payload.password),
        "display_name": payload.name.strip(),
        "campus": payload.campus.strip(),
        "preferences": {"radius_m": 1000, "language": "fr"},
        "created_at": now,
        "updated_at": now,
        "last_login_at": now,
        "is_active": True,
    }
    try:
        result = await database.users.insert_one(document)
    except DuplicateKeyError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Un compte existe déjà avec cet email") from None

    document["_id"] = result.inserted_id
    set_auth_cookie(response, create_access_token(str(result.inserted_id)))
    return user_response(document)


@router.post("/login", response_model=PublicUser)
@limiter.limit("10/minute")
async def login(
    request: Request,
    payload: LoginRequest,
    response: Response,
    database: AsyncIOMotorDatabase = Depends(get_database),  # noqa: B008
    _: None = Depends(verify_auth_origin),
) -> PublicUser:
    document = await database.users.find_one({"email": payload.email, "is_active": True})
    if document is None or not password_hash.verify(payload.password, document["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email ou mot de passe incorrect")

    await database.users.update_one(
        {"_id": document["_id"]},
        {"$set": {"last_login_at": datetime.now(UTC), "updated_at": datetime.now(UTC)}},
    )
    set_auth_cookie(response, create_access_token(str(document["_id"])))
    return user_response(document)


@router.get("/me", response_model=PublicUser)
async def me(user: PublicUser = Depends(current_user)) -> PublicUser:  # noqa: B008
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    response: Response,
    _: None = Depends(verify_auth_origin),
) -> None:
    response.delete_cookie(
        "access_token",
        path="/",
        secure=get_settings().auth_cookie_secure,
        httponly=True,
        samesite="none",
    )
