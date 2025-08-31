from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from typing import Optional
from datetime import datetime
import logging

from app.database import get_db
from app.models import Transaction, Category, Account, User, TransactionItem

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
        count_query = select(func.count('*')).select_from(query.subquery())
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
        logger.error("Error fetching transactions: %s", str(e))
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/")
def create_transaction(transaction_data: dict, db: Session = Depends(get_db)):
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
        "split_ratio_payer": 50,
        "memo": "Grocery shopping",
        "items": [
            {
                "name": "Apples",
                "quantity": 2,
                "unit_price": 100,
                "amount": 200
            }
        ]
    }
    """
    try:
        logger.info("Creating new transaction")

        # 必須フィールドの検証
        required_fields = ["date", "type", "amount_total"]
        for field in required_fields:
            if field not in transaction_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")

        # 日付の解析
        try:
            transaction_date = datetime.strptime(transaction_data["date"], "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

        # トランザクションの作成
        new_transaction = Transaction(
            household_id=1,  # 田中家固定
            date=transaction_date,
            type=transaction_data["type"],
            amount_total=float(transaction_data["amount_total"]),
            account_id=transaction_data.get("account_id", 1),  # デフォルトで現金
            category_id=transaction_data.get("category_id"),
            payer_user_id=transaction_data.get("payer_user_id", 1),  # デフォルトで田中太郎
            split_ratio_payer=float(transaction_data.get("split_ratio_payer", 50)) / 100.0,
            memo=transaction_data.get("memo", ""),
            has_receipt=False,  # デフォルトでfalse
            created_by=transaction_data.get("payer_user_id", 1)  # 作成者は支払者と同じ
        )

        db.add(new_transaction)
        db.flush()  # IDを取得するため

        # アイテムの追加（もしあれば）
        if "items" in transaction_data and transaction_data["items"]:
            for item_data in transaction_data["items"]:
                if "name" in item_data and "amount" in item_data:
                    new_item = TransactionItem(
                        transaction_id=new_transaction.id,
                        name=item_data["name"],
                        amount=float(item_data["amount"]),
                        quantity=float(item_data["quantity"]) if item_data.get("quantity") else None,
                        unit_price=float(item_data["unit_price"]) if item_data.get("unit_price") else None,
                        category_id=item_data.get("category_id")
                    )
                    db.add(new_item)

        db.commit()

        return {
            "message": "Transaction created successfully",
            "id": new_transaction.id,
            "date": new_transaction.date.isoformat(),
            "amount_total": float(new_transaction.amount_total)
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error("Error creating transaction: %s", str(e))
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{transaction_id}")
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    """Get transaction by ID with items and split details."""
    try:
        # トランザクションを取得
        transaction = db.execute(
            select(Transaction).where(Transaction.id == transaction_id)
        ).scalar_one_or_none()

        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")

        # 関連データを取得
        account = db.execute(select(Account).where(Account.id == transaction.account_id)).scalar_one_or_none() if transaction.account_id else None
        category = db.execute(select(Category).where(Category.id == transaction.category_id)).scalar_one_or_none() if transaction.category_id else None
        payer_user = db.execute(select(User).where(User.id == transaction.payer_user_id)).scalar_one_or_none() if transaction.payer_user_id else None
        items = db.execute(select(TransactionItem).where(TransactionItem.transaction_id == transaction.id)).scalars().all()

        return {
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
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error fetching transaction: %s", str(e))
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/{transaction_id}")
def update_transaction(transaction_id: int, transaction_data: dict, db: Session = Depends(get_db)):
    """Update existing transaction."""
    try:
        # トランザクションを取得
        transaction = db.execute(
            select(Transaction).where(Transaction.id == transaction_id)
        ).scalar_one_or_none()

        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")

        # 更新可能フィールドの処理
        if "date" in transaction_data:
            try:
                transaction.date = datetime.strptime(transaction_data["date"], "%Y-%m-%d").date()
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

        if "type" in transaction_data:
            transaction.type = transaction_data["type"]
        if "amount_total" in transaction_data:
            transaction.amount_total = float(transaction_data["amount_total"])
        if "account_id" in transaction_data:
            transaction.account_id = transaction_data["account_id"]
        if "category_id" in transaction_data:
            transaction.category_id = transaction_data["category_id"]
        if "payer_user_id" in transaction_data:
            transaction.payer_user_id = transaction_data["payer_user_id"]
        if "memo" in transaction_data:
            transaction.memo = transaction_data["memo"]
        if "split_ratio_payer" in transaction_data:
            transaction.split_ratio_payer = float(transaction_data["split_ratio_payer"]) / 100.0

        # アイテムの更新（既存のアイテムを削除して新しく追加）
        if "items" in transaction_data:
            # 既存アイテムを削除
            db.execute(
                select(TransactionItem).where(TransactionItem.transaction_id == transaction_id)
            )
            existing_items = db.execute(
                select(TransactionItem).where(TransactionItem.transaction_id == transaction_id)
            ).scalars().all()
            for item in existing_items:
                db.delete(item)

            # 新しいアイテムを追加
            for item_data in transaction_data["items"]:
                if "name" in item_data and "amount" in item_data:
                    new_item = TransactionItem(
                        transaction_id=transaction_id,
                        name=item_data["name"],
                        amount=float(item_data["amount"]),
                        quantity=float(item_data["quantity"]) if item_data.get("quantity") else None,
                        unit_price=float(item_data["unit_price"]) if item_data.get("unit_price") else None,
                        category_id=item_data.get("category_id")
                    )
                    db.add(new_item)

        db.commit()

        return {
            "message": "Transaction updated successfully",
            "id": transaction.id,
            "date": transaction.date.isoformat(),
            "amount_total": float(transaction.amount_total)
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error("Error updating transaction: %s", str(e))
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/{transaction_id}")
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    """Delete transaction and associated items."""
    try:
        # トランザクションを取得
        transaction = db.execute(
            select(Transaction).where(Transaction.id == transaction_id)
        ).scalar_one_or_none()

        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")

        # 関連アイテムを削除
        items = db.execute(
            select(TransactionItem).where(TransactionItem.transaction_id == transaction_id)
        ).scalars().all()
        for item in items:
            db.delete(item)

        # トランザクションを削除
        db.delete(transaction)
        db.commit()

        return {"message": "Transaction deleted successfully", "id": transaction_id}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error("Error deleting transaction: %s", str(e))
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/{transaction_id}/receipts")
async def upload_receipt(transaction_id: int):
    """Upload receipt image for transaction."""
    # TODO: Implement receipt upload
    return {"message": f"Receipt uploaded for transaction {transaction_id}"}
