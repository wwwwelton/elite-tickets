"""Catalog error types and upstream state classification."""

from __future__ import annotations

from dataclasses import dataclass

from elite_tickets.shared.errors import DependencyUnavailableError


class CatalogUpstreamError(DependencyUnavailableError):
    """Base error for upstream catalog failures."""


class CatalogAuthError(CatalogUpstreamError):
    code = "catalog_auth_error"
    public_message = "The catalog provider authentication is misconfigured"


class CatalogRateLimitError(CatalogUpstreamError):
    code = "catalog_rate_limited"
    public_message = "The catalog provider rate limit was reached"


class CatalogUpstreamUnavailableError(CatalogUpstreamError):
    code = "dependency_unavailable"
    public_message = "The catalog provider is temporarily unavailable"


@dataclass(frozen=True)
class CatalogUpstreamState:
    user_facing_state: str
    error: type[CatalogUpstreamError]


def classify_upstream_status(status_code: int) -> CatalogUpstreamState:
    if status_code == 401:
        return CatalogUpstreamState("auth_error", CatalogAuthError)
    if status_code == 429:
        return CatalogUpstreamState("rate_limited", CatalogRateLimitError)
    if status_code >= 500:
        return CatalogUpstreamState("upstream_error", CatalogUpstreamUnavailableError)
    return CatalogUpstreamState("error", CatalogUpstreamUnavailableError)
