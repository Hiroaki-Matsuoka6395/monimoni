from fastapi import APIRouter, Query
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/monthly")
async def get_monthly_report(month: Optional[str] = Query(None, description="YYYYMM")):
    """Get monthly spending summary."""
    # TODO: Implement monthly report
    return {"month": month, "total_income": 0, "total_expenses": 0, "categories": []}


@router.get("/trend")
async def get_trend_report(
    from_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    to_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    group_by: str = Query("month", description="month or week")
):
    """Get spending trend over time."""
    # TODO: Implement trend report
    return {"from_date": from_date, "to_date": to_date, "group_by": group_by, "data": []}


@router.get("/split")
async def get_split_report(
    from_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    to_date: Optional[str] = Query(None, description="YYYY-MM-DD")
):
    """Get expense split analysis between users."""
    # TODO: Implement split report
    return {"from_date": from_date, "to_date": to_date, "users": []}
