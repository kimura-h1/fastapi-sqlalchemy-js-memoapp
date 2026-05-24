# 開発ガイド

**作成日**: 2026-05-24

---

## 1. 開発環境のセットアップ

### 必要なツール

| ツール | 用途 | インストール確認 |
|-------|------|----------------|
| Docker Desktop | ローカル環境の起動 | `docker --version` |
| Node.js 18+ | フロントエンドのビルド | `node --version` |
| Python 3.11+ | バックエンド（任意、Docker 内で動く） | `python --version` |
| Git | バージョン管理 | `git --version` |
| AWS CLI | デプロイ作業 | `aws --version` |

### 初回セットアップ手順

```bash
# 1. リポジトリをクローン
git clone https://github.com/kimura-h1/<repo-name>.git
cd <repo-name>

# 2. 環境変数ファイルを作成
cp .env.example .env
# .env を編集して各値を設定

# 3. Docker でアプリを起動
docker compose up --build

# 4. フロントエンドの依存関係をインストール（開発時）
cd frontapp-react
npm install
npm start
```

---

## 2. ブランチ戦略

### 命名規則

```
feat/<機能名>        # 例: feat/invoice-management
fix/<バグ内容>       # 例: fix/login-redirect
docs/<内容>         # 例: docs/api-specification
chore/<作業内容>    # 例: chore/update-dependencies
```

### フロー

```
1. main から作業ブランチを切る
   git checkout -b feat/<機能名>

2. こまめにコミットする

3. PR を作成する
   → .github/pull_request_template.md に従って記載

4. レビュー・マージ後にブランチを削除する
   git branch -d feat/<機能名>
   git push origin --delete feat/<機能名>
```

---

## 3. コミットメッセージ規則

### フォーマット

```
<type>: <概要>

<詳細（任意）>
```

### 具体例

```
feat: 請求書管理バックエンドを追加

- Client CRUD エンドポイント
- Invoice CRUD + 入金ステータス変更 API
- Secrets Manager からシークレットを取得する設定
```

```
fix: DB 起動前にバックエンドが接続エラーになる問題を修正
```

```
docs: AWS 構築手順書を追加
```

---

## 4. セキュリティルール

### シークレットの管理

**絶対に Git にコミットしてはいけないもの:**
- DB パスワード
- JWT の SECRET_KEY
- AWS のアクセスキー
- API キー

**正しい管理方法:**

```bash
# ローカル開発
.env ファイルに記載 → .gitignore で除外

# 本番環境
AWS Secrets Manager に登録 → ECS タスク定義で参照
```

**リポジトリにコミットするもの:**

```bash
.env.example  # キー名のみ記載、値は空
```

---

## 5. Docker 操作

```bash
# 起動（初回・変更後）
docker compose up --build

# 起動（通常）
docker compose up -d

# 停止
docker compose down

# バックエンドのログを確認
docker compose logs -f backend

# バックエンドだけ再ビルド（バックエンドコードを変更した後）
docker compose build backend && docker compose up -d
```

---

## 6. データベース（Alembic マイグレーション）

```bash
# コンテナ内でマイグレーション
docker compose exec backend alembic revision --autogenerate -m "変更内容"
docker compose exec backend alembic upgrade head

# マイグレーション履歴を確認
docker compose exec backend alembic history
```

---

## 7. フロントエンドの開発

```bash
cd frontapp-react

# 開発サーバーを起動（ホットリロード有効）
npm start

# 本番ビルド（S3 アップロード前に実行）
REACT_APP_API_URL=https://your-alb-domain.com npm run build

# ビルドを S3 にアップロード
aws s3 sync build/ s3://your-bucket-name/ --delete
```

---

## 8. デプロイ手順

### バックエンド（ECS Fargate）

```bash
# コードを main にマージ → GitHub Actions が自動実行
git push origin main

# 手動でデプロイしたい場合
./deploy.sh
```

GitHub Actions の処理内容:
1. AWS 認証
2. ECR ログイン
3. Docker イメージビルド
4. ECR へプッシュ
5. ECS サービス強制更新

### フロントエンド（S3 + CloudFront）

```bash
cd frontapp-react
REACT_APP_API_URL=https://your-alb-domain.com npm run build
aws s3 sync build/ s3://your-bucket-name/ --delete

# キャッシュをクリア（URL変更が即反映される）
aws cloudfront create-invalidation \
  --distribution-id XXXXXXXXXXXXXX \
  --paths "/*"
```

---

## 9. よく使う AWS CLI コマンド

```bash
# ECS タスクのログを確認
aws logs tail /ecs/memo-fastapi --follow

# ECS サービスの状態確認
aws ecs describe-services \
  --cluster memo-fastapi-cluster \
  --services memo-fastapi-service \
  --region ap-northeast-1

# RDS の状態確認
aws rds describe-db-instances \
  --db-instance-identifier memo-app-db \
  --query "DBInstances[0].{Status:DBInstanceStatus}" \
  --region ap-northeast-1
```

---

## 10. トラブルシューティング

### よくある問題

| 症状 | 原因 | 対処 |
|-----|------|------|
| バックエンドが起動しない | DB の起動待ち | ログを確認 → ヘルスチェック設定を確認 |
| ログインできない | SECRET_KEY の不一致 | `.env` の `SECRET_KEY` を確認 |
| API にアクセスできない | CORS エラー | `main.py` の `allow_origins` にフロントの URL を追加 |
| ECS タスクが落ちる | Secrets Manager の ARN 間違い | タスク定義の `valueFrom` を確認 |
| フロントのルーティングが壊れる | S3/CloudFront の設定 | エラードキュメントを `index.html` に設定 |

### ログの確認方法

```bash
# ローカル
docker compose logs -f backend
docker compose logs -f db

# 本番（ECS）
aws logs tail /ecs/memo-fastapi --follow
```
