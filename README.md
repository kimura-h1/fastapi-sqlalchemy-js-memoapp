# FastAPI + SQLAlchemy + メモアプリ

## 📌 概要
FastAPI と SQLAlchemy（SQLite）を使ったシンプルなメモ管理アプリです。  
バックエンド（API）とフロントエンド（React / 旧HTML+JS）を分離して動作させます。  
CORS 設定により、別ポートからのアクセスを許可します。

---

## 🛠 技術スタック
### バックエンド
- FastAPI
- SQLAlchemy（Async）
- SQLite（`memodb.sqlite`）
- Pydantic

- ### フロントエンド
- React（`frontapp-react`）


---

## ✅ 事前準備
- Python 3.11+
- Node.js / npm（Reactフロントを動かす場合）

---

## 🚀 起動方法

### 1) バックエンド（FastAPI）

```bash
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2) フロントエンド（React）
```bash
npm install
npm install react-router-dom
npm start
```



