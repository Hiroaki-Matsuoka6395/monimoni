from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.database import get_db
from app.models import Transaction

router = APIRouter()


@router.get("/")
def get_transactions_simple(db: Session = Depends(get_db)):
    """
    Simplified transaction endpoint for debugging
    """
    try:
        # 最もシンプルなクエリ
        result = db.execute(select(Transaction).limit(5))
        transactions = result.scalars().all()

        return {
            "count": len(transactions),
            "transactions": [
                {
                    "id": t.id,
                    "date": str(t.date),
                    "type": t.type,
                    "amount_total": float(t.amount_total),
                    "memo": t.memo
                }
                for t in transactions
            ]
        }
    except Exception as e:
        return {"error": str(e)}


@router.get("/debug")
def debug_endpoint():
    """
    Basic debug endpoint
    """
    return {"message": "Debug endpoint working"}
