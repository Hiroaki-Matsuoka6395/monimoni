from fastapi import APIRouter, Query, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from typing import Optional
from datetime import datetime
import logging

from app.database import get_db
from app.models import Budget, Category, Transaction, TransactionType

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/")
def get_budgets(
    month: Optional[str] = Query(None, description="YYYYMM"),
    db: Session = Depends(get_db)
):
    """Get budgets for specified month with actual vs budget amounts."""
    try:
        # デフォルトは現在月
        if not month:
            month = datetime.now().strftime("%Y%m")

        # 予算データを取得
        result = db.execute(
            select(Budget, Category)
            .join(Category, Budget.category_id == Category.id)
            .where(Budget.household_id == 1, Budget.month == month)
        )
        budget_data = result.all()

        budgets = []
        for budget, category in budget_data:
            # 実際の支出を計算（その月の支出取引のみ）
            month_start = f"{month[:4]}-{month[4:]}-01"
            if len(month) == 6 and month[4:] == "12":
                next_month = f"{int(month[:4]) + 1}-01-01"
            else:
                next_month_num = int(month[4:]) + 1
                next_month = f"{month[:4]}-{next_month_num:02d}-01"

            spent_result = db.execute(
                select(func.sum(Transaction.amount_total))
                .where(
                    Transaction.household_id == 1,
                    Transaction.category_id == category.id,
                    Transaction.type == TransactionType.expense,
                    Transaction.date >= month_start,
                    Transaction.date < next_month
                )
            ).scalar()

            spent = float(spent_result) if spent_result else 0.0
            limit = float(budget.amount_limit)

            budgets.append({
                "id": budget.id,
                "category_id": category.id,
                "category_name": category.name,
                "amount_limit": limit,
                "amount_spent": spent,
                "amount_remaining": limit - spent,
                "percentage": round((spent / limit * 100) if limit > 0 else 0, 1),
                "month": month
            })

        return {"budgets": budgets, "month": month}

    except Exception as e:
        logger.error("Error fetching budgets: %s", str(e))
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/")
def update_budgets(budget_data: list, db: Session = Depends(get_db)):
    """Bulk update budgets for a month."""
    try:
        updated_count = 0

        for budget_item in budget_data:
            if not all(key in budget_item for key in ['category_id', 'amount_limit', 'month']):
                continue

            # 既存の予算を更新または新規作成
            existing_budget = db.execute(
                select(Budget).where(
                    Budget.household_id == 1,
                    Budget.category_id == budget_item['category_id'],
                    Budget.month == budget_item['month']
                )
            ).scalar_one_or_none()

            if existing_budget:
                existing_budget.amount_limit = budget_item['amount_limit']
            else:
                new_budget = Budget(
                    household_id=1,
                    category_id=budget_item['category_id'],
                    month=budget_item['month'],
                    amount_limit=budget_item['amount_limit']
                )
                db.add(new_budget)

            updated_count += 1

        db.commit()
        return {"message": "Budgets updated successfully", "count": updated_count}

    except Exception as e:
        db.rollback()
        logger.error("Error updating budgets: %s", str(e))
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/")
def create_budget(budget_data: dict, db: Session = Depends(get_db)):
    """Create a new budget for a category and month."""
    try:
        required_fields = ['category_id', 'amount_limit', 'month']
        for field in required_fields:
            if field not in budget_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")

        # 重複チェック
        existing_budget = db.execute(
            select(Budget).where(
                Budget.household_id == 1,
                Budget.category_id == budget_data['category_id'],
                Budget.month == budget_data['month']
            )
        ).scalar_one_or_none()

        if existing_budget:
            raise HTTPException(status_code=400, detail="Budget already exists for this category and month")

        new_budget = Budget(
            household_id=1,
            category_id=budget_data['category_id'],
            month=budget_data['month'],
            amount_limit=budget_data['amount_limit']
        )

        db.add(new_budget)
        db.commit()

        return {
            "message": "Budget created successfully",
            "id": new_budget.id,
            "category_id": new_budget.category_id,
            "month": new_budget.month,
            "amount_limit": float(new_budget.amount_limit)
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error("Error creating budget: %s", str(e))
        raise HTTPException(status_code=500, detail="Internal server error")
