from enum import StrEnum

from sqlalchemy import Boolean, CheckConstraint, Index, String, Text, true
from sqlalchemy.orm import Mapped, mapped_column

from elite_tickets.db.base import (
    Base,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
    enum_type,
)


class Role(StrEnum):
    ORGANIZER = "ORGANIZER"
    CUSTOMER = "CUSTOMER"
    GATE = "GATE"


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("email = lower(btrim(email))", name="email_normalized"),
        CheckConstraint("length(email) BETWEEN 3 AND 320", name="email_length"),
        CheckConstraint("length(password_hash) > 0", name="password_hash_not_empty"),
        CheckConstraint(
            "length(btrim(display_name)) BETWEEN 1 AND 120",
            name="display_name_length",
        ),
        Index("ix_users_role_is_active", "role", "is_active"),
    )

    email: Mapped[str] = mapped_column(String(320), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    display_name: Mapped[str] = mapped_column(String(120), nullable=False)
    role: Mapped[Role] = mapped_column(enum_type(Role), nullable=False)
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default=true(),
    )
