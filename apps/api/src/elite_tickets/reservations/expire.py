"""One-shot reservation expiry command for cron/scheduler execution."""

import asyncio

from elite_tickets.db.session import session_factory
from elite_tickets.reservations.service import (
    EXPIRY_BATCH_SIZE,
    expire_pending_reservations,
)


async def run_expiry() -> int:
    """Drain all currently expired reservations in bounded transactions."""

    total = 0
    while True:
        async with session_factory() as session, session.begin():
            expired = await expire_pending_reservations(session)
        total += expired
        if expired < EXPIRY_BATCH_SIZE:
            return total


async def main() -> None:
    expired = await run_expiry()
    print(f"Expired reservations: {expired}")


if __name__ == "__main__":
    asyncio.run(main())
