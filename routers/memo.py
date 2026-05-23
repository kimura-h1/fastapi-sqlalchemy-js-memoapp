from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from schemas.memo import InsertAndUpdateMemoSchema, MemoSchema, ResponseSchema, MemoStatusSchema, PatchMemoSchema, to_memo_schema
import cruds.memo as memo_crud
import db
from auth import get_current_user
import models.user as user_model

router = APIRouter(tags=["Memos"], prefix="/memos")


@router.post("/", response_model=ResponseSchema, status_code=201)
async def create_memo(
    memo: InsertAndUpdateMemoSchema,
    session: AsyncSession = Depends(db.get_dbsession),
    current_user: user_model.User = Depends(get_current_user),
):
    try:
        await memo_crud.insert_memo(session, memo, current_user.user_id)
        return ResponseSchema(message="メモが正常に登録されました")
    except Exception:
        raise HTTPException(status_code=400, detail="メモの登録に失敗しました")


@router.get("/", response_model=list[MemoSchema])
async def get_memos_list(
    skip: int = 0,
    limit: int = 50,
    session: AsyncSession = Depends(db.get_dbsession),
    current_user: user_model.User = Depends(get_current_user),
):
    memos = await memo_crud.get_memos(session, current_user.user_id, skip=skip, limit=limit)
    return [to_memo_schema(memo) for memo in memos]


@router.get("/{memo_id}", response_model=MemoSchema)
async def get_memo_detail(
    memo_id: int,
    session: AsyncSession = Depends(db.get_dbsession),
    current_user: user_model.User = Depends(get_current_user),
):
    memo = await memo_crud.get_memo_by_id(session, memo_id, current_user.user_id)
    if not memo:
        raise HTTPException(status_code=404, detail="メモが見つかりません")
    return to_memo_schema(memo)


@router.put("/{memo_id}", response_model=ResponseSchema)
async def modify_memo(
    memo_id: int,
    memo: InsertAndUpdateMemoSchema,
    session: AsyncSession = Depends(db.get_dbsession),
    current_user: user_model.User = Depends(get_current_user),
):
    updated = await memo_crud.update_memo(session, memo_id, memo, current_user.user_id)
    if not updated:
        raise HTTPException(status_code=404, detail="更新対象が見つかりません")
    return ResponseSchema(message="メモが正常に更新されました")


@router.delete("/{memo_id}", response_model=ResponseSchema)
async def remove_memo(
    memo_id: int,
    session: AsyncSession = Depends(db.get_dbsession),
    current_user: user_model.User = Depends(get_current_user),
):
    result = await memo_crud.delete_memo(session, memo_id, current_user.user_id)
    if not result:
        raise HTTPException(status_code=404, detail="削除対象が見つかりません")
    return ResponseSchema(message="メモが正常に削除されました")


@router.patch("/{memo_id}", response_model=ResponseSchema)
async def toggle_memo_completed(
    memo_id: int,
    body: PatchMemoSchema,
    session: AsyncSession = Depends(db.get_dbsession),
    current_user: user_model.User = Depends(get_current_user),
):
    updated = await memo_crud.patch_memo(session, memo_id, {"is_completed": body.is_completed}, current_user.user_id)
    if not updated:
        raise HTTPException(status_code=404, detail="対象メモが見つかりません")
    return ResponseSchema(message="完了状態を更新しました")
