from pydantic import BaseModel
from typing import Optional

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_by: Optional[int] = None

    class Config:
        from_attributes = True
