"""memos: constrain priority to low/mid/high(ja)

Revision ID: 9adf3a77a9c4
Revises: e0a898a00e98
Create Date: 2026-02-23 01:39:26.474789

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9adf3a77a9c4'
down_revision: Union[str, Sequence[str], None] = 'e0a898a00e98'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.execute("""
        ALTER TABLE app.memos
        ADD CONSTRAINT ck_memos_priority
        CHECK (priority IN ('低','中','高'))
    """)

def downgrade():
    op.execute("""
        ALTER TABLE app.memos
        DROP CONSTRAINT ck_memos_priority
    """)