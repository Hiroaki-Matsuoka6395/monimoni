from fastapi import APIRouter
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/")
async def get_categories():
    """Get all categories for the household."""
    # TODO: Implement category retrieval
    return {"categories": []}


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
