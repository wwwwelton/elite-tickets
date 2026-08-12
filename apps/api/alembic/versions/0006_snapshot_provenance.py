"""Complete Ticketmaster snapshot provenance.

Revision ID: 0006_snapshot_provenance
Revises: 0005_ticketmaster_snapshot
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0006_snapshot_provenance"
down_revision: str | None = "0005_ticketmaster_snapshot"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("movie_snapshots", sa.Column("external_url", sa.Text(), nullable=True))
    op.execute(
        "UPDATE movie_snapshots SET external_id = COALESCE(external_id, CAST(tmdb_id AS VARCHAR))"
    )
    op.alter_column("movie_snapshots", "external_id", nullable=False)


def downgrade() -> None:
    op.alter_column("movie_snapshots", "external_id", nullable=True)
    op.drop_column("movie_snapshots", "external_url")
