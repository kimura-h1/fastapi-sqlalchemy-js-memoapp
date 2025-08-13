# FastAPI + SQLAlchemy + JavaScript メモアプリ

## 📌 概要
FastAPI と SQLAlchemy を使ったシンプルなメモ管理アプリです。  
フロントエンドは HTML + JavaScript で実装し、Live Server で配信します。  
CORS 設定により、API（FastAPI）とフロント（Live Server）を分離して動作させます。

---

## 🛠 技術スタック
- **バックエンド**: FastAPI, SQLAlchemy, SQLite
- **フロントエンド**: HTML, CSS, JavaScript (Vanilla JS)
- **実行環境**: Python 3.11+, Node.js (Live Server)
- **API仕様**: RESTful API

---

## 🚀 起動方法

### 1. バックエンド (FastAPI)
```bash
# 仮想環境の作成・有効化
python -m venv .venv
source .venv/bin/activate  # Windowsは .venv\Scripts\activate

# 必要パッケージのインストール
pip install fastapi uvicorn sqlalchemy pydantic

# サーバー起動
uvicorn main:app --reload
