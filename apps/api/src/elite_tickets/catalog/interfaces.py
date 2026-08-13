"""Provider-agnostic catalog contracts."""

from typing import Protocol

from elite_tickets.catalog.schemas import CatalogEventDetail, CatalogPage


class CatalogProvider(Protocol):
    async def search_events(
        self,
        query: str | None = None,
        *,
        page: int = 1,
        size: int = 20,
        country_code: str | None = None,
        city: str | None = None,
    ) -> CatalogPage:
        """Return normalized catalog search results."""

    async def event_details(self, external_id: str) -> CatalogEventDetail:
        """Return a normalized catalog detail payload."""
