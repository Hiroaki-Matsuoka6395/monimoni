from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# 環境変数からデータベースURLを取得
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+aiomysql://app:app_password_change_me@db:3306/family_budget"
)

# 同期版のデータベースURL（APIで使用）
SYNC_DATABASE_URL = DATABASE_URL.replace("aiomysql", "pymysql")

# SQLAlchemyエンジンを作成
engine = create_engine(
    SYNC_DATABASE_URL,
    echo=True if os.getenv("DEBUG") else False,
    pool_pre_ping=True,
    pool_recycle=300
)

# セッションファクトリーを作成
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base クラス
Base = declarative_base()

# データベースセッションの依存性


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
