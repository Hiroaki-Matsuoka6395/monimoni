from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
import logging

from app.database import get_db
from app.models import Account

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/")
def get_accounts(db: Session = Depends(get_db)):
    """Get all accounts for the household."""
    try:
        # 田中家のhousehold_id=1のアカウントを取得
        result = db.execute(select(Account).where(Account.household_id == 1, Account.is_active == True))
        accounts = result.scalars().all()

        accounts_data = []
        for account in accounts:
            accounts_data.append({
                "id": account.id,
                "name": account.name,
                "type": account.type,
                "is_active": account.is_active
            })

        return {"accounts": accounts_data}

    except Exception as e:
        logger.error(f"Error fetching accounts: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/")
async def create_account(account_data: dict):
    """Create a new account."""
    # TODO: Implement account creation
    return {"message": "Account created", "id": 1}


@router.put("/{account_id}")
async def update_account(account_id: int, account_data: dict):
    """Update existing account."""
    # TODO: Implement account update
    return {"message": f"Account {account_id} updated"}


@router.delete("/{account_id}")
async def delete_account(account_id: int):
    """Delete account if not in use."""
    # TODO: Implement account deletion with usage check
    return {"message": f"Account {account_id} deleted"}
