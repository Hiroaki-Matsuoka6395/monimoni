from sqlalchemy import (
    Column, Integer, String, DateTime, Date, Boolean, Text,
    ForeignKey, Enum, UniqueConstraint, Index, JSON, Numeric
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

Base = declarative_base()


class TransactionType(str, enum.Enum):
    expense = "expense"
    income = "income"
    transfer = "transfer"


class AccountType(str, enum.Enum):
    cash = "cash"
    bank = "bank"
    card = "card"
    ic = "ic"
    other = "other"


class AuthType(str, enum.Enum):
    pin = "pin"


class Household(Base):
    __tablename__ = "households"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=func.now, nullable=False)

    # Relationships
    users = relationship("User", back_populates="household")
    accounts = relationship("Account", back_populates="household")
    categories = relationship("Category", back_populates="household")
    transactions = relationship("Transaction", back_populates="household")
    tags = relationship("Tag", back_populates="household")
    budgets = relationship("Budget", back_populates="household")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    household_id = Column(Integer, ForeignKey("households.id"), nullable=False)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    auth_type = Column(Enum(AuthType), default=AuthType.pin, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=func.now, nullable=False)

    # Relationships
    household = relationship("Household", back_populates="users")
    transactions_as_payer = relationship("Transaction", foreign_keys="Transaction.payer_user_id")
    transactions_created = relationship("Transaction", foreign_keys="Transaction.created_by")
    audit_logs = relationship("AuditLog", back_populates="user")


class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    household_id = Column(Integer, ForeignKey("households.id"), nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(Enum(AccountType), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    household = relationship("Household", back_populates="accounts")
    transactions = relationship("Transaction", foreign_keys="Transaction.account_id")
    counter_transactions = relationship("Transaction", foreign_keys="Transaction.counter_account_id")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    household_id = Column(Integer, ForeignKey("households.id"), nullable=False)
    name = Column(String(255), nullable=False)
    parent_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    household = relationship("Household", back_populates="categories")
    parent = relationship("Category", remote_side=[id])
    transactions = relationship("Transaction", back_populates="category")
    transaction_items = relationship("TransactionItem", back_populates="category")
    budgets = relationship("Budget", back_populates="category")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    household_id = Column(Integer, ForeignKey("households.id"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    type = Column(Enum(TransactionType), nullable=False)
    amount_total = Column(Numeric(12, 2), nullable=False, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False, index=True)
    counter_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True, index=True)
    payer_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    split_ratio_payer = Column(Numeric(5, 2), default=0.50, nullable=False)
    memo = Column(Text, nullable=True)
    has_receipt = Column(Boolean, default=False, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=func.now, nullable=False)
    updated_at = Column(DateTime, default=func.now, onupdate=func.now, nullable=False)

    # Relationships
    household = relationship("Household", back_populates="transactions")
    account = relationship("Account", foreign_keys=[account_id], overlaps="transactions")
    counter_account = relationship("Account", foreign_keys=[counter_account_id], overlaps="counter_transactions")
    category = relationship("Category", back_populates="transactions")
    payer_user = relationship("User", foreign_keys=[payer_user_id], overlaps="transactions_as_payer")
    created_by_user = relationship("User", foreign_keys=[created_by], overlaps="transactions_created")
    items = relationship("TransactionItem", back_populates="transaction", cascade="all, delete-orphan")
    receipts = relationship("Receipt", back_populates="transaction", cascade="all, delete-orphan")
    tags = relationship("Tag", secondary="transaction_tags", back_populates="transactions")


class TransactionItem(Base):
    __tablename__ = "transaction_items"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False)
    name = Column(String(255), nullable=False)
    quantity = Column(Numeric(10, 2), default=1, nullable=False)
    unit_price = Column(Numeric(12, 2), default=0, nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)

    # Relationships
    transaction = relationship("Transaction", back_populates="items")
    category = relationship("Category", back_populates="transaction_items")


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    household_id = Column(Integer, ForeignKey("households.id"), nullable=False)
    name = Column(String(255), nullable=False)

    # Relationships
    household = relationship("Household", back_populates="tags")
    transactions = relationship("Transaction", secondary="transaction_tags", back_populates="tags")

    __table_args__ = (
        UniqueConstraint('household_id', 'name', name='uq_household_tag_name'),
    )


class TransactionTag(Base):
    __tablename__ = "transaction_tags"

    transaction_id = Column(Integer, ForeignKey("transactions.id"), primary_key=True)
    tag_id = Column(Integer, ForeignKey("tags.id"), primary_key=True)


class Receipt(Base):
    __tablename__ = "receipts"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=False)
    size = Column(Integer, nullable=False)
    storage_path = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=func.now, nullable=False)

    # Relationships
    transaction = relationship("Transaction", back_populates="receipts")


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    household_id = Column(Integer, ForeignKey("households.id"), nullable=False)
    month = Column(String(6), nullable=False)  # YYYYMM format
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    amount_limit = Column(Numeric(12, 2), nullable=False)

    # Relationships
    household = relationship("Household", back_populates="budgets")
    category = relationship("Category", back_populates="budgets")

    __table_args__ = (
        UniqueConstraint('household_id', 'month', 'category_id', name='uq_budget_month_category'),
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    entity = Column(String(64), nullable=False)
    entity_id = Column(Integer, nullable=False)
    action = Column(String(32), nullable=False)
    payload_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=func.now, nullable=False)

    # Relationships
    user = relationship("User", back_populates="audit_logs")

    # Indexes
    __table_args__ = (
        Index('idx_audit_entity', 'entity', 'entity_id'),
        Index('idx_audit_user_date', 'user_id', 'created_at'),
    )
