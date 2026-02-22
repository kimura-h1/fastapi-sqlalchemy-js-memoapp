"""add is_deleted to memos

Revision ID: e0a898a00e98
Revises: 4a19d1a2f037
Create Date: 2026-02-23 00:57:21.402348

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e0a898a00e98'
down_revision: Union[str, Sequence[str], None] = '4a19d1a2f037'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column(
        "memos",
        sa.column("is_deleted",sa.Boolean(),nullable=False,server_default=sa.text("false")),
        schema="app",
    )


def downgrade():
     op.drop_column("memos", "is_deleted", schema="app")
    
