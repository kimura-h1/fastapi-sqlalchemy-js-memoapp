# FastAPI + React メモアプリ

FastAPI（Python）をバックエンド、React をフロントエンドに使ったメモ管理 CRUD アプリです。

---

## 技術スタック

| 役割 | 技術 |
|---|---|
| バックエンド | FastAPI, SQLAlchemy（Async）, Pydantic |
| フロントエンド | React 19, React Router v7 |
| DB | PostgreSQL |
| マイグレーション | Alembic |
| コンテナ | Docker / Docker Compose |

---

## 起動方法

### Docker Compose を使う場合（推奨）

DB・バックエンド・フロントエンドを一括で起動できます。

```bash
docker compose up --build
```

| サービス | URL |
|---|---|
| フロントエンド | http://localhost:3000 |
| バックエンド API | http://localhost:8000 |
| API ドキュメント | http://localhost:8000/docs |

停止するには:

```bash
docker compose down
```

---

### ローカルで起動する場合

#### 事前準備

- Python 3.11 以上
- Node.js 18 以上
- PostgreSQL が起動していること

#### 1. 環境変数を設定する

プロジェクトルートに `.env` ファイルを作成します。

```bash
cp .env.example .env
```

`.env` の内容（接続先に合わせて変更してください）:

```
DATABASE_URL=postgresql+asyncpg://fastapi_user:your_password@localhost:5432/fastapi_db
```

#### 2. バックエンドを起動する

```bash
# 仮想環境を作成・有効化
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 依存パッケージをインストール
pip install -r requirements.txt

# DB マイグレーションを実行
alembic upgrade head

# サーバー起動
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

起動後 → http://localhost:8000/docs で API ドキュメントを確認できます。

#### 3. フロントエンドを起動する

別のターミナルで実行します。

```bash
cd frontapp-react

# 依存パッケージをインストール（初回のみ）
npm install

# 開発サーバー起動
npm start
```

起動後 → http://localhost:3000 でアプリを確認できます。

---

## DB マイグレーション

[Alembic](https://alembic.sqlalchemy.org/) でテーブルを管理しています。

```bash
# 現在の状態を確認
alembic current

# 最新まで適用
alembic upgrade head

# 1つ前に戻す
alembic downgrade -1

# マイグレーションファイルを新規作成
alembic revision --autogenerate -m "変更内容の説明"
```

---

## API エンドポイント

ベース URL: `http://localhost:8000`

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/memos/` | メモ一覧取得 |
| POST | `/memos/` | メモ新規作成 |
| GET | `/memos/{id}` | メモ1件取得 |
| PUT | `/memos/{id}` | メモ更新 |
| DELETE | `/memos/{id}` | メモ削除 |
| PATCH | `/memos/{id}` | 完了状態の切り替え |

詳細は `/docs`（Swagger UI）を参照してください。

---

## ディレクトリ構成

```
.
├── main.py               # FastAPI アプリのエントリーポイント
├── db.py                 # DB 接続設定
├── models/
│   └── memo.py           # SQLAlchemy モデル
├── schemas/
│   └── memo.py           # Pydantic スキーマ
├── routers/
│   └── memo.py           # API エンドポイント定義
├── cruds/
│   └── memo.py           # DB アクセス処理
├── alembic/              # マイグレーションファイル
├── frontapp-react/
│   └── src/
│       ├── App.jsx
│       ├── ListMemos.jsx
│       ├── CreateMemo.jsx
│       ├── EditMemo.jsx
│       ├── components/
│       │   ├── MemoForm.jsx   # 作成・編集で共通のフォーム
│       │   └── ErrorBox.jsx   # エラー表示
│       └── utils/
│           ├── api.js         # API の BASE_URL 定義
│           ├── validation.js  # フロント入力バリデーション
│           └── apiError.js    # API エラーのフォーマット
├── requirements.txt
├── docker-compose.yml
└── .env                  # 環境変数（Git 管理外）
```

---

## 環境変数

| 変数名 | 説明 | 例 |
|---|---|---|
| `DATABASE_URL` | DB 接続文字列 | `postgresql+asyncpg://user:pass@localhost:5432/dbname` |
| `REACT_APP_API_URL` | フロントから叩く API の URL（省略時は `http://localhost:8000`） | `http://localhost:8000` |
