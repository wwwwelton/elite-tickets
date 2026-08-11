from collections.abc import AsyncIterator
from typing import Annotated

from elite_tickets.auth.models import Role, User
from elite_tickets.auth.security import require_roles
from elite_tickets.catalog.tmdb import (
    MovieResult,
    TmdbClient,
    create_tmdb_http_client,
)
from fastapi import APIRouter, Depends, Query

router = APIRouter(prefix="/catalog", tags=["Catalog"])


async def get_tmdb_client() -> AsyncIterator[TmdbClient]:
    async with create_tmdb_http_client() as http_client:
        yield TmdbClient(http_client)


@router.get("/movies", response_model=list[MovieResult])
async def search_movies(
    query: Annotated[str, Query(min_length=1, max_length=200)],
    _: Annotated[User, Depends(require_roles(Role.ORGANIZER))],
    catalog: Annotated[TmdbClient, Depends(get_tmdb_client)],
    page: Annotated[int, Query(ge=1)] = 1,
) -> list[MovieResult]:
    return await catalog.search_movies(query, page=page)
