"""Create hashed public ticket shares.

Revision ID: 0004_ticket_shares
Revises: 0003_ticket_validations
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0004_ticket_shares"
down_revision: str | None = "0003_ticket_validations"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "ticket_shares",
        sa.Column("ticket_id", sa.Uuid(), nullable=False),
        sa.Column("token_hash", sa.LargeBinary(length=32), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.CheckConstraint(
            "octet_length(token_hash) = 32",
            name=op.f("ck_ticket_shares_sha256_token_hash"),
        ),
        sa.ForeignKeyConstraint(
            ["ticket_id"],
            ["tickets.id"],
            name=op.f("fk_ticket_shares_ticket_id_tickets"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_ticket_shares")),
        sa.UniqueConstraint("ticket_id", name="uq_ticket_shares_ticket_id"),
        sa.UniqueConstraint("token_hash", name="uq_ticket_shares_token_hash"),
    )


def downgrade() -> None:
    op.drop_table("ticket_shares")
