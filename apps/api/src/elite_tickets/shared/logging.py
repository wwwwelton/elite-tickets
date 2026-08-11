import json
import logging
import re
import time
import uuid
from contextvars import ContextVar
from datetime import UTC, datetime
from typing import Any
from urllib.parse import parse_qsl, urlencode

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

CORRELATION_HEADER = "X-Request-ID"
REDACTED = "<redacted>"

_correlation_id: ContextVar[str] = ContextVar("correlation_id", default="-")
_safe_request_id = re.compile(r"^[A-Za-z0-9._-]{1,64}$")
_shared_ticket_path = re.compile(r"(/shared/tickets/)[^/?]+", re.IGNORECASE)
_bearer_token = re.compile(r"(?i)(bearer\s+)[A-Za-z0-9._~+/=-]+")
_compact_jws = re.compile(
    r"(?<![A-Za-z0-9_-])[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\."
    r"[A-Za-z0-9_-]{8,}(?![A-Za-z0-9_-])"
)
_named_secret = re.compile(
    r"(?i)\b(password|access_token|share_token|shareToken|qr_credential|"
    r"jwt_secret|qr_secret)=([^\s&,]+)"
)
_sensitive_query_names = {
    "access_token",
    "authorization",
    "jwt_secret",
    "password",
    "qr_credential",
    "qr_secret",
    "share_token",
    "sharetoken",
    "tmdb_api_key",
    "token",
}


def redact_path(path: str) -> str:
    return _shared_ticket_path.sub(rf"\1{REDACTED}", path)


def redact_query(query: str) -> str:
    values = parse_qsl(query, keep_blank_values=True)
    redacted = [
        (key, REDACTED if key.lower() in _sensitive_query_names else value)
        for key, value in values
    ]
    return urlencode(redacted)


def redact_text(value: str) -> str:
    value = redact_path(value)
    value = _bearer_token.sub(rf"\1{REDACTED}", value)
    value = _compact_jws.sub(REDACTED, value)
    return _named_secret.sub(rf"\1={REDACTED}", value)


class RedactingJsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": datetime.now(UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": redact_text(record.getMessage()),
            "correlation_id": _correlation_id.get(),
        }
        for field in (
            "method",
            "path",
            "query",
            "status_code",
            "duration_ms",
            "exception_type",
        ):
            if hasattr(record, field):
                value = getattr(record, field)
                payload[field] = redact_text(value) if isinstance(value, str) else value
        return json.dumps(payload, separators=(",", ":"), ensure_ascii=False)


def configure_logging(level: int = logging.INFO) -> None:
    handler = logging.StreamHandler()
    handler.setFormatter(RedactingJsonFormatter())
    root_logger = logging.getLogger()
    root_logger.handlers = [handler]
    root_logger.setLevel(level)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        supplied_id = request.headers.get(CORRELATION_HEADER, "")
        correlation_id = (
            supplied_id
            if _safe_request_id.fullmatch(supplied_id)
            else str(uuid.uuid4())
        )
        context_token = _correlation_id.set(correlation_id)
        started_at = time.perf_counter()
        request_fields = {
            "method": request.method,
            "path": redact_path(request.url.path),
            "query": redact_query(request.url.query),
        }

        try:
            response = await call_next(request)
        except Exception as exc:
            logging.getLogger("elite_tickets.request").error(
                "request_failed",
                extra={
                    **request_fields,
                    "status_code": 500,
                    "duration_ms": round((time.perf_counter() - started_at) * 1000, 2),
                    "exception_type": type(exc).__name__,
                },
            )
            raise
        else:
            response.headers[CORRELATION_HEADER] = correlation_id
            logging.getLogger("elite_tickets.request").info(
                "request_completed",
                extra={
                    **request_fields,
                    "status_code": response.status_code,
                    "duration_ms": round((time.perf_counter() - started_at) * 1000, 2),
                },
            )
            return response
        finally:
            _correlation_id.reset(context_token)
