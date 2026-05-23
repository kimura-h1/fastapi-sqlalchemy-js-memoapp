import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import text

Base = declarative_base()

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL が設定されていません。"
        ".env.example を参考に .env ファイルを作成してください。"
    )

engine = create_async_engine(DATABASE_URL, echo=False)

async_session = sessionmaker(
    engine,
    expire_on_commit=False,
    class_=AsyncSession,
)


async def get_dbsession():
    async with async_session() as session:
        await session.execute(text("SET search_path TO app"))
        yield session