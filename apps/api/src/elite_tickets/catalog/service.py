"""Provider-agnostic catalog service for EliteTickets."""

from __future__ import annotations

from elite_tickets.catalog.interfaces import CatalogProvider
from elite_tickets.catalog.schemas import CatalogEventDetail, CatalogPage


class CatalogService:
    def __init__(self, provider: CatalogProvider) -> None:
        self._provider = provider

    async def search_events(
        self,
        query: str,
        *,
        page: int = 1,
        size: int = 20,
        country_code: str = "BR",
        city: str | None = None,
    ) -> CatalogPage:
        return await self._provider.search_events(
            query,
            page=page,
            size=size,
            country_code=country_code,
            city=city,
        )

    async def event_details(self, external_id: str) -> CatalogEventDetail:
        return await self._provider.event_details(external_id)
