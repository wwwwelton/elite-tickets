"""Create auditable ticket validation attempts.

Revision ID: 0003_ticket_validations
Revises: 0002_commerce
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0003_ticket_validations"
down_revision: str | None = "0002_commerce"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

ticket_validation_result_enum = postgresql.ENUM(
    "VALID",
    "INVALID",
    "ALREADY_USED",
    "WRONG_EVENT",
    name="ticketvalidationresult_enum",
    create_type=False,
)


def upgrade() -> None:
    ticket_validation_result_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "ticket_validations",
        sa.Column("selected_event_id", sa.Uuid(), nullable=False),
        sa.Column("gate_user_id", sa.Uuid(), nullable=False),
        sa.Column("ticket_id", sa.Uuid(), nullable=True),
        sa.Column("result", ticket_validation_result_enum, nullable=False),
        sa.Column(
            "attempted_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(
            ["gate_user_id"],
            ["users.id"],
            name=op.f("fk_ticket_validations_gate_user_id_users"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["selected_event_id"],
            ["events.id"],
            name=op.f("fk_ticket_validations_selected_event_id_events"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["ticket_id"],
            ["tickets.id"],
            name=op.f("fk_ticket_validations_ticket_id_tickets"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_ticket_validations")),
    )
    op.create_index(
        "ix_ticket_validations_selected_event_attempted_at",
        "ticket_validations",
        ["selected_event_id", "attempted_at"],
    )
    op.create_index(
        "ix_ticket_validations_ticket_attempted_at",
        "ticket_validations",
        ["ticket_id", "attempted_at"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_ticket_validations_ticket_attempted_at",
        table_name="ticket_validations",
    )
    op.drop_index(
        "ix_ticket_validations_selected_event_attempted_at",
        table_name="ticket_validations",
    )
    op.drop_table("ticket_validations")
    ticket_validation_result_enum.drop(op.get_bind(), checkfirst=True)
