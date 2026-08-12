from collections.abc import AsyncIterator
from typing import Annotated

from elite_tickets.auth.models import Role, User
from elite_tickets.auth.security import require_roles
from elite_tickets.catalog.interfaces import CatalogProvider
from elite_tickets.catalog.schemas import CatalogEventDetail, CatalogPage
from elite_tickets.catalog.service import CatalogService
from elite_tickets.catalog.ticketmaster_client import (
    TicketmasterClient,
    create_ticketmaster_http_client,
)
from fastapi import APIRouter, Depends, Path, Query

router = APIRouter(prefix="/catalog", tags=["Catalog"])


async def get_ticketmaster_client() -> AsyncIterator[TicketmasterClient]:
    async with create_ticketmaster_http_client() as http_client:
        yield TicketmasterClient(http_client)


async def get_tmdb_client() -> AsyncIterator[TicketmasterClient]:
    async for client in get_ticketmaster_client():
        yield client


@router.get("/events", response_model=CatalogPage)
async def search_events(
    keyword: Annotated[str, Query(min_length=1, max_length=200)],
    _: Annotated[User, Depends(require_roles(Role.ORGANIZER))],
    catalog: Annotated[CatalogProvider, Depends(get_ticketmaster_client)],
    page: Annotated[int, Query(ge=1)] = 1,
    size: Annotated[int, Query(ge=1, le=100)] = 20,
    country_code: Annotated[str, Query(alias="countryCode", min_length=2, max_length=2)] = "BR",
    city: Annotated[str | None, Query(min_length=1, max_length=120)] = None,
) -> CatalogPage:
    service = CatalogService(catalog)
    return await service.search_events(
        keyword,
        page=page,
        size=size,
        country_code=country_code,
        city=city,
    )


@router.get("/events/{external_id}", response_model=CatalogEventDetail)
async def get_event_details(
    external_id: Annotated[str, Path(min_length=1, max_length=255)],
    _: Annotated[User, Depends(require_roles(Role.ORGANIZER))],
    catalog: Annotated[CatalogProvider, Depends(get_ticketmaster_client)],
) -> CatalogEventDetail:
    service = CatalogService(catalog)
    return await service.event_details(external_id)
