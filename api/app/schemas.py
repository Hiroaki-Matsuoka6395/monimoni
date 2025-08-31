from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import date as date_type, datetime
from decimal import Decimal
from enum import Enum


class TransactionType(str, Enum):
    expense = "expense"
    income = "income"
    transfer = "transfer"


class AccountType(str, Enum):
    cash = "cash"
    bank = "bank"
    card = "card"
    ic = "ic"
    other = "other"

# Base schemas


class HouseholdBase(BaseModel):
    name: str


class UserBase(BaseModel):
    name: str
    email: Optional[str] = None
    is_active: bool = True


class AccountBase(BaseModel):
    name: str
    type: AccountType
    is_active: bool = True


class CategoryBase(BaseModel):
    name: str
    parent_id: Optional[int] = None
    is_active: bool = True


class TagBase(BaseModel):
    name: str


class TransactionItemBase(BaseModel):
    name: str
    quantity: Decimal = Field(default=Decimal("1"), ge=0)
    unit_price: Decimal = Field(default=Decimal("0"), ge=0)
    amount: Decimal = Field(ge=0)
    category_id: Optional[int] = None


class TransactionBase(BaseModel):
    date: date_type
    type: TransactionType
    amount_total: Decimal = Field(gt=0)
    account_id: int
    counter_account_id: Optional[int] = None
    category_id: Optional[int] = None
    payer_user_id: int
    split_ratio_payer: Decimal = Field(default=Decimal("0.50"), ge=0, le=1)
    memo: Optional[str] = None
    has_receipt: bool = False


class BudgetBase(BaseModel):
    month: str = Field(pattern=r"^\d{6}$")  # YYYYMM format
    category_id: int
    amount_limit: Decimal = Field(gt=0)

# Create schemas


class HouseholdCreate(HouseholdBase):
    pass


class UserCreate(UserBase):
    pass


class AccountCreate(AccountBase):
    pass


class CategoryCreate(CategoryBase):
    pass


class TagCreate(TagBase):
    pass


class TransactionItemCreate(TransactionItemBase):
    pass


class TransactionCreate(TransactionBase):
    items: List[TransactionItemCreate] = []
    tags: List[str] = []

    @validator('items')
    def validate_items_total(cls, v, values, **_):
        if 'amount_total' in values and v:
            items_total = sum(item.amount for item in v)
            if abs(items_total - values['amount_total']) > Decimal('0.01'):
                raise ValueError('Sum of item amounts must equal total amount')
        return v


class BudgetCreate(BudgetBase):
    pass

# Response schemas


class HouseholdResponse(HouseholdBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class UserResponse(UserBase):
    id: int
    household_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class AccountResponse(AccountBase):
    id: int
    household_id: int

    class Config:
        from_attributes = True


class CategoryResponse(CategoryBase):
    id: int
    household_id: int

    class Config:
        from_attributes = True


class TagResponse(TagBase):
    id: int
    household_id: int

    class Config:
        from_attributes = True


class TransactionItemResponse(TransactionItemBase):
    id: int
    transaction_id: int

    class Config:
        from_attributes = True


class TransactionResponse(TransactionBase):
    id: int
    household_id: int
    created_by: int
    created_at: datetime
    updated_at: datetime
    items: List[TransactionItemResponse] = []
    tag_names: List[str] = []

    class Config:
        from_attributes = True


class BudgetResponse(BudgetBase):
    id: int
    household_id: int

    class Config:
        from_attributes = True

# Update schemas


class TransactionUpdate(BaseModel):
    date: Optional[date_type] = None
    type: Optional[TransactionType] = None
    amount_total: Optional[Decimal] = Field(None, gt=0)
    account_id: Optional[int] = None
    counter_account_id: Optional[int] = None
    category_id: Optional[int] = None
    payer_user_id: Optional[int] = None
    split_ratio_payer: Optional[Decimal] = Field(None, ge=0, le=1)
    memo: Optional[str] = None
    has_receipt: Optional[bool] = None
    items: Optional[List[TransactionItemCreate]] = None
    tags: Optional[List[str]] = None

# Pagination


class PaginatedResponse(BaseModel):
    total: int
    page: int
    size: int
    pages: int


class TransactionListResponse(PaginatedResponse):
    transactions: List[TransactionResponse]

# Reports


class MonthlyReportResponse(BaseModel):
    month: str
    total_income: Decimal
    total_expenses: Decimal
    net_amount: Decimal
    categories: List[dict]
    budget_status: List[dict]


class SplitReportResponse(BaseModel):
    from_date: Optional[date_type]
    to_date: Optional[date_type]
    users: List[dict]
    total_expenses: Decimal

# File upload


class ReceiptUploadResponse(BaseModel):
    id: int
    filename: str
    size: int
    mime_type: str
    upload_url: str

# CSV Import/Export


class CSVImportResponse(BaseModel):
    filename: str
    total_rows: int
    valid_rows: int
    error_rows: int
    errors: List[dict]
    dry_run: bool

# Authentication


class LoginRequest(BaseModel):
    pin: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
