from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

from typing import Optional

class UserResponse(BaseModel):
    id: int
    name: Optional[str] = None
    email: str
    role: Optional[str] = "member"

    class Config:
        from_attributes = True
