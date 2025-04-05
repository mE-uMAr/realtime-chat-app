from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.group import Group, GroupMember
from app.models.message import Message
from app.schemas.message import MessageCreate, MessageOut
from app.schemas.user import UserPublic
from app.utils.auth import get_current_user
from app.utils.websocket import manager

router = APIRouter(prefix="/messages", tags=["messages"])

@router.post("", response_model=MessageOut)
async def create_message(
    message: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validate chat_id based on chat_type
    if message.chat_type == "group":
        # Check if group exists and user is a member
        membership = db.query(GroupMember).filter(
            GroupMember.group_id == message.chat_id,
            GroupMember.user_id == current_user.id
        ).first()
        
        if not membership:
            raise HTTPException(status_code=404, detail="Group not found or you're not a member")
        
        # Create message
        db_message = Message(
            content=message.content,
            sender_id=current_user.id,
            chat_type=message.chat_type,
            group_id=message.chat_id
        )
    else:  # Private message
        # Create message
        db_message = Message(
            content=message.content,
            sender_id=current_user.id,
            chat_type=message.chat_type,
            recipient_id=message.chat_id
        )
    
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    
    # Create response
    sender = UserPublic(
        id=current_user.id,
        username=current_user.username,
        full_name=current_user.full_name
    )
    
    message_out = MessageOut(
        id=db_message.id,
        content=db_message.content,
        sender_id=db_message.sender_id,
        chat_type=db_message.chat_type,
        created_at=db_message.created_at,
        timestamp=db_message.created_at,
        chat_id=message.chat_id,
        recipient_id=db_message.recipient_id,
        group_id=db_message.group_id,
        sender=sender
    )
    
    # Notify recipients
    if message.chat_type == "private":
        # For private chat, notify the other user
        recipient_id = message.chat_id
        await manager.send_personal_message(
            {
                "type": "new_message",
                "data": {
                    "id": db_message.id,
                    "content": db_message.content,
                    "sender_id": db_message.sender_id,
                    "chat_id": message.chat_id,
                    "chat_type": db_message.chat_type,
                    "created_at": db_message.created_at.isoformat(),
                    "timestamp": db_message.created_at.isoformat(),
                    "sender": {
                        "id": sender.id,
                        "username": sender.username,
                        "full_name": sender.full_name
                    }
                }
            },
            recipient_id
        )
    else:
        # For group chat, notify all members except sender
        group_members = db.query(GroupMember).filter(
            GroupMember.group_id == message.chat_id
        ).all()
        
        for member in group_members:
            if member.user_id != current_user.id:
                await manager.send_personal_message(
                    {
                        "type": "new_message",
                        "data": {
                            "id": db_message.id,
                            "content": db_message.content,
                            "sender_id": db_message.sender_id,
                            "chat_id": message.chat_id,
                            "chat_type": db_message.chat_type,
                            "created_at": db_message.created_at.isoformat(),
                            "timestamp": db_message.created_at.isoformat(),
                            "sender": {
                                "id": sender.id,
                                "username": sender.username,
                                "full_name": sender.full_name
                            }
                        }
                    },
                    member.user_id
                )
    
    return message_out

@router.get("/{chat_type}/{chat_id}", response_model=list[MessageOut])
async def get_messages(
    chat_type: str,
    chat_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validate access to chat
    if chat_type == "group":
        # Check if group exists and user is a member
        membership = db.query(GroupMember).filter(
            GroupMember.group_id == chat_id,
            GroupMember.user_id == current_user.id
        ).first()
        
        if not membership:
            raise HTTPException(status_code=404, detail="Group not found or you're not a member")
        
        # Get messages for this group
        messages_query = db.query(Message).filter(
            Message.chat_type == "group",
            Message.group_id == chat_id
        ).order_by(Message.created_at)
    else:  # Private chat
        # Get messages between the two users (in both directions)
        messages_query = db.query(Message).filter(
            Message.chat_type == "private",
            ((Message.sender_id == current_user.id) & (Message.recipient_id == chat_id)) |
            ((Message.sender_id == chat_id) & (Message.recipient_id == current_user.id))
        ).order_by(Message.created_at)
    
    messages = messages_query.all()
    
    result = []
    for message in messages:
        # Get sender details
        sender = None
        user = db.query(User).filter(User.id == message.sender_id).first()
        if user:
            sender = UserPublic(
                id=user.id,
                username=user.username,
                full_name=user.full_name
            )
        
        result.append(MessageOut(
            id=message.id,
            content=message.content,
            sender_id=message.sender_id,
            chat_type=message.chat_type,
            recipient_id=message.recipient_id,
            group_id=message.group_id,
            created_at=message.created_at,
            timestamp=message.created_at,
            chat_id=message.group_id if message.chat_type == "group" else message.recipient_id,
            sender=sender
        ))
    
    return result

