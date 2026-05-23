from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import schemas.memo as memo_schema
import models.memo as memo_model
from datetime import datetime


async def insert_memo(
        db_session: AsyncSession,
        memo_data: memo_schema.InsertAndUpdateMemoSchema) -> memo_model.Memo:
    new_memo = memo_model.Memo(
        title=memo_data.title,
        description=memo_data.description,
        priority=memo_data.status.priority,
        due_date=memo_data.status.due_date,
        is_completed=memo_data.status.is_completed,
    )
    db_session.add(new_memo)
    await db_session.commit()
    await db_session.refresh(new_memo)
    return new_memo


async def get_memos(
    db_session: AsyncSession,
    skip: int = 0,
    limit: int = 50,
) -> list[memo_model.Memo]:
    result = await db_session.execute(
        select(memo_model.Memo).offset(skip).limit(limit)
    )
    return result.scalars().all()


async def get_memo_by_id(db_session: AsyncSession,
        memo_id: int) -> memo_model.Memo | None:
    result = await db_session.execute(
        select(memo_model.Memo).where(memo_model.Memo.memo_id == memo_id)
    )
    return result.scalars().first()


async def update_memo(
        db_session: AsyncSession,
        memo_id: int,
        target_data: memo_schema.InsertAndUpdateMemoSchema) -> memo_model.Memo | None:
    memo = await get_memo_by_id(db_session, memo_id)
    if memo:
        memo.title = target_data.title
        memo.description = target_data.description
        memo.updated_at = datetime.now()
        memo.priority = target_data.status.priority
        memo.due_date = target_data.status.due_date
        memo.is_completed = target_data.status.is_completed
        await db_session.commit()
        await db_session.refresh(memo)
    return memo


async def delete_memo(
        db_session: AsyncSession, memo_id: int
        ) -> memo_model.Memo | None:
    memo = await get_memo_by_id(db_session, memo_id)
    if memo:
        await db_session.delete(memo)
        await db_session.commit()
    return memo


async def patch_memo(db: AsyncSession, memo_id: int, patch_data: dict):
    memo = await db.get(memo_model.Memo, memo_id)
    if not memo:
        return None
    for key, value in patch_data.items():
        setattr(memo, key, value)
    await db.commit()
    await db.refresh(memo)
    return memo
