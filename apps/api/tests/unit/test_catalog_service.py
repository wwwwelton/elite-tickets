from __future__ import annotations

from dataclasses import dataclass

import pytest
from elite_tickets.catalog.errors import (
    CatalogAuthError,
    CatalogRateLimitError,
    CatalogUpstreamUnavailableError,
)
from elite_tickets.catalog.schemas import (
    CatalogEventDetail,
    CatalogPage,
    CatalogSearchResult,
)
from elite_tickets.catalog.service import CatalogService

pytestmark = pytest.mark.unit


def test_catalog_error_http_status_policy() -> None:
    assert CatalogAuthError.status_code == 503
    assert CatalogRateLimitError.status_code == 429
    assert CatalogUpstreamUnavailableError.status_code == 503


@dataclass
class RecordingProvider:
    result: CatalogPage | CatalogEventDetail
    calls: list[tuple[str, dict[str, object]]]

    async def search_events(
        self,
        query: str,
        *,
        page: int = 1,
        size: int = 20,
        country_code: str = "BR",
        city: str | None = None,
    ) -> CatalogPage:
        self.calls.append(
            (
                "search_events",
                {
                    "query": query,
                    "page": page,
                    "size": size,
                    "country_code": country_code,
                    "city": city,
                },
            )
        )
        assert isinstance(self.result, CatalogPage)
        return self.result

    async def event_details(self, external_id: str) -> CatalogEventDetail:
        self.calls.append(("event_details", {"external_id": external_id}))
        assert isinstance(self.result, CatalogEventDetail)
        return self.result


@pytest.mark.asyncio
async def test_search_events_delegates_filters_and_returns_normalized_page() -> None:
    provider = RecordingProvider(
        result=CatalogPage(
            items=[
                CatalogSearchResult(
                    external_id="evt-1",
                    title="Show Elite",
                    description=None,
                    image_url=None,
                    category="Music",
                    date=None,
                    venue_name=None,
                    city=None,
                    country_code="BR",
                )
            ],
            page=2,
            size=5,
            total=10,
            has_more=True,
        ),
        calls=[],
    )

    service = CatalogService(provider)
    page = await service.search_events("  show  ", page=2, size=5, country_code="US", city="Seattle")

    assert provider.calls == [
        (
            "search_events",
            {
                "query": "  show  ",
                "page": 2,
                "size": 5,
                "country_code": "US",
                "city": "Seattle",
            },
        )
    ]
    assert page.page == 2
    assert page.size == 5
    assert page.total == 10
    assert page.has_more is True
    assert page.items[0].title == "Show Elite"
    assert page.items[0].category == "Music"


@pytest.mark.asyncio
async def test_event_details_delegates_and_preserves_optional_fields() -> None:
    provider = RecordingProvider(
        result=CatalogEventDetail(
            external_id="evt-2",
            title="Evento sem imagem",
            description="Descrição",
            image_url=None,
            category=None,
            date=None,
            venue_name="Arena",
            city="São Paulo",
            country_code="BR",
        ),
        calls=[],
    )

    service = CatalogService(provider)
    detail = await service.event_details("evt-2")

    assert provider.calls == [("event_details", {"external_id": "evt-2"})]
    assert detail.external_id == "evt-2"
    assert detail.image_url is None
    assert detail.venue_name == "Arena"


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("error", "expected"),
    [
        (CatalogAuthError("auth"), CatalogAuthError),
        (CatalogRateLimitError("rate"), CatalogRateLimitError),
        (CatalogUpstreamUnavailableError("upstream"), CatalogUpstreamUnavailableError),
    ],
)
async def test_event_details_propagates_upstream_error_states(
    error: Exception,
    expected: type[Exception],
) -> None:
    class FailingProvider:
        async def search_events(self, *args: object, **kwargs: object) -> CatalogPage:
            raise AssertionError("search_events should not be called")

        async def event_details(self, external_id: str) -> CatalogEventDetail:
            assert external_id == "evt-3"
            raise error

    service = CatalogService(FailingProvider())

    with pytest.raises(expected):
        await service.event_details("evt-3")


@pytest.mark.asyncio
async def test_search_events_can_return_empty_results() -> None:
    provider = RecordingProvider(
        result=CatalogPage(items=[], page=1, size=20, total=0, has_more=False),
        calls=[],
    )

    service = CatalogService(provider)
    page = await service.search_events("nothing")

    assert provider.calls == [
        (
            "search_events",
            {
                "query": "nothing",
                "page": 1,
                "size": 20,
                "country_code": "BR",
                "city": None,
            },
        )
    ]
    assert page.items == []
    assert page.total == 0
