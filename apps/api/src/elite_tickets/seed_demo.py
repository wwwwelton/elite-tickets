"""Create repeatable, explicitly non-production demonstration fixtures."""

import asyncio
from dataclasses import dataclass
from datetime import UTC, date, datetime
from decimal import Decimal

from elite_tickets.auth.models import Role, User
from elite_tickets.auth.security import hash_password, verify_password
from elite_tickets.db.session import session_factory
from elite_tickets.events.models import Event, EventState, MovieSnapshot
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

DEMO_PASSWORD = "DemoElite2026!"
DEMO_TMDB_ID = 550


@dataclass(frozen=True)
class DemoAccount:
    email: str
    display_name: str
    role: Role


DEMO_ACCOUNTS = (
    DemoAccount("organizer@demo.elitetickets.local", "Organizador Demo", Role.ORGANIZER),
    DemoAccount("customer@demo.elitetickets.local", "Cliente Demo", Role.CUSTOMER),
    DemoAccount("gate@demo.elitetickets.local", "Portaria Demo", Role.GATE),
)


async def seed_demo(session: AsyncSession) -> Event:
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
    organizer = users[Role.ORGANIZER]
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
            capacity=120,
            reserved_quantity=0,
            sold_quantity=0,
            price=Decimal("35.00"),
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


def credentials_output(event: Event) -> str:
    accounts = "\n".join(
        f"- {account.role.value}: {account.email} / {DEMO_PASSWORD}"
        for account in DEMO_ACCOUNTS
    )
    return (
        "EliteTickets demo data ready. These credentials are local/demo only.\n"
        f"{accounts}\n"
        "Simulated payment tokens: tok_approved, tok_declined\n"
        f"Published purchase fixture: event_id={event.id}"
    )


async def main() -> None:
    async with session_factory() as session, session.begin():
        event = await seed_demo(session)
    print(credentials_output(event))


if __name__ == "__main__":
    asyncio.run(main())
