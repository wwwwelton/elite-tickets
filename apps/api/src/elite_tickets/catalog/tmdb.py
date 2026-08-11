"""Backend-only TMDb adapter with bounded resilience and normalization."""

import asyncio
from datetime import date
from typing import Any

import httpx
from elite_tickets.shared.config import get_settings
from elite_tickets.shared.errors import (
    DependencyUnavailableError,
    DomainValidationError,
)
from pydantic import BaseModel, ConfigDict, Field, ValidationError

TMDB_BASE_URL = "https://api.themoviedb.org/3/"
TMDB_TIMEOUT_SECONDS = 3.0
TMDB_MAX_ATTEMPTS = 3


class TmdbUnavailableError(DependencyUnavailableError):
    """TMDb could not return a complete, valid response within the retry budget."""


class Genre(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: int = Field(gt=0)
    name: str = Field(min_length=1, max_length=120)


class MovieResult(BaseModel):
    model_config = ConfigDict(frozen=True)

    tmdb_id: int = Field(gt=0)
    title: str = Field(min_length=1, max_length=300)
    poster_path: str | None = None
    release_date: date | None = None


class MovieDetails(MovieResult):
    overview: str | None = None
    backdrop_path: str | None = None
    original_language: str | None = Field(default=None, max_length=16)
    genres: tuple[Genre, ...] = ()


class _SearchMovie(BaseModel):
    id: int
    title: str
    poster_path: str | None = None
    release_date: date | None = None


class _SearchResponse(BaseModel):
    results: list[_SearchMovie]


class _MovieResponse(_SearchMovie):
    overview: str | None = None
    backdrop_path: str | None = None
    original_language: str | None = None
    genres: list[Genre] = Field(default_factory=list)


class TmdbClient:
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def search_movies(self, query: str, *, page: int = 1) -> list[MovieResult]:
        normalized_query = query.strip()
        if not normalized_query or page < 1:
            raise DomainValidationError("invalid TMDb search")
        payload = await self._get(
            "search/movie", params={"query": normalized_query, "page": page}
        )
        try:
            response = _SearchResponse.model_validate(payload)
            return [
                MovieResult(
                    tmdb_id=item.id,
                    title=item.title,
                    poster_path=item.poster_path,
                    release_date=item.release_date,
                )
                for item in response.results
            ]
        except ValidationError:
            raise TmdbUnavailableError("invalid TMDb search response") from None

    async def movie_details(self, tmdb_id: int) -> MovieDetails:
        if tmdb_id < 1:
            raise DomainValidationError("invalid TMDb movie id")
        payload = await self._get(f"movie/{tmdb_id}")
        try:
            item = _MovieResponse.model_validate(payload)
            return MovieDetails(
                tmdb_id=item.id,
                title=item.title,
                poster_path=item.poster_path,
                release_date=item.release_date,
                overview=item.overview,
                backdrop_path=item.backdrop_path,
                original_language=item.original_language,
                genres=tuple(item.genres),
            )
        except ValidationError:
            raise TmdbUnavailableError("invalid TMDb movie response") from None

    async def _get(self, path: str, *, params: dict[str, Any] | None = None) -> Any:
        request_params = dict(params or {})
        authorization = f"Bearer {get_settings().tmdb_api_key.get_secret_value()}"
        for attempt in range(1, TMDB_MAX_ATTEMPTS + 1):
            try:
                response = await self._client.get(
                    path,
                    params=request_params,
                    headers={"Authorization": authorization},
                    timeout=TMDB_TIMEOUT_SECONDS,
                )
                if response.status_code == 429 or response.status_code >= 500:
                    raise _RetryableTmdbResponse
                response.raise_for_status()
                return response.json()
            except (httpx.TimeoutException, _RetryableTmdbResponse):
                if attempt == TMDB_MAX_ATTEMPTS:
                    break
                await asyncio.sleep(0.1 * attempt)
            except (httpx.HTTPError, ValueError):
                raise TmdbUnavailableError("TMDb request failed") from None
        raise TmdbUnavailableError("TMDb retry budget exhausted")


class _RetryableTmdbResponse(Exception):
    pass


def create_tmdb_http_client() -> httpx.AsyncClient:
    return httpx.AsyncClient(
        base_url=TMDB_BASE_URL, headers={"Accept": "application/json"}
    )
