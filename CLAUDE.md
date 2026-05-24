# CLAUDE.md

このファイルは Claude Code が自動的に読み込むプロジェクトルールです。

---

## 言語

- コード内のコメント・変数名・関数名は **英語**
- Claude への指示・返答、コミットメッセージ、PR・ドキュメントは **日本語**

---

## コミットルール

### フォーマット

```
<type>: <概要（日本語・50文字以内）>

<詳細（任意）>
```

### type 一覧

| type | 用途 |
|------|------|
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `docs` | ドキュメントのみの変更 |
| `chore` | ビルド・設定・依存関係の変更 |
| `refactor` | 動作を変えないコード整理 |
| `test` | テスト追加・修正 |

### 禁止事項

- `Co-Authored-By:` などの AI 帰属表記を含めない
- コミットメッセージに「〇〇を追加しました」のような丁寧語を使わない（体言止め・動詞原形）

---

## ブランチ戦略

```
main（本番）
├── feat/<機能名>       # 新機能
├── fix/<バグ名>        # バグ修正
├── docs/<ドキュメント名> # ドキュメント
└── chore/<作業名>      # 環境・設定
```

- `main` への直接プッシュ禁止
- 作業完了後はブランチを削除する

---

## プルリクエストルール

- `.github/pull_request_template.md` のテンプレートを使う
- タイトルはコミットメッセージと同じ形式（`feat: 〇〇`）
- `Generated with Claude Code` などの AI 関連の記述を含めない
- マージ後はブランチを削除する

---

## コードスタイル

### 全般

- コメントは「なぜ」が非自明な場合のみ書く（何をしているかは書かない）
- 使われていないコードは削除する（コメントアウトで残さない）
- 将来の拡張を見越した抽象化はしない（今必要なものだけ実装）

### Python（FastAPI）

- 型アノテーションを必ず付ける
- Pydantic モデルで入力バリデーション
- DB アクセスは必ず async/await
- ルーターは機能単位でファイルを分ける（`routers/memo.py`, `routers/invoice.py`）

### JavaScript / React

- コンポーネントは機能単位でディレクトリを分ける
- API 呼び出しは `authFetch` ユーティリティ経由（直接 `fetch` しない）
- 環境変数は `process.env.REACT_APP_*`

---

## セキュリティルール

- シークレット（パスワード・APIキー・トークン）はコードに書かない
- `.env` に書いて `.gitignore` に追加する
- `.env.example` にキー名だけ記載してコミットする
- 本番環境のシークレットは AWS Secrets Manager で管理

---

## Docker ルール

- `docker-compose.yml` に認証情報を直接書かない（`env_file: .env` を使う）
- DB サービスには必ずヘルスチェックを設定する
- バックエンドは `condition: service_healthy` で DB の起動を待つ

```yaml
db:
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
    interval: 5s
    timeout: 5s
    retries: 10
backend:
  depends_on:
    db:
      condition: service_healthy
```

---

## ディレクトリ構成（FastAPI + React）

```
/
├── CLAUDE.md
├── .env                    # gitignore（ローカルのみ）
├── .env.example            # コミット対象（値なし）
├── docker-compose.yml
├── Dockerfile
├── main.py
├── auth.py
├── models/                 # SQLAlchemy モデル
├── schemas/                # Pydantic スキーマ
├── cruds/                  # DB 操作
├── routers/                # FastAPI ルーター
├── docs/                   # ドキュメント
├── frontapp-react/
│   └── src/
│       ├── components/     # 共通コンポーネント
│       ├── utils/          # API・認証ユーティリティ
│       ├── invoices/       # 請求書関連ページ
│       └── clients/        # 取引先関連ページ
└── .github/
    ├── workflows/          # CI/CD
    └── pull_request_template.md
```

---

## ドキュメント管理

`docs/` ディレクトリに以下を置く:

| ファイル | 内容 |
|---------|------|
| `requirements.md` | 要件定義 |
| `infrastructure.md` | インフラ構成図・AWS リソース一覧 |
| `aws-setup-guide.md` | AWS 構築手順書 |

---

## Claude への作業依頼時の注意

- AI 関連の帰属（Co-Authored-By, Generated with Claude Code 等）は一切含めない
- コミット・PR・コードコメントに Claude の痕跡を残さない
