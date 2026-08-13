"""Enable accent-insensitive public event search.

Revision ID: 0008_unaccent_search
Revises: 0007_snapshot_compat
"""

from collections.abc import Sequence

from alembic import op

revision: str = "0008_unaccent_search"
down_revision: str | None = "0007_snapshot_compat"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Public search compares Brazilian titles and venue names, which readers
    # rarely type with diacritics ("sao paulo"). ILIKE does not fold accents, so
    # the catalog needs unaccent() on both sides of the comparison.
    #
    # Creating an extension requires a superuser or a role with CREATE on the
    # database. The Compose Postgres runs as the owning superuser; a managed
    # instance may need the extension provisioned out of band instead.
    op.execute("CREATE EXTENSION IF NOT EXISTS unaccent")


def downgrade() -> None:
    # The extension is dropped only if nothing else came to depend on it.
    op.execute("DROP EXTENSION IF EXISTS unaccent RESTRICT")
