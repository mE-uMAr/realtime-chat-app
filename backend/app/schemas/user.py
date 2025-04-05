from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserPublic(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None
    
    class Config:
        orm_mode = True

class User(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserPublic

class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[int] = None

