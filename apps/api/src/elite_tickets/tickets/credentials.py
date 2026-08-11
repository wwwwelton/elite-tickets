import base64
import hashlib
import re
import secrets
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

import jwt
from jwt import InvalidTokenError

from elite_tickets.db.base import utc_now
from elite_tickets.shared.config import get_settings

QR_ALGORITHM = "HS256"
QR_KEY_ID = "v1"
QR_VERSION = 1
NONCE_BYTES = 24
_nonce_pattern = re.compile(r"^[A-Za-z0-9_-]+$")


class InvalidQrCredential(ValueError):
    def __init__(self) -> None:
        super().__init__("invalid ticket credential")


@dataclass(frozen=True, slots=True)
class IssuedQrCredential:
    token: str
    nonce_hash: bytes
    key_id: str


@dataclass(frozen=True, slots=True)
class VerifiedQrCredential:
    ticket_id: uuid.UUID
    event_id: uuid.UUID
    nonce_hash: bytes
    issued_at: datetime
    key_id: str


def _qr_secret() -> str:
    return get_settings().qr_secret.get_secret_value()


def _nonce_bytes(encoded_nonce: str) -> bytes:
    if not _nonce_pattern.fullmatch(encoded_nonce):
        raise ValueError
    padding = "=" * (-len(encoded_nonce) % 4)
    decoded = base64.urlsafe_b64decode(encoded_nonce + padding)
    if len(decoded) < 16:
        raise ValueError
    return decoded


def issue_qr_credential(
    ticket_id: uuid.UUID,
    event_id: uuid.UUID,
    *,
    issued_at: datetime | None = None,
) -> IssuedQrCredential:
    now = issued_at or utc_now()
    nonce = secrets.token_urlsafe(NONCE_BYTES)
    token = jwt.encode(
        {
            "v": QR_VERSION,
            "ticket_id": str(ticket_id),
            "event_id": str(event_id),
            "nonce": nonce,
            "iat": now,
        },
        _qr_secret(),
        algorithm=QR_ALGORITHM,
        headers={"kid": QR_KEY_ID, "typ": "ETQR"},
    )
    return IssuedQrCredential(
        token=token,
        nonce_hash=hashlib.sha256(_nonce_bytes(nonce)).digest(),
        key_id=QR_KEY_ID,
    )


def verify_qr_credential(token: str) -> VerifiedQrCredential:
    try:
        header = jwt.get_unverified_header(token)
        if (
            header.get("alg") != QR_ALGORITHM
            or header.get("kid") != QR_KEY_ID
            or header.get("typ") != "ETQR"
        ):
            raise InvalidQrCredential
        payload: dict[str, Any] = jwt.decode(
            token,
            _qr_secret(),
            algorithms=[QR_ALGORITHM],
            options={"require": ["v", "ticket_id", "event_id", "nonce", "iat"]},
        )
        if payload["v"] != QR_VERSION or not isinstance(payload["nonce"], str):
            raise InvalidQrCredential
        nonce = _nonce_bytes(payload["nonce"])
        issued_at = datetime.fromtimestamp(payload["iat"], tz=UTC)
        return VerifiedQrCredential(
            ticket_id=uuid.UUID(payload["ticket_id"]),
            event_id=uuid.UUID(payload["event_id"]),
            nonce_hash=hashlib.sha256(nonce).digest(),
            issued_at=issued_at,
            key_id=QR_KEY_ID,
        )
    except (InvalidTokenError, KeyError, TypeError, ValueError):
        raise InvalidQrCredential from None
