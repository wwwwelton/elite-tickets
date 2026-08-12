"""Keep legacy snapshots compatible with Ticketmaster provenance."""

from alembic import op

revision = "0007_snapshot_compat"
down_revision = "0006_snapshot_provenance"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("movie_snapshots", "external_id", nullable=True)


def downgrade() -> None:
    # Rows created before provenance cannot safely be made non-null again.
    pass
