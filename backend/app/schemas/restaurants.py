import re
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

Radius = Literal[500, 1000, 2000, 5000]
Cuisine = Literal["french", "italian", "japanese", "indian", "fast_food", "cafe", "other"]
Dietary = Literal["vegetarian", "vegan", "halal", "gluten_free"]
Allergy = Literal["peanuts", "seafood", "dairy", "gluten"]
MealType = Literal["restaurant", "fast_food", "cafe", "takeaway"]
SortBy = Literal["distance", "relevance", "rating"]


class RestaurantSearchRequest(BaseModel):
    lat: float | None = Field(default=None, ge=-90, le=90)
    lon: float | None = Field(default=None, ge=-180, le=180)
    address: str | None = Field(default=None, min_length=3, max_length=300)
    radius_m: Radius | None = None
    cuisines: list[Cuisine] = Field(default_factory=list, max_length=10)
    dietary: list[Dietary] = Field(default_factory=list, max_length=10)
    allergies: list[Allergy] = Field(default_factory=list, max_length=10)
    dish_type: MealType | None = None
    max_price_eur: float | None = Field(default=None, gt=0, le=1000)
    max_wait_minutes: int | None = Field(default=None, ge=0, le=600)
    sort_by: SortBy = "distance"

    @model_validator(mode="after")
    def validate_location(self) -> "RestaurantSearchRequest":
        if (self.lat is None) != (self.lon is None):
            raise ValueError("lat et lon doivent être renseignés ensemble.")
        if self.lat is None and not self.address:
            raise ValueError("Une adresse ou des coordonnées sont requises.")
        return self


class Location(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)
    label: str | None = Field(default=None, max_length=500)
    source: Literal["browser", "address"]


class Restaurant(BaseModel):
    id: str = Field(max_length=100)
    name: str = Field(max_length=300)
    lat: float
    lon: float
    distance_m: int
    address: str | None = Field(default=None, max_length=500)
    cuisines: list[str] = Field(default_factory=list)
    kind: str
    takeaway: bool | None = None
    website: str | None = Field(default=None, max_length=2000)
    phone: str | None = Field(default=None, max_length=100)
    opening_hours: str | None = Field(default=None, max_length=300)
    dietary_tags: list[str] = Field(default_factory=list, max_length=30)
    price: float | None = None
    wait_minutes: int | None = None
    menu_url: str | None = Field(default=None, max_length=2000)
    rating: float | None = Field(default=None, ge=0, le=5)
    sources: list[dict[str, str]] = Field(default_factory=list)


class RestaurantSearchResponse(BaseModel):
    results: list[Restaurant]
    count: int
    location: Location
    radius_m: int
    provider: str = "openstreetmap"
    attribution: str = "© OpenStreetMap contributors"
    unavailable_filters: list[str] = Field(default_factory=list)


class UserPreferencesUpdate(BaseModel):
    radius_m: int | None = Field(default=None, ge=100, le=10_000)
    language: str | None = Field(default=None, min_length=2, max_length=10)

    @field_validator("language")
    @classmethod
    def validate_language(cls, value: str | None) -> str | None:
        if value is not None and not re.fullmatch(r"[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*", value):
            raise ValueError("Le code de langue est invalide.")
        return value

    @model_validator(mode="after")
    def require_a_preference(self) -> "UserPreferencesUpdate":
        if self.radius_m is None and self.language is None:
            raise ValueError("Renseigne au moins une préférence à modifier.")
        return self


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class AssistantMessageRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    history: list[ChatTurn] = Field(default_factory=list, max_length=20)
    lat: float | None = Field(default=None, ge=-90, le=90)
    lon: float | None = Field(default=None, ge=-180, le=180)

    @model_validator(mode="after")
    def validate_coordinates(self) -> "AssistantMessageRequest":
        if (self.lat is None) != (self.lon is None):
            raise ValueError("lat et lon doivent être renseignés ensemble.")
        if sum(len(turn.content) for turn in self.history) + len(self.message) > 12_000:
            raise ValueError("L’historique du chatbot est trop long. Commence une nouvelle recherche.")
        return self


class AssistantMessageResponse(BaseModel):
    answer: str
    results: list[Restaurant] = Field(default_factory=list)
    needs_location: bool = False
    location: Location | None = None
    sources: list[dict[str, str]] = Field(default_factory=list)


class RestaurantSearchToolArguments(BaseModel):
    model_config = ConfigDict(extra="forbid")

    address: str | None = Field(default=None, min_length=3, max_length=300)
    radius_m: Radius | None = None
    cuisines: list[Cuisine] = Field(default_factory=list, max_length=10)
    dietary: list[Dietary] = Field(default_factory=list, max_length=10)
    allergies: list[Allergy] = Field(default_factory=list, max_length=10)
    dish_type: MealType | None = None
    max_price_eur: float | None = Field(default=None, gt=0, le=1000)
    max_wait_minutes: int | None = Field(default=None, ge=0, le=600)
