import base64
import hashlib
import json
import logging
import os
from datetime import UTC, datetime

import jwt
import pytest

os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://test:test@localhost:5432/test")
os.environ.setdefault("JWT_SECRET", "test-jwt-secret-with-at-least-32-bytes")
os.environ.setdefault("QR_SECRET", "different-test-qr-secret-at-least-32-bytes")
os.environ.setdefault("TMDB_API_KEY", "test-key")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:3000")

from elite_tickets.db.base import uuid7
from elite_tickets.shared.logging import REDACTED, RedactingJsonFormatter, redact_text
from elite_tickets.tickets.credentials import (
    InvalidQrCredential,
    issue_qr_credential,
    verify_qr_credential,
)

pytestmark = pytest.mark.unit


def test_credentials_use_independent_high_entropy_nonces() -> None:
    ticket_id, event_id = uuid7(), uuid7()
    first = issue_qr_credential(ticket_id, event_id)
    second = issue_qr_credential(ticket_id, event_id)

    assert first.token != second.token
    assert first.nonce_hash != second.nonce_hash
    assert len(first.nonce_hash) == len(second.nonce_hash) == 32


def test_verification_uses_fixed_algorithm_allowlist() -> None:
    token = jwt.encode(
        {
            "v": 1,
            "ticket_id": str(uuid7()),
            "event_id": str(uuid7()),
            "nonce": "A" * 32,
            "iat": datetime.now(UTC),
        },
        "attacker-controlled-key-material" * 3,
        algorithm="HS512",
        headers={"kid": "v1", "typ": "ETQR"},
    )

    with pytest.raises(InvalidQrCredential):
        verify_qr_credential(token)


def test_signature_tampering_is_rejected_without_sensitive_detail() -> None:
    credential = issue_qr_credential(uuid7(), uuid7())
    replacement = "A" if credential.token[-1] != "A" else "B"

    with pytest.raises(InvalidQrCredential, match="^invalid ticket credential$"):
        verify_qr_credential(f"{credential.token[:-1]}{replacement}")


def test_stored_nonce_hash_matches_sha256_of_signed_nonce() -> None:
    credential = issue_qr_credential(uuid7(), uuid7())
    payload = jwt.decode(credential.token, options={"verify_signature": False})
    encoded_nonce = payload["nonce"]
    padding = "=" * (-len(encoded_nonce) % 4)
    nonce = base64.urlsafe_b64decode(encoded_nonce + padding)

    assert credential.nonce_hash == hashlib.sha256(nonce).digest()
    assert verify_qr_credential(credential.token).nonce_hash == credential.nonce_hash


def test_qr_credentials_are_redacted_from_text_and_json_logs() -> None:
    token = issue_qr_credential(uuid7(), uuid7()).token
    assert token not in redact_text(f"qr_credential={token}")

    record = logging.LogRecord(
        "test",
        logging.INFO,
        __file__,
        1,
        "credential=%s",
        (token,),
        None,
    )
    payload = json.loads(RedactingJsonFormatter().format(record))
    assert token not in payload["message"]
    assert REDACTED in payload["message"]
