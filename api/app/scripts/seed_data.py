"""
データベースにサンプルデータを投入するスクリプト

実行方法:
docker-compose exec api python -m app.scripts.seed_data
"""

import asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import date, datetime
from decimal import Decimal

from app.models import (
    Household, User, Account, Category, Transaction, TransactionItem,
    Tag, Budget, TransactionType, AccountType, AuthType
)
from app.settings import settings


def get_sync_database_url():
    """同期用データベースURLを取得"""
    url = settings.DATABASE_URL
    if "+aiomysql" in url:
        url = url.replace("+aiomysql", "+pymysql")
    return url


def create_sample_data():
    """サンプルデータを作成"""

    # データベース接続
    engine = create_engine(get_sync_database_url())
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        print("🏠 家族データを作成中...")

        # 1. 家族を作成
        household = Household(
            name="田中家",
            created_at=datetime.now()
        )
        db.add(household)
        db.flush()  # IDを取得するためにflush

        print(f"✅ 家族「{household.name}」を作成しました (ID: {household.id})")

        # 2. ユーザーを作成
        users_data = [
            {"name": "田中太郎（夫）", "email": "taro@example.com"},
            {"name": "田中花子（妻）", "email": "hanako@example.com"}
        ]

        users = []
        for user_data in users_data:
            user = User(
                household_id=household.id,
                name=user_data["name"],
                email=user_data["email"],
                auth_type=AuthType.pin,
                is_active=True,
                created_at=datetime.now()
            )
            db.add(user)
            users.append(user)

        db.flush()
        print(f"✅ {len(users)}人のユーザーを作成しました")

        # 3. アカウント（支払い方法）を作成
        accounts_data = [
            {"name": "現金", "type": AccountType.cash},
            {"name": "みずほ銀行（夫）", "type": AccountType.bank},
            {"name": "三井住友銀行（妻）", "type": AccountType.bank},
            {"name": "楽天カード", "type": AccountType.card},
            {"name": "Suica", "type": AccountType.ic}
        ]

        accounts = []
        for account_data in accounts_data:
            account = Account(
                household_id=household.id,
                name=account_data["name"],
                type=account_data["type"],
                is_active=True
            )
            db.add(account)
            accounts.append(account)

        db.flush()
        print(f"✅ {len(accounts)}個のアカウントを作成しました")

        # 4. カテゴリを作成
        categories_data = [
            {"name": "食費", "parent_id": None},
            {"name": "外食", "parent_id": None},
            {"name": "交通費", "parent_id": None},
            {"name": "光熱費", "parent_id": None},
            {"name": "通信費", "parent_id": None},
            {"name": "日用品", "parent_id": None},
            {"name": "医療費", "parent_id": None},
            {"name": "娯楽", "parent_id": None},
            {"name": "教育", "parent_id": None},
            {"name": "給与", "parent_id": None},
            {"name": "ボーナス", "parent_id": None}
        ]

        categories = []
        for category_data in categories_data:
            category = Category(
                household_id=household.id,
                name=category_data["name"],
                parent_id=category_data["parent_id"],
                is_active=True
            )
            db.add(category)
            categories.append(category)

        db.flush()
        print(f"✅ {len(categories)}個のカテゴリを作成しました")

        # 5. タグを作成
        tags_data = ["食材", "有機", "セール", "必需品", "贅沢"]

        tags = []
        for tag_name in tags_data:
            tag = Tag(
                household_id=household.id,
                name=tag_name
            )
            db.add(tag)
            tags.append(tag)

        db.flush()
        print(f"✅ {len(tags)}個のタグを作成しました")

        # 6. 予算を作成（今月分）
        current_month = datetime.now().strftime("%Y%m")
        budgets_data = [
            {"category_name": "食費", "amount": Decimal("60000")},
            {"category_name": "外食", "amount": Decimal("20000")},
            {"category_name": "交通費", "amount": Decimal("15000")},
            {"category_name": "光熱費", "amount": Decimal("25000")},
            {"category_name": "通信費", "amount": Decimal("12000")},
            {"category_name": "日用品", "amount": Decimal("10000")},
            {"category_name": "娯楽", "amount": Decimal("30000")}
        ]

        budgets = []
        for budget_data in budgets_data:
            # カテゴリを検索
            category = next((c for c in categories if c.name == budget_data["category_name"]), None)
            if category:
                budget = Budget(
                    household_id=household.id,
                    month=current_month,
                    category_id=category.id,
                    amount_limit=budget_data["amount"]
                )
                db.add(budget)
                budgets.append(budget)

        db.flush()
        print(f"✅ {len(budgets)}個の予算を作成しました")

        # 7. サンプル取引を作成
        transactions_data = [
            {
                "date": date(2024, 8, 1),
                "type": TransactionType.income,
                "amount": Decimal("300000"),
                "account": "みずほ銀行（夫）",
                "category": "給与",
                "payer": "田中太郎（夫）",
                "memo": "8月分給与",
                "split_ratio": Decimal("1.0")  # 収入は100%
            },
            {
                "date": date(2024, 8, 2),
                "type": TransactionType.expense,
                "amount": Decimal("8500"),
                "account": "現金",
                "category": "食費",
                "payer": "田中花子（妻）",
                "memo": "スーパーでの買い物",
                "split_ratio": Decimal("0.5"),
                "items": [
                    {"name": "米", "quantity": Decimal("1"), "amount": Decimal("2000")},
                    {"name": "野菜セット", "quantity": Decimal("1"), "amount": Decimal("1500")},
                    {"name": "肉類", "quantity": Decimal("1"), "amount": Decimal("3000")},
                    {"name": "調味料", "quantity": Decimal("1"), "amount": Decimal("2000")}
                ]
            },
            {
                "date": date(2024, 8, 5),
                "type": TransactionType.expense,
                "amount": Decimal("12000"),
                "account": "楽天カード",
                "category": "外食",
                "payer": "田中太郎（夫）",
                "memo": "家族でレストラン",
                "split_ratio": Decimal("0.5")
            },
            {
                "date": date(2024, 8, 10),
                "type": TransactionType.expense,
                "amount": Decimal("18500"),
                "account": "みずほ銀行（夫）",
                "category": "光熱費",
                "payer": "田中太郎（夫）",
                "memo": "電気・ガス代",
                "split_ratio": Decimal("0.5")
            },
            {
                "date": date(2024, 8, 15),
                "type": TransactionType.expense,
                "amount": Decimal("3200"),
                "account": "Suica",
                "category": "交通費",
                "payer": "田中花子（妻）",
                "memo": "電車代",
                "split_ratio": Decimal("0.5")
            }
        ]

        for tx_data in transactions_data:
            # 関連データを検索
            account = next((a for a in accounts if a.name == tx_data["account"]), None)
            category = next((c for c in categories if c.name == tx_data["category"]), None)
            payer = next((u for u in users if u.name == tx_data["payer"]), None)

            if account and category and payer:
                transaction = Transaction(
                    household_id=household.id,
                    date=tx_data["date"],
                    type=tx_data["type"],
                    amount_total=tx_data["amount"],
                    account_id=account.id,
                    category_id=category.id,
                    payer_user_id=payer.id,
                    split_ratio_payer=tx_data["split_ratio"],
                    memo=tx_data["memo"],
                    has_receipt=False,
                    created_by=payer.id,
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )
                db.add(transaction)
                db.flush()

                # アイテムがある場合は追加
                if "items" in tx_data:
                    for item_data in tx_data["items"]:
                        item = TransactionItem(
                            transaction_id=transaction.id,
                            name=item_data["name"],
                            quantity=item_data["quantity"],
                            unit_price=item_data["amount"],
                            amount=item_data["amount"],
                            category_id=category.id
                        )
                        db.add(item)

        db.flush()
        print(f"✅ サンプル取引を作成しました")

        # 全ての変更をコミット
        db.commit()

        print("\n🎉 サンプルデータの作成が完了しました！")
        print(f"📊 作成されたデータ:")
        print(f"   - 家族: 1件")
        print(f"   - ユーザー: {len(users)}件")
        print(f"   - アカウント: {len(accounts)}件")
        print(f"   - カテゴリ: {len(categories)}件")
        print(f"   - タグ: {len(tags)}件")
        print(f"   - 予算: {len(budgets)}件")
        print(f"   - 取引: {len(transactions_data)}件")

    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    create_sample_data()
