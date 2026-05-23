from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import schemas.memo as memo_schema
import models.memo as memo_model
from datetime import datetime


async def insert_memo(
        session: AsyncSession,
        memo_data: memo_schema.InsertAndUpdateMemoSchema,
        user_id: int) -> memo_model.Memo:
    new_memo = memo_model.Memo(
        user_id=user_id,
        title=memo_data.title,
        description=memo_data.description,
        priority=memo_data.status.priority,
        due_date=memo_data.status.due_date,
        is_completed=memo_data.status.is_completed,
    )
    session.add(new_memo)
    await session.commit()
    await session.refresh(new_memo)
    return new_memo


async def get_memos(
    session: AsyncSession,
    user_id: int,
    skip: int = 0,
    limit: int = 50,
) -> list[memo_model.Memo]:
    result = await session.execute(
        select(memo_model.Memo)
        .where(memo_model.Memo.user_id == user_id)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


async def get_memo_by_id(
        session: AsyncSession,
        memo_id: int,
        user_id: int) -> memo_model.Memo | None:
    result = await session.execute(
        select(memo_model.Memo).where(
            memo_model.Memo.memo_id == memo_id,
            memo_model.Memo.user_id == user_id,
        )
    )
    return result.scalars().first()


async def update_memo(
        session: AsyncSession,
        memo_id: int,
        target_data: memo_schema.InsertAndUpdateMemoSchema,
        user_id: int) -> memo_model.Memo | None:
    memo = await get_memo_by_id(session, memo_id, user_id)
    if memo:
        memo.title = target_data.title
        memo.description = target_data.description
        memo.updated_at = datetime.now()
        memo.priority = target_data.status.priority
        memo.due_date = target_data.status.due_date
        memo.is_completed = target_data.status.is_completed
        await session.commit()
        await session.refresh(memo)
    return memo


async def delete_memo(
        session: AsyncSession,
        memo_id: int,
        user_id: int) -> memo_model.Memo | None:
    memo = await get_memo_by_id(session, memo_id, user_id)
    if memo:
        await session.delete(memo)
        await session.commit()
    return memo


async def patch_memo(
        session: AsyncSession,
        memo_id: int,
        patch_data: dict,
        user_id: int) -> memo_model.Memo | None:
    memo = await get_memo_by_id(session, memo_id, user_id)
    if not memo:
        return None
    for key, value in patch_data.items():
        setattr(memo, key, value)
    await session.commit()
    await session.refresh(memo)
    return memo
