#!/bin/bash
# 開発ルールを対象リポジトリに適用するスクリプト
#
# 使い方:
#   bash /path/to/this/repo/setup-dev-rules.sh /path/to/target-repo
#
# 例:
#   bash ~/projects/fastapi-sqlalchemy-js-memoapp/setup-dev-rules.sh ~/projects/my-new-app

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TEMPLATES_DIR="$SCRIPT_DIR/templates"
TARGET_DIR="${1:-$(pwd)}"

echo "適用先: $TARGET_DIR"

# .github ディレクトリを作成
mkdir -p "$TARGET_DIR/.github"

# CLAUDE.md をコピー（すでにある場合はスキップ）
if [ -f "$TARGET_DIR/CLAUDE.md" ]; then
  echo "[スキップ] CLAUDE.md はすでに存在します"
else
  cp "$TEMPLATES_DIR/CLAUDE.md" "$TARGET_DIR/CLAUDE.md"
  echo "[作成] CLAUDE.md"
fi

# PR テンプレートをコピー（すでにある場合はスキップ）
if [ -f "$TARGET_DIR/.github/pull_request_template.md" ]; then
  echo "[スキップ] .github/pull_request_template.md はすでに存在します"
else
  cp "$TEMPLATES_DIR/pull_request_template.md" "$TARGET_DIR/.github/pull_request_template.md"
  echo "[作成] .github/pull_request_template.md"
fi

# .gitignore に .env を追加（なければ）
GITIGNORE="$TARGET_DIR/.gitignore"
if [ ! -f "$GITIGNORE" ]; then
  touch "$GITIGNORE"
fi
if ! grep -q "^\.env$" "$GITIGNORE"; then
  echo ".env" >> "$GITIGNORE"
  echo "[更新] .gitignore に .env を追加"
fi

echo ""
echo "完了しました。"
echo "次のステップ: CLAUDE.md の「プロジェクト固有のルール」セクションを編集してください。"
