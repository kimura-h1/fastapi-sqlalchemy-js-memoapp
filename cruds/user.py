from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import models.user as user_model
import schemas.user as user_schema
from auth import hash_password


async def get_user_by_email(session: AsyncSession, email: str) -> user_model.User | None:
    result = await session.execute(
        select(user_model.User).where(user_model.User.email == email)
    )
    return result.scalars().first()


async def create_user(session: AsyncSession, data: user_schema.RegisterSchema) -> user_model.User:
    user = user_model.User(
        email=data.email,
        hashed_password=hash_password(data.password),
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user
