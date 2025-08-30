from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select, func, and_, or_
from typing import List, Optional
from datetime import datetime, date
import logging

from app.database import get_db
from app.models import Transaction, Category, Account, User, TransactionItem
from app.schemas import TransactionResponse, TransactionCreate

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/")
def get_transactions(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    from_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    to_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    category_id: Optional[int] = Query(None),
    account_id: Optional[int] = Query(None),
    user_id: Optional[int] = Query(None),
    q: Optional[str] = Query(None, description="Search query")
):
    """
    Get paginated list of transactions with filters.
    """
    try:
        # シンプルなクエリから開始
        query = select(Transaction)

        # 日付フィルター
        if from_date:
            try:
                from_date_parsed = datetime.strptime(from_date, "%Y-%m-%d").date()
                query = query.where(Transaction.date >= from_date_parsed)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid from_date format. Use YYYY-MM-DD")

        if to_date:
            try:
                to_date_parsed = datetime.strptime(to_date, "%Y-%m-%d").date()
                query = query.where(Transaction.date <= to_date_parsed)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid to_date format. Use YYYY-MM-DD")

        # その他のフィルター
        if category_id:
            query = query.where(Transaction.category_id == category_id)
        if account_id:
            query = query.where(Transaction.account_id == account_id)
        if user_id:
            query = query.where(Transaction.payer_user_id == user_id)
        if q:
            query = query.where(Transaction.memo.contains(q))

        # ソート（日付の降順）
        query = query.order_by(Transaction.date.desc(), Transaction.created_at.desc())

        # 総件数を取得
        count_query = select(func.count()).select_from(query.subquery())
        total = db.execute(count_query).scalar()

        # ページネーション
        offset = (page - 1) * size
        query = query.offset(offset).limit(size)

        # 実行
        result = db.execute(query)
        transactions = result.scalars().all()

        # レスポンス用にデータを変換（関連データは別クエリで取得）
        transactions_data = []
        for transaction in transactions:
            # 関連データを個別に取得
            account = db.execute(select(Account).where(Account.id == transaction.account_id)).scalar_one_or_none() if transaction.account_id else None
            category = db.execute(select(Category).where(Category.id == transaction.category_id)).scalar_one_or_none() if transaction.category_id else None
            payer_user = db.execute(select(User).where(User.id == transaction.payer_user_id)).scalar_one_or_none() if transaction.payer_user_id else None
            items = db.execute(select(TransactionItem).where(TransactionItem.transaction_id == transaction.id)).scalars().all()

            transaction_dict = {
                "id": transaction.id,
                "date": transaction.date.isoformat(),
                "type": transaction.type,
                "amount_total": float(transaction.amount_total),
                "account": {
                    "id": account.id,
                    "name": account.name
                } if account else None,
                "category": {
                    "id": category.id,
                    "name": category.name
                } if category else None,
                "payer_user": {
                    "id": payer_user.id,
                    "name": payer_user.name
                } if payer_user else None,
                "memo": transaction.memo,
                "split_ratio_payer": float(transaction.split_ratio_payer),
                "has_receipt": transaction.has_receipt,
                "created_at": transaction.created_at.isoformat(),
                "items": [
                    {
                        "id": item.id,
                        "name": item.name,
                        "amount": float(item.amount),
                        "quantity": float(item.quantity) if item.quantity else None,
                        "unit_price": float(item.unit_price) if item.unit_price else None
                    }
                    for item in items
                ]
            }
            transactions_data.append(transaction_dict)

        return {
            "transactions": transactions_data,
            "total": total,
            "page": page,
            "size": size,
            "pages": (total + size - 1) // size
        }

    except Exception as e:
        logger.error(f"Error fetching transactions: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/")
async def create_transaction(transaction_data: dict):
    """
    Create a new transaction with items and split information.

    Expected structure:
    {
        "date": "2024-01-01",
        "type": "expense",
        "amount_total": 1000.00,
        "account_id": 1,
        "category_id": 1,
        "payer_user_id": 1,
        "split_ratio_payer": 0.50,
        "memo": "Grocery shopping",
        "items": [
            {
                "name": "Apples",
                "quantity": 2,
                "unit_price": 100,
                "amount": 200,
                "category_id": 1
            }
        ],
        "tags": ["grocery", "healthy"]
    }

    TODO: Implement transaction creation with validation
    """
    logger.info("Creating new transaction")
    return {"message": "Transaction created", "id": 1}


@router.get("/{transaction_id}")
async def get_transaction(transaction_id: int):
    """Get transaction by ID with items and split details."""
    # TODO: Implement transaction retrieval
    return {"message": f"Transaction {transaction_id} details"}


@router.put("/{transaction_id}")
async def update_transaction(transaction_id: int, transaction_data: dict):
    """Update existing transaction."""
    # TODO: Implement transaction update
    return {"message": f"Transaction {transaction_id} updated"}


@router.delete("/{transaction_id}")
async def delete_transaction(transaction_id: int):
    """Delete transaction and associated items."""
    # TODO: Implement transaction deletion
    return {"message": f"Transaction {transaction_id} deleted"}


@router.post("/{transaction_id}/receipts")
async def upload_receipt(transaction_id: int):
    """Upload receipt image for transaction."""
    # TODO: Implement receipt upload
    return {"message": f"Receipt uploaded for transaction {transaction_id}"}
