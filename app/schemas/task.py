from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class TaskCreate(BaseModel):
    title: str = Field(min_length=3, max_length=100)
    description: Optional[str] = None
    assigned_to: int
    due_date: datetime
    project_id: int

class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    status: str
    assigned_to: Optional[int] = None
    assigned_to_name: Optional[str] = "Unknown"
    project_id: Optional[int] = None
    project_name: Optional[str] = "General"
    due_date: Optional[datetime] = None

    class Config:
        from_attributes = True
