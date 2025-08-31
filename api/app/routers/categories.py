from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from pydantic import BaseModel
import logging

from app.database import get_db
from app.models import Category

logger = logging.getLogger(__name__)

router = APIRouter()


class CategoryCreate(BaseModel):
    name: str
    type: str
    household_id: int = 1


class CategoryUpdate(BaseModel):
    name: str
    type: str


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
                "type": "expense" if category.parent_id is None else "income",  # 簡易的な判定
                "household_id": category.household_id
            })

        return categories_data
    except Exception as e:
        logger.error("Error fetching categories: %s", str(e))
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/")
def create_category(category_data: CategoryCreate, db: Session = Depends(get_db)):
    """Create a new category."""
    try:
        new_category = Category(
            name=category_data.name,
            household_id=category_data.household_id,
            parent_id=None,  # 基本的にすべて親カテゴリとして作成
            is_active=True
        )

        db.add(new_category)
        db.commit()

        return {
            "id": new_category.id,
            "name": new_category.name,
            "type": category_data.type,
            "household_id": new_category.household_id
        }
    except Exception as e:
        db.rollback()
        logger.error("Error creating category: %s", str(e))
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/{category_id}")
def update_category(category_id: int, category_data: CategoryUpdate, db: Session = Depends(get_db)):
    """Update a category."""
    try:
        category = db.execute(
            select(Category).where(Category.id == category_id, Category.household_id == 1)
        ).scalar_one_or_none()

        if not category:
            raise HTTPException(status_code=404, detail="Category not found")

        category.name = category_data.name
        db.commit()

        return {
            "id": category.id,
            "name": category.name,
            "type": category_data.type,
            "household_id": category.household_id
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error("Error updating category: %s", str(e))
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db)):
    """Delete a category (soft delete)."""
    try:
        category = db.execute(
            select(Category).where(Category.id == category_id, Category.household_id == 1)
        ).scalar_one_or_none()

        if not category:
            raise HTTPException(status_code=404, detail="Category not found")

        category.is_active = False
        db.commit()

        return {"message": "Category deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error("Error deleting category: %s", str(e))
        raise HTTPException(status_code=500, detail="Internal server error") from e
