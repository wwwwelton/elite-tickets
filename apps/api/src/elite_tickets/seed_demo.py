"""Create repeatable, explicitly non-production demonstration fixtures."""

import asyncio
from dataclasses import dataclass, field
from datetime import UTC, date, datetime
from decimal import Decimal

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from elite_tickets.auth.models import Role, User
from elite_tickets.auth.security import hash_password, verify_password
from elite_tickets.catalog.seed_source import CatalogSeedEvent, fetch_seed_events
from elite_tickets.db.session import session_factory
from elite_tickets.events.models import Event, EventState, MovieSnapshot
from elite_tickets.events.organizer_service import snapshot_from_catalog

DEMO_PASSWORD = "DemoElite2026!"
DEMO_TMDB_ID = 550

# Capacity is not published by the catalog, so demo inventory is a local
# decision. The price falls back to this value when the upstream event has no
# BRL price range.
DEMO_CAPACITY = 120
DEMO_PRICE = Decimal("35.00")
DEMO_CATALOG_EVENT_LIMIT = 6


@dataclass(frozen=True)
class DemoAccount:
    email: str
    display_name: str
    role: Role


@dataclass
class SeedResult:
    purchase_fixture: Event
    catalog_events: list[Event] = field(default_factory=list)
    catalog_error: str | None = None


DEMO_ACCOUNTS = (
    DemoAccount("organizer@demo.elitetickets.local", "Organizador Demo", Role.ORGANIZER),
    DemoAccount("customer@demo.elitetickets.local", "Cliente Demo", Role.CUSTOMER),
    DemoAccount("gate@demo.elitetickets.local", "Portaria Demo", Role.GATE),
)


async def seed_accounts(session: AsyncSession) -> dict[Role, User]:
    users: dict[Role, User] = {}
    for account in DEMO_ACCOUNTS:
        user = await session.scalar(select(User).where(User.email == account.email))
        if user is None:
            user = User(
                email=account.email,
                display_name=account.display_name,
                password_hash=hash_password(DEMO_PASSWORD),
                role=account.role,
                is_active=True,
            )
            session.add(user)
        else:
            user.display_name = account.display_name
            user.role = account.role
            user.is_active = True
            if not verify_password(DEMO_PASSWORD, user.password_hash):
                user.password_hash = hash_password(DEMO_PASSWORD)
        users[account.role] = user

    await session.flush()
    return users


async def seed_local_fixture(session: AsyncSession, organizer: User) -> Event:
    """The offline purchase fixture, always available without the catalog."""
    event = await session.scalar(
        select(Event)
        .join(MovieSnapshot)
        .where(
            Event.organizer_id == organizer.id,
            MovieSnapshot.tmdb_id == DEMO_TMDB_ID,
            MovieSnapshot.title == "Clube da Luta — Sessão Elite",
        )
    )
    if event is None:
        published_at = datetime(2026, 8, 10, 12, 0, tzinfo=UTC)
        event = Event(
            organizer_id=organizer.id,
            state=EventState.PUBLISHED,
            venue_name="Cine Elite — Sala 1",
            venue_address="Avenida Paulista, 1000 — São Paulo, SP",
            starts_at=datetime(2026, 12, 12, 22, 0, tzinfo=UTC),
            ends_at=datetime(2026, 12, 13, 0, 30, tzinfo=UTC),
            timezone="America/Sao_Paulo",
            capacity=DEMO_CAPACITY,
            reserved_quantity=0,
            sold_quantity=0,
            price=DEMO_PRICE,
            currency="BRL",
            published_at=published_at,
            movie_snapshot=MovieSnapshot(
                tmdb_id=DEMO_TMDB_ID,
                title="Clube da Luta — Sessão Elite",
                overview="Uma sessão de demonstração com inventário pronto para compra.",
                poster_path="/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
                release_date=date(1999, 10, 15),
                original_language="en",
                genres=[{"id": 18, "name": "Drama"}],
                snapshot_at=published_at,
            ),
        )
        session.add(event)
        await session.flush()
    return event


async def seed_catalog_event(
    session: AsyncSession,
    organizer: User,
    seed_event: CatalogSeedEvent,
    *,
    at: datetime,
) -> Event:
    """Persist one Ticketmaster event, reusing the organizer snapshot shape."""
    external_id = seed_event.detail.external_id
    existing = await session.scalar(
        select(Event)
        .join(MovieSnapshot)
        .where(
            Event.organizer_id == organizer.id,
            MovieSnapshot.external_source == "ticketmaster",
            MovieSnapshot.external_id == external_id,
        )
    )
    if existing is not None:
        return existing

    event = Event(
        organizer_id=organizer.id,
        state=EventState.PUBLISHED,
        venue_name=seed_event.venue_name,
        venue_address=seed_event.venue_address,
        starts_at=seed_event.starts_at,
        ends_at=seed_event.ends_at,
        timezone=seed_event.timezone,
        capacity=DEMO_CAPACITY,
        reserved_quantity=0,
        sold_quantity=0,
        price=seed_event.price or DEMO_PRICE,
        currency="BRL",
        published_at=at,
        movie_snapshot=snapshot_from_catalog(
            seed_event.detail,
            external_id=external_id,
        ),
    )
    session.add(event)
    await session.flush()
    return event


async def seed_demo(
    session: AsyncSession,
    *,
    catalog_events: list[CatalogSeedEvent] | None = None,
    at: datetime | None = None,
) -> SeedResult:
    moment = at or datetime.now(UTC)
    users = await seed_accounts(session)
    organizer = users[Role.ORGANIZER]
    fixture = await seed_local_fixture(session, organizer)

    seeded = [
        await seed_catalog_event(session, organizer, seed_event, at=moment)
        for seed_event in (catalog_events or [])
    ]
    return SeedResult(purchase_fixture=fixture, catalog_events=seeded)


def credentials_output(result: SeedResult) -> str:
    accounts = "\n".join(
        f"- {account.role.value}: {account.email} / {DEMO_PASSWORD}"
        for account in DEMO_ACCOUNTS
    )
    if result.catalog_error:
        catalog_line = (
            f"Ticketmaster snapshot skipped: {result.catalog_error}\n"
            "The local fixture above is enough to walk through the whole flow."
        )
    else:
        titles = "\n".join(
            f"- {event.id}" for event in result.catalog_events
        )
        catalog_line = (
            f"Ticketmaster events snapshotted: {len(result.catalog_events)}\n{titles}"
            if result.catalog_events
            else "Ticketmaster events snapshotted: 0"
        )

    return (
        "EliteTickets demo data ready. These credentials are local/demo only.\n"
        f"{accounts}\n"
        "Simulated payment tokens: tok_approved, tok_declined\n"
        f"Published purchase fixture: event_id={result.purchase_fixture.id}\n"
        f"{catalog_line}"
    )


def describe_catalog_failure(exc: BaseException) -> str:
    """Summarize a catalog failure without echoing the request URL.

    Ticketmaster authenticates with an `apikey` query parameter, so the raw
    exception text carries the credential into stdout and logs.
    """
    if isinstance(exc, httpx.HTTPStatusError):
        status = exc.response.status_code
        if status == 401:
            return "HTTP 401 — check TICKETMASTER_API_KEY"
        if status == 429:
            return "HTTP 429 — Ticketmaster rate limit reached"
        return f"HTTP {status} from Ticketmaster"
    if isinstance(exc, httpx.TimeoutException):
        return "Ticketmaster request timed out"
    if isinstance(exc, httpx.HTTPError):
        return "Ticketmaster is unreachable"
    return type(exc).__name__


async def main() -> None:
    catalog_events: list[CatalogSeedEvent] = []
    catalog_error: str | None = None
    try:
        catalog_events = await fetch_seed_events(limit=DEMO_CATALOG_EVENT_LIMIT)
    except Exception as exc:  # noqa: BLE001 - the seed must survive any catalog failure
        catalog_error = describe_catalog_failure(exc)

    async with session_factory() as session, session.begin():
        result = await seed_demo(session, catalog_events=catalog_events)
        result.catalog_error = catalog_error
        print(credentials_output(result))


if __name__ == "__main__":
    asyncio.run(main())
