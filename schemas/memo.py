from pydantic import BaseModel, Field
from datetime import datetime               

# ==================================================
# スキーマ定義
# ==================================================

# メモの状態を表すスキーマ
class MemoStatusSchema(BaseModel):
    priority: str = Field(..., description="優先度", example="高")
    due_date: datetime | None = Field(None,
                    description="メモの期限日、設定されていない場合はNone",
                    example="2023-10-01T00:00:00")
    is_completed: bool = Field(False, description="メモが完了したかどうかを示すフラグ", example=False)


# 登録・更新で使用するスキーマ
class InsertAndUpdateMemoSchema(BaseModel):
    
    title: str = Field(...,
            description="メモのタイトルを入力してください。少なくとも1文字以上必要です。",
            example="明日のアジェンダ", min_length=1)
    
    description: str = Field(default="",
            description="メモの内容についての追加情報。任意で記入できます。",
            example="会議で話すトピック：プロジェクトの進捗状況")
    
    status: MemoStatusSchema = Field(..., description="メモの状態を表す情報")
   

# メモ情報を表すスキーマ
class MemoSchema(InsertAndUpdateMemoSchema):

    memo_id: int = Field(...,
            description="メモを一意に識別するID番号。データベースで自動的に割り当てられます。",
            example=123)
    created_at: datetime
    
    updated_at: datetime| None = None

# レスポンスで使用する結果用スキーマ
class ResponseSchema(BaseModel):

    message: str = Field(...,
        description="API操作の結果を説明するメッセージ。",
        example="メモの更新に成功しました。")