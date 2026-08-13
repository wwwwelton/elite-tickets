from datetime import UTC, datetime
from decimal import Decimal

import pytest

from elite_tickets.db.base import uuid7
from elite_tickets.events.models import Event, EventState, MovieSnapshot
from elite_tickets.events.organizer_service import _projection as organizer_projection
from elite_tickets.events.service import (
    LEGACY_TMDB_POSTER_BASE_URL,
    _poster_url,
)
from elite_tickets.events.service import (
    _projection as public_projection,
)

pytestmark = pytest.mark.unit

TICKETMASTER_IMAGE_URL = "https://s1.ticketm.net/dam/a/111/fixture-event.jpg"


def test_public_and_organizer_projections_preserve_ticketmaster_snapshot_image() -> None:
    event_id = uuid7()
    event = Event(
        id=event_id,
        organizer_id=uuid7(),
        state=EventState.PUBLISHED,
        venue_name="Arena Elite",
        venue_address="Rua dos Testes, 10",
        starts_at=datetime(2030, 1, 1, 20, 0, tzinfo=UTC),
        ends_at=datetime(2030, 1, 1, 22, 0, tzinfo=UTC),
        timezone="America/Sao_Paulo",
        capacity=100,
        reserved_quantity=5,
        sold_quantity=20,
        price=Decimal("25.00"),
        currency="BRL",
    )
    snapshot = MovieSnapshot(
        event_id=event_id,
        external_source="ticketmaster",
        external_id="G5diZf-test-100",
        tmdb_id=1,
        title="Ticketmaster Event",
        poster_path="/legacy-poster.jpg",
        image_url=TICKETMASTER_IMAGE_URL,
        genres=[],
    )

    assert public_projection(event, snapshot).poster_url == TICKETMASTER_IMAGE_URL
    assert (
        organizer_projection(event, snapshot, viewer_id=event.organizer_id).poster_url
        == TICKETMASTER_IMAGE_URL
    )


def test_poster_url_keeps_relative_legacy_paths_and_rejects_unsafe_urls() -> None:
    assert _poster_url(" /legacy-poster.jpg ") == (
        f"{LEGACY_TMDB_POSTER_BASE_URL}/legacy-poster.jpg"
    )
    assert _poster_url(TICKETMASTER_IMAGE_URL) == TICKETMASTER_IMAGE_URL
    assert _poster_url("http://s1.ticketm.net/dam/a/insecure.jpg") is None
    assert _poster_url("javascript:alert(1)") is None
    assert _poster_url("//untrusted.example/poster.jpg") is None
