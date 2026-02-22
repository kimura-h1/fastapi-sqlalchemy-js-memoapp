"""カラム追加　カテゴリ

Revision ID: 6748bfa15556
Revises: 377ee911bd9d
Create Date: 2026-02-22 01:43:35.713724

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '6748bfa15556'
down_revision: Union[str, Sequence[str], None] = '377ee911bd9d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column("memos", sa.Column("category", sa.String(length=50), nullable=True), schema="app")

def downgrade():
    op.drop_column("memos", "category", schema="app")