from typing import Annotated

from fastapi import Depends, FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from elite_tickets.auth.router import router as auth_router
from elite_tickets.catalog.router import router as catalog_router
from elite_tickets.db.session import get_session
from elite_tickets.events.organizer_router import router as organizer_events_router
from elite_tickets.events.router import router as events_router
from elite_tickets.reservations.router import router as reservations_router
from elite_tickets.shared.config import get_settings
from elite_tickets.shared.errors import install_exception_handlers
from elite_tickets.shared.logging import RequestLoggingMiddleware, configure_logging
from elite_tickets.tickets.gate_router import router as gate_router
from elite_tickets.tickets.router import router as tickets_router
from elite_tickets.tickets.share_router import router as share_router

API_PREFIX = "/api/v1"

settings = get_settings()
configure_logging()

app = FastAPI(title="EliteTickets API", version="1.0.0")
install_exception_handlers(app)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin).rstrip("/") for origin in settings.cors_origins],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Idempotency-Key",
        "X-Request-ID",
    ],
    expose_headers=["X-Request-ID"],
)
app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(catalog_router, prefix=API_PREFIX)
app.include_router(events_router, prefix=API_PREFIX)
app.include_router(organizer_events_router, prefix=API_PREFIX)
app.include_router(reservations_router, prefix=API_PREFIX)
app.include_router(tickets_router, prefix=API_PREFIX)
app.include_router(gate_router, prefix=API_PREFIX)
app.include_router(share_router, prefix=API_PREFIX)


@app.get("/health/live", tags=["Health"])
async def health_live() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/ready", tags=["Health"])
async def health_ready(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> JSONResponse:
    try:
        await session.execute(text("SELECT 1"))
    except SQLAlchemyError:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "unavailable"},
        )
    return JSONResponse(content={"status": "ok"})
