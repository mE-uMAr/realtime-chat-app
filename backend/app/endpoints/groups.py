from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.group import Group, GroupMember
from app.schemas.group import GroupCreate, GroupOut
from app.schemas.user import UserPublic
from app.utils.auth import get_current_user
from app.utils.websocket import manager

router = APIRouter(prefix="/groups", tags=["groups"])

@router.post("", response_model=GroupOut)
async def create_group(
    group: GroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Ensure creator is in members
    if current_user.id not in group.member_ids:
        group.member_ids.append(current_user.id)
    
    # Create group
    db_group = Group(
        name=group.name,
        description=group.description,
        creator_id=current_user.id
    )
    
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    
    # Add members
    members = []
    for member_id in group.member_ids:
        db_member = GroupMember(group_id=db_group.id, user_id=member_id)
        db.add(db_member)
        
        # Get user details for response
        user = db.query(User).filter(User.id == member_id).first()
        if user:
            members.append(UserPublic(
                id=user.id,
                username=user.username,
                full_name=user.full_name
            ))
    
    db.commit()
    
    # Notify members about new group
    for member_id in group.member_ids:
        if member_id != current_user.id:  # Don't notify creator
            await manager.send_personal_message(
                {
                    "type": "group_created",
                    "data": {
                        "group_id": db_group.id,
                        "name": db_group.name,
                        "creator_id": db_group.creator_id
                    }
                },
                member_id
            )
    
    return GroupOut(
        id=db_group.id,
        name=db_group.name,
        description=db_group.description,
        creator_id=db_group.creator_id,
        created_at=db_group.created_at,
        updated_at=db_group.updated_at,
        member_ids=group.member_ids,
        members=members
    )

@router.get("", response_model=list[GroupOut])
async def get_groups(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get all groups where the user is a member
    user_groups = db.query(Group).join(GroupMember).filter(
        GroupMember.user_id == current_user.id
    ).all()
    
    result = []
    for group in user_groups:
        # Get all members of this group
        group_members = db.query(GroupMember).filter(
            GroupMember.group_id == group.id
        ).all()
        
        member_ids = [member.user_id for member in group_members]
        
        # Get member details
        members = []
        for member_id in member_ids:
            user = db.query(User).filter(User.id == member_id).first()
            if user:
                members.append(UserPublic(
                    id=user.id,
                    username=user.username,
                    full_name=user.full_name
                ))
        
        result.append(GroupOut(
            id=group.id,
            name=group.name,
            description=group.description,
            creator_id=group.creator_id,
            created_at=group.created_at,
            updated_at=group.updated_at,
            member_ids=member_ids,
            members=members
        ))
    
    return result

@router.get("/{group_id}", response_model=GroupOut)
async def get_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if group exists and user is a member
    membership = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=404, detail="Group not found or you're not a member")
    
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Get all members of this group
    group_members = db.query(GroupMember).filter(
        GroupMember.group_id == group.id
    ).all()
    
    member_ids = [member.user_id for member in group_members]
    
    # Get member details
    members = []
    for member_id in member_ids:
        user = db.query(User).filter(User.id == member_id).first()
        if user:
            members.append(UserPublic(
                id=user.id,
                username=user.username,
                full_name=user.full_name
            ))
    
    return GroupOut(
        id=group.id,
        name=group.name,
        description=group.description,
        creator_id=group.creator_id,
        created_at=group.created_at,
        updated_at=group.updated_at,
        member_ids=member_ids,
        members=members
    )

