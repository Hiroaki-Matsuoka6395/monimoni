from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
import logging

from app.database import get_db
from app.models import Category

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/")
def get_categories(db: Session = Depends(get_db)):
    """Get all categories for the household."""
    try:
        # 田中家のhousehold_id=1のカテゴリを取得
        result = db.execute(select(Category).where(Category.household_id == 1, Category.is_active == True))
        categories = result.scalars().all()

        categories_data = []
        for category in categories:
            categories_data.append({
                "id": category.id,
                "name": category.name,
                "parent_id": category.parent_id,
                "is_active": category.is_active
            })

        return {"categories": categories_data}

    except Exception as e:
        logger.error(f"Error fetching categories: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/")
async def create_category(category_data: dict):
    """Create a new category."""
    # TODO: Implement category creation
    return {"message": "Category created", "id": 1}


@router.put("/{category_id}")
async def update_category(category_id: int, category_data: dict):
    """Update existing category."""
    # TODO: Implement category update
    return {"message": f"Category {category_id} updated"}


@router.delete("/{category_id}")
async def delete_category(category_id: int):
    """Delete category if not in use."""
    # TODO: Implement category deletion with usage check
    return {"message": f"Category {category_id} deleted"}
