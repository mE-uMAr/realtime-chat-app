from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserPublic
from app.utils.auth import get_current_user

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserPublic)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return UserPublic(
        id=current_user.id,
        username=current_user.username,
        full_name=current_user.full_name
    )

@router.get("", response_model=list[UserPublic])
async def get_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    users = db.query(User).all()
    return [
        UserPublic(
            id=user.id,
            username=user.username,
            full_name=user.full_name
        ) for user in users
    ]

