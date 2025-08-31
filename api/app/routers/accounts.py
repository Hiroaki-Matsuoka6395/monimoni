from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from pydantic import BaseModel
import logging

from app.database import get_db
from app.models import Account

logger = logging.getLogger(__name__)

router = APIRouter()


class AccountCreate(BaseModel):
    name: str
    type: str
    household_id: int = 1


class AccountUpdate(BaseModel):
    name: str
    type: str


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
                "household_id": account.household_id
            })

        return accounts_data
    except Exception as e:
        logger.error(f"Error fetching accounts: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/")
def create_account(account_data: AccountCreate, db: Session = Depends(get_db)):
    """Create a new account."""
    try:
        new_account = Account(
            name=account_data.name,
            type=account_data.type,
            household_id=account_data.household_id,
            is_active=True
        )

        db.add(new_account)
        db.commit()

        return {
            "id": new_account.id,
            "name": new_account.name,
            "type": new_account.type,
            "household_id": new_account.household_id
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating account: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/{account_id}")
def update_account(account_id: int, account_data: AccountUpdate, db: Session = Depends(get_db)):
    """Update an account."""
    try:
        account = db.execute(
            select(Account).where(Account.id == account_id, Account.household_id == 1)
        ).scalar_one_or_none()

        if not account:
            raise HTTPException(status_code=404, detail="Account not found")

        account.name = account_data.name
        account.type = account_data.type
        db.commit()

        return {
            "id": account.id,
            "name": account.name,
            "type": account.type,
            "household_id": account.household_id
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating account: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/{account_id}")
def delete_account(account_id: int, db: Session = Depends(get_db)):
    """Delete an account (soft delete)."""
    try:
        account = db.execute(
            select(Account).where(Account.id == account_id, Account.household_id == 1)
        ).scalar_one_or_none()

        if not account:
            raise HTTPException(status_code=404, detail="Account not found")

        account.is_active = False
        db.commit()

        return {"message": "Account deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting account: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

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
