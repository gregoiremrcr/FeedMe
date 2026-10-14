from pydantic import BaseModel, Field
from typing import Optional

class SearchParams(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    radius: float = Field(default=1500, gt=0, le=10000)
    cuisine: Optional[str] = None
    budget: Optional[int] = Field(default=None, ge=1, le=3)