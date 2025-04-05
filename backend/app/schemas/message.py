from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.user import UserPublic

class MessageBase(BaseModel):
    content: str
    chat_id: int
    chat_type: str  # "private" or "group"

class MessageCreate(MessageBase):
    pass

class Message(BaseModel):
    id: int
    content: str
    sender_id: int
    chat_type: str
    created_at: datetime
    
    # For private messages
    recipient_id: Optional[int] = None
    
    # For group messages
    group_id: Optional[int] = None
    
    class Config:
        orm_mode = True

class MessageOut(BaseModel):
    id: int
    content: str
    sender_id: int
    chat_type: str
    created_at: datetime
    timestamp: datetime
    chat_id: int
    sender: Optional[UserPublic] = None
    recipient_id: Optional[int] = None
    group_id: Optional[int] = None
    
    class Config:
        orm_mode = True

