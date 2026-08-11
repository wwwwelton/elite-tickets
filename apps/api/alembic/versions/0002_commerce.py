"""Create event, reservation, payment, and ticket commerce schema.

Revision ID: 0002_commerce
Revises: 0001_users
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0002_commerce"
down_revision: str | None = "0001_users"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

event_state_enum = postgresql.ENUM(
    "DRAFT",
    "PUBLISHED",
    "CANCELLED",
    "FINISHED",
    name="eventstate_enum",
    create_type=False,
)
reservation_status_enum = postgresql.ENUM(
    "PENDING",
    "APPROVED",
    "DECLINED",
    "EXPIRED",
    "CANCELLED",
    name="reservationstatus_enum",
    create_type=False,
)
payment_token_enum = postgresql.ENUM(
    "tok_approved",
    "tok_declined",
    name="paymenttoken_enum",
    create_type=False,
)
payment_decision_enum = postgresql.ENUM(
    "APPROVED",
    "DECLINED",
    name="paymentdecision_enum",
    create_type=False,
)
ticket_status_enum = postgresql.ENUM(
    "ACTIVE",
    "CANCELLED",
    name="ticketstatus_enum",
    create_type=False,
)


def upgrade() -> None:
    bind = op.get_bind()
    for enum in (
        event_state_enum,
        reservation_status_enum,
        payment_token_enum,
        payment_decision_enum,
        ticket_status_enum,
    ):
        enum.create(bind, checkfirst=True)

    op.create_table(
        "events",
        sa.Column("organizer_id", sa.Uuid(), nullable=False),
        sa.Column(
            "state",
            event_state_enum,
            server_default="DRAFT",
            nullable=False,
        ),
        sa.Column("venue_name", sa.String(length=180), nullable=False),
        sa.Column("venue_address", sa.String(length=300), nullable=False),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("timezone", sa.String(length=64), nullable=False),
        sa.Column("capacity", sa.Integer(), nullable=False),
        sa.Column(
            "reserved_quantity", sa.Integer(), server_default="0", nullable=False
        ),
        sa.Column("sold_quantity", sa.Integer(), server_default="0", nullable=False),
        sa.Column("price", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column(
            "currency", sa.String(length=3), server_default="BRL", nullable=False
        ),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint(
            "reserved_quantity + sold_quantity <= capacity",
            name=op.f("ck_events_bounded_inventory"),
        ),
        sa.CheckConstraint(
            "currency = 'BRL'",
            name=op.f("ck_events_brl_currency"),
        ),
        sa.CheckConstraint(
            "price >= 0",
            name=op.f("ck_events_non_negative_price"),
        ),
        sa.CheckConstraint(
            "reserved_quantity >= 0",
            name=op.f("ck_events_non_negative_reserved"),
        ),
        sa.CheckConstraint(
            "sold_quantity >= 0",
            name=op.f("ck_events_non_negative_sold"),
        ),
        sa.CheckConstraint(
            "capacity > 0",
            name=op.f("ck_events_positive_capacity"),
        ),
        sa.CheckConstraint(
            "(state = 'DRAFT' AND published_at IS NULL AND cancelled_at IS NULL) OR "
            "(state = 'PUBLISHED' AND published_at IS NOT NULL AND cancelled_at IS NULL) OR "
            "(state = 'CANCELLED' AND published_at IS NOT NULL AND cancelled_at IS NOT NULL) OR "
            "(state = 'FINISHED' AND published_at IS NOT NULL AND cancelled_at IS NULL)",
            name=op.f("ck_events_state_timestamps_coherent"),
        ),
        sa.CheckConstraint(
            "ends_at > starts_at",
            name=op.f("ck_events_valid_time_window"),
        ),
        sa.CheckConstraint(
            "length(btrim(venue_address)) > 0",
            name=op.f("ck_events_venue_address_not_empty"),
        ),
        sa.CheckConstraint(
            "length(btrim(venue_name)) > 0",
            name=op.f("ck_events_venue_name_not_empty"),
        ),
        sa.ForeignKeyConstraint(
            ["organizer_id"],
            ["users.id"],
            name=op.f("fk_events_organizer_id_users"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_events")),
    )
    op.create_index("ix_events_organizer_state", "events", ["organizer_id", "state"])
    op.create_index("ix_events_state_starts_at", "events", ["state", "starts_at"])

    op.create_table(
        "movie_snapshots",
        sa.Column("event_id", sa.Uuid(), nullable=False),
        sa.Column("tmdb_id", sa.Integer(), nullable=False),
        sa.Column(
            "media_type", sa.String(length=16), server_default="movie", nullable=False
        ),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column("overview", sa.Text(), nullable=True),
        sa.Column("poster_path", sa.Text(), nullable=True),
        sa.Column("backdrop_path", sa.Text(), nullable=True),
        sa.Column("release_date", sa.Date(), nullable=True),
        sa.Column("original_language", sa.String(length=16), nullable=True),
        sa.Column(
            "genres",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column(
            "snapshot_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "media_type = 'movie'",
            name=op.f("ck_movie_snapshots_movie_media_type"),
        ),
        sa.CheckConstraint(
            "tmdb_id > 0",
            name=op.f("ck_movie_snapshots_positive_tmdb_id"),
        ),
        sa.CheckConstraint(
            "length(btrim(title)) > 0",
            name=op.f("ck_movie_snapshots_title_not_empty"),
        ),
        sa.ForeignKeyConstraint(
            ["event_id"],
            ["events.id"],
            name=op.f("fk_movie_snapshots_event_id_events"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("event_id", name=op.f("pk_movie_snapshots")),
    )

    op.create_table(
        "reservations",
        sa.Column("event_id", sa.Uuid(), nullable=False),
        sa.Column("customer_id", sa.Uuid(), nullable=False),
        sa.Column(
            "status",
            reservation_status_enum,
            server_default="PENDING",
            nullable=False,
        ),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("total_amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint(
            "currency = 'BRL'",
            name=op.f("ck_reservations_brl_currency"),
        ),
        sa.CheckConstraint(
            "total_amount = quantity * unit_price",
            name=op.f("ck_reservations_calculated_total_amount"),
        ),
        sa.CheckConstraint(
            "expires_at > created_at",
            name=op.f("ck_reservations_expiry_after_creation"),
        ),
        sa.CheckConstraint(
            "unit_price >= 0",
            name=op.f("ck_reservations_non_negative_unit_price"),
        ),
        sa.CheckConstraint(
            "quantity > 0",
            name=op.f("ck_reservations_positive_quantity"),
        ),
        sa.CheckConstraint(
            "(status = 'PENDING' AND completed_at IS NULL) OR "
            "(status IN ('APPROVED', 'DECLINED', 'EXPIRED', 'CANCELLED') "
            "AND completed_at IS NOT NULL)",
            name=op.f("ck_reservations_status_completion_coherent"),
        ),
        sa.ForeignKeyConstraint(
            ["customer_id"],
            ["users.id"],
            name=op.f("fk_reservations_customer_id_users"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["event_id"],
            ["events.id"],
            name=op.f("fk_reservations_event_id_events"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_reservations")),
    )
    op.create_index(
        "ix_reservations_customer_created_at",
        "reservations",
        ["customer_id", "created_at"],
    )
    op.create_index(
        "ix_reservations_event_status",
        "reservations",
        ["event_id", "status"],
    )
    op.create_index(
        "ix_reservations_status_expires_at",
        "reservations",
        ["status", "expires_at"],
    )

    op.create_table(
        "simulated_payments",
        sa.Column("reservation_id", sa.Uuid(), nullable=False),
        sa.Column("idempotency_key", sa.String(length=128), nullable=False),
        sa.Column("test_token", payment_token_enum, nullable=False),
        sa.Column("decision", payment_decision_enum, nullable=False),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.CheckConstraint(
            "length(btrim(idempotency_key)) BETWEEN 1 AND 128",
            name=op.f("ck_simulated_payments_idempotency_key_length"),
        ),
        sa.CheckConstraint(
            "(test_token = 'tok_approved' AND decision = 'APPROVED') OR "
            "(test_token = 'tok_declined' AND decision = 'DECLINED')",
            name=op.f("ck_simulated_payments_token_decision_coherent"),
        ),
        sa.ForeignKeyConstraint(
            ["reservation_id"],
            ["reservations.id"],
            name=op.f("fk_simulated_payments_reservation_id_reservations"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_simulated_payments")),
        sa.UniqueConstraint(
            "reservation_id",
            name="uq_simulated_payments_reservation_id",
        ),
    )
    op.create_index(
        "ix_simulated_payments_idempotency_key",
        "simulated_payments",
        ["idempotency_key"],
    )

    op.create_table(
        "tickets",
        sa.Column("reservation_id", sa.Uuid(), nullable=False),
        sa.Column("event_id", sa.Uuid(), nullable=False),
        sa.Column("owner_id", sa.Uuid(), nullable=False),
        sa.Column("ordinal", sa.Integer(), nullable=False),
        sa.Column("qr_credential", sa.Text(), nullable=False),
        sa.Column("qr_nonce_hash", sa.LargeBinary(length=32), nullable=False),
        sa.Column("qr_key_id", sa.String(length=32), nullable=False),
        sa.Column(
            "status",
            ticket_status_enum,
            server_default="ACTIVE",
            nullable=False,
        ),
        sa.Column("issued_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("used_by_id", sa.Uuid(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.CheckConstraint(
            "ordinal > 0",
            name=op.f("ck_tickets_positive_ordinal"),
        ),
        sa.CheckConstraint(
            "length(qr_credential) > 0",
            name=op.f("ck_tickets_qr_credential_not_empty"),
        ),
        sa.CheckConstraint(
            "length(btrim(qr_key_id)) BETWEEN 1 AND 32",
            name=op.f("ck_tickets_qr_key_id_length"),
        ),
        sa.CheckConstraint(
            "octet_length(qr_nonce_hash) = 32",
            name=op.f("ck_tickets_sha256_nonce_hash"),
        ),
        sa.CheckConstraint(
            "(used_at IS NULL AND used_by_id IS NULL) OR "
            "(used_at IS NOT NULL AND used_by_id IS NOT NULL)",
            name=op.f("ck_tickets_usage_fields_coherent"),
        ),
        sa.ForeignKeyConstraint(
            ["event_id"],
            ["events.id"],
            name=op.f("fk_tickets_event_id_events"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["owner_id"],
            ["users.id"],
            name=op.f("fk_tickets_owner_id_users"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["reservation_id"],
            ["reservations.id"],
            name=op.f("fk_tickets_reservation_id_reservations"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["used_by_id"],
            ["users.id"],
            name=op.f("fk_tickets_used_by_id_users"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_tickets")),
        sa.UniqueConstraint(
            "qr_credential",
            name="uq_tickets_qr_credential",
        ),
        sa.UniqueConstraint(
            "qr_nonce_hash",
            name="uq_tickets_qr_nonce_hash",
        ),
        sa.UniqueConstraint(
            "reservation_id",
            "ordinal",
            name="uq_tickets_reservation_id_ordinal",
        ),
    )
    op.create_index(
        "ix_tickets_event_status_used_at",
        "tickets",
        ["event_id", "status", "used_at"],
    )
    op.create_index(
        "ix_tickets_owner_issued_at",
        "tickets",
        ["owner_id", "issued_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_tickets_owner_issued_at", table_name="tickets")
    op.drop_index("ix_tickets_event_status_used_at", table_name="tickets")
    op.drop_table("tickets")
    op.drop_index(
        "ix_simulated_payments_idempotency_key",
        table_name="simulated_payments",
    )
    op.drop_table("simulated_payments")
    op.drop_index("ix_reservations_status_expires_at", table_name="reservations")
    op.drop_index("ix_reservations_event_status", table_name="reservations")
    op.drop_index("ix_reservations_customer_created_at", table_name="reservations")
    op.drop_table("reservations")
    op.drop_table("movie_snapshots")
    op.drop_index("ix_events_state_starts_at", table_name="events")
    op.drop_index("ix_events_organizer_state", table_name="events")
    op.drop_table("events")

    bind = op.get_bind()
    for enum in (
        ticket_status_enum,
        payment_decision_enum,
        payment_token_enum,
        reservation_status_enum,
        event_state_enum,
    ):
        enum.drop(bind, checkfirst=True)
