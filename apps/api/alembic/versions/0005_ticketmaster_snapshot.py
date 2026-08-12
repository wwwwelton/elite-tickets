"""Add Ticketmaster snapshot fields to movie snapshots.

Revision ID: 0005_ticketmaster_snapshot
Revises: 0004_ticket_shares
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0005_ticketmaster_snapshot"
down_revision: str | None = "0004_ticket_shares"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "movie_snapshots",
        sa.Column(
            "external_source",
            sa.String(length=32),
            server_default="ticketmaster",
            nullable=False,
        ),
    )
    op.add_column("movie_snapshots", sa.Column("external_id", sa.String(length=255), nullable=True))
    op.add_column("movie_snapshots", sa.Column("image_url", sa.Text(), nullable=True))
    op.add_column("movie_snapshots", sa.Column("event_date", sa.Date(), nullable=True))
    op.add_column("movie_snapshots", sa.Column("category", sa.String(length=120), nullable=True))
    op.add_column("movie_snapshots", sa.Column("venue_name", sa.String(length=200), nullable=True))
    op.add_column("movie_snapshots", sa.Column("city", sa.String(length=120), nullable=True))
    op.add_column("movie_snapshots", sa.Column("country_code", sa.String(length=2), nullable=True))


def downgrade() -> None:
    op.drop_column("movie_snapshots", "country_code")
    op.drop_column("movie_snapshots", "city")
    op.drop_column("movie_snapshots", "venue_name")
    op.drop_column("movie_snapshots", "category")
    op.drop_column("movie_snapshots", "event_date")
    op.drop_column("movie_snapshots", "image_url")
    op.drop_column("movie_snapshots", "external_id")
    op.drop_column("movie_snapshots", "external_source")
