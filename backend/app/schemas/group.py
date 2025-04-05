from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.user import UserPublic

class GroupBase(BaseModel):
    name: str
    description: Optional[str] = None

class GroupCreate(GroupBase):
    member_ids: List[int]

class GroupMember(BaseModel):
    user_id: int
    group_id: int
    
    class Config:
        orm_mode = True

class Group(GroupBase):
    id: int
    creator_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

class GroupOut(Group):
    member_ids: List[int]
    members: Optional[List[UserPublic]] = None
    
    class Config:
        orm_mode = True

