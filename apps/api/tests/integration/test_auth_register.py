import os
from collections.abc import AsyncIterator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+psycopg://elite_tickets:elite_tickets@localhost:5432/elite_tickets",
)
os.environ.setdefault("JWT_SECRET", "test-jwt-secret-with-at-least-32-bytes")
os.environ.setdefault("QR_SECRET", "different-test-qr-secret-at-least-32-bytes")
os.environ.setdefault("TMDB_API_KEY", "test-key")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:3000")

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from elite_tickets.auth.models import Role, User
from elite_tickets.auth.security import decode_access_token
from elite_tickets.db.session import get_session
from elite_tickets.main import app

pytestmark = pytest.mark.integration


@pytest_asyncio.fixture
async def database_session() -> AsyncIterator[AsyncSession]:
    engine = create_async_engine(os.environ["DATABASE_URL"])
    async with engine.connect() as connection:
        transaction = await connection.begin()
        session = AsyncSession(bind=connection, expire_on_commit=False)
        try:
            yield session
        finally:
            await session.close()
            await transaction.rollback()
    await engine.dispose()


@pytest_asyncio.fixture
async def client(database_session: AsyncSession) -> AsyncIterator[AsyncClient]:
    async def session_override() -> AsyncIterator[AsyncSession]:
        yield database_session

    app.dependency_overrides[get_session] = session_override
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.pop(get_session, None)


@pytest.mark.parametrize("role", [Role.CUSTOMER, Role.ORGANIZER, Role.GATE])
async def test_register_creates_active_user_and_returns_bearer_token(
    role: Role,
    client: AsyncClient,
    database_session: AsyncSession,
) -> None:
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": f"new-{role.value.lower()}@example.com",
            "password": "correct horse battery",
            "display_name": "New User",
            "role": role.value,
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["role"] == role.value
    assert isinstance(body["expires_in"], int)

    claims = decode_access_token(body["access_token"])
    assert claims.role is role

    stored = await database_session.scalar(
        select(User).where(User.email == f"new-{role.value.lower()}@example.com")
    )
    assert stored is not None
    assert stored.role is role
    assert stored.is_active is True
    assert stored.password_hash != "correct horse battery"


async def test_register_normalizes_email_before_storing(
    client: AsyncClient,
    database_session: AsyncSession,
) -> None:
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "  Mixed.Case@Example.com ",
            "password": "correct horse battery",
            "display_name": "Case Test",
            "role": Role.CUSTOMER.value,
        },
    )

    assert response.status_code == 201
    stored = await database_session.scalar(
        select(User).where(User.email == "mixed.case@example.com")
    )
    assert stored is not None


async def test_register_rejects_duplicate_email(
    client: AsyncClient,
    database_session: AsyncSession,
) -> None:
    existing = User(
        email="taken@example.com",
        password_hash="unused",
        display_name="Existing",
        role=Role.CUSTOMER,
    )
    database_session.add(existing)
    await database_session.flush()

    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "taken@example.com",
            "password": "correct horse battery",
            "display_name": "Duplicate",
            "role": Role.CUSTOMER.value,
        },
    )

    assert response.status_code == 409


@pytest.mark.parametrize(
    "payload",
    [
        {
            "email": "not-an-email",
            "password": "correct horse battery",
            "display_name": "Bad Email",
            "role": "CUSTOMER",
        },
        {
            "email": "short@example.com",
            "password": "short1",
            "display_name": "Short Password",
            "role": "CUSTOMER",
        },
        {
            "email": "blank@example.com",
            "password": "correct horse battery",
            "display_name": "   ",
            "role": "CUSTOMER",
        },
        {
            "email": "badrole@example.com",
            "password": "correct horse battery",
            "display_name": "Bad Role",
            "role": "ADMIN",
        },
    ],
)
async def test_register_rejects_invalid_payloads(
    payload: dict[str, str],
    client: AsyncClient,
) -> None:
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


async def test_registered_user_can_immediately_log_in(
    client: AsyncClient,
) -> None:
    register_response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "login-after-register@example.com",
            "password": "correct horse battery",
            "display_name": "Login After Register",
            "role": Role.CUSTOMER.value,
        },
    )
    assert register_response.status_code == 201

    login_response = await client.post(
        "/api/v1/auth/token",
        json={
            "email": "login-after-register@example.com",
            "password": "correct horse battery",
        },
    )
    assert login_response.status_code == 200
    assert login_response.json()["role"] == "CUSTOMER"
