from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import db
import cruds.user as user_crud
import schemas.user as user_schema
from auth import verify_password, create_access_token, get_current_user
import models.user as user_model

router = APIRouter(tags=["Auth"], prefix="/auth")


@router.post("/register", response_model=user_schema.TokenSchema, status_code=201)
async def register(
    data: user_schema.RegisterSchema,
    session: AsyncSession = Depends(db.get_dbsession),
):
    existing = await user_crud.get_user_by_email(session, data.email)
    if existing:
        raise HTTPException(status_code=400, detail="このメールアドレスはすでに登録されています")

    user = await user_crud.create_user(session, data)
    token = create_access_token(user.user_id)
    return user_schema.TokenSchema(access_token=token)


@router.post("/login", response_model=user_schema.TokenSchema)
async def login(
    data: user_schema.LoginSchema,
    session: AsyncSession = Depends(db.get_dbsession),
):
    user = await user_crud.get_user_by_email(session, data.email)
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="メールアドレスまたはパスワードが正しくありません",
        )
    token = create_access_token(user.user_id)
    return user_schema.TokenSchema(access_token=token)


@router.get("/me", response_model=user_schema.UserSchema)
async def me(current_user: user_model.User = Depends(get_current_user)):
    return user_schema.UserSchema(user_id=current_user.user_id, email=current_user.email)
