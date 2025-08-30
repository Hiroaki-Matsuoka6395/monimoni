from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
import logging

from app.database import get_db
from app.models import User

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/")
def get_users(db: Session = Depends(get_db)):
    """Get all users for the household."""
    try:
        # 田中家のhousehold_id=1のユーザーを取得
        result = db.execute(select(User).where(User.household_id == 1, User.is_active == True))
        users = result.scalars().all()

        users_data = []
        for user in users:
            users_data.append({
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "is_active": user.is_active
            })

        return {"users": users_data}

    except Exception as e:
        logger.error(f"Error fetching users: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/")
async def create_user(user_data: dict):
    """Create a new user."""
    # TODO: Implement user creation
    return {"message": "User created", "id": 1}


@router.put("/{user_id}")
async def update_user(user_id: int, user_data: dict):
    """Update existing user."""
    # TODO: Implement user update
    return {"message": f"User {user_id} updated"}


@router.delete("/{user_id}")
async def delete_user(user_id: int):
    """Delete user if not in use."""
    # TODO: Implement user deletion with usage check
    return {"message": f"User {user_id} deleted"}
