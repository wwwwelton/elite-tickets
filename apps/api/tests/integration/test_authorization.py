import os
from collections.abc import AsyncIterator
from typing import Annotated, Any

import pytest
from fastapi import Depends, FastAPI
from httpx import ASGITransport, AsyncClient

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+psycopg://test:test@localhost:5432/elite_tickets_test",
)
os.environ.setdefault("JWT_SECRET", "test-jwt-secret-with-at-least-32-bytes")
os.environ.setdefault("QR_SECRET", "different-test-qr-secret-at-least-32-bytes")
os.environ.setdefault("TMDB_API_KEY", "test-key")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:3000")

from elite_tickets.auth.models import Role, User
from elite_tickets.auth.security import create_access_token, require_roles
from elite_tickets.db.base import uuid7
from elite_tickets.db.session import get_session

pytestmark = pytest.mark.integration


class SessionStub:
    def __init__(self, user: User | None) -> None:
        self.user = user

    async def scalar(self, _: Any) -> User | None:
        return self.user


def user_for(role: Role, *, active: bool = True) -> User:
    return User(
        id=uuid7(),
        email=f"{role.value.lower()}@example.com",
        password_hash="unused-in-authorization-tests",
        display_name=role.value.title(),
        role=role,
        is_active=active,
    )


def build_app(user: User | None) -> FastAPI:
    app = FastAPI()

    async def session_override() -> AsyncIterator[SessionStub]:
        yield SessionStub(user)

    app.dependency_overrides[get_session] = session_override

    @app.get("/organizer")
    async def organizer_only(
        _: Annotated[User, Depends(require_roles(Role.ORGANIZER))],
    ) -> dict[str, bool]:
        return {"allowed": True}

    @app.get("/customer")
    async def customer_only(
        _: Annotated[User, Depends(require_roles(Role.CUSTOMER))],
    ) -> dict[str, bool]:
        return {"allowed": True}

    @app.get("/gate")
    async def gate_only(
        _: Annotated[User, Depends(require_roles(Role.GATE))],
    ) -> dict[str, bool]:
        return {"allowed": True}

    return app


@pytest.mark.parametrize(
    ("role", "allowed_path"),
    [
        (Role.ORGANIZER, "/organizer"),
        (Role.CUSTOMER, "/customer"),
        (Role.GATE, "/gate"),
    ],
)
async def test_each_role_can_access_its_backend_dependency(
    role: Role,
    allowed_path: str,
) -> None:
    user = user_for(role)
    transport = ASGITransport(app=build_app(user))
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            allowed_path,
            headers={"Authorization": f"Bearer {create_access_token(user)}"},
        )
    assert response.status_code == 200
    assert response.json() == {"allowed": True}


@pytest.mark.parametrize(
    ("role", "forbidden_path"),
    [
        (Role.ORGANIZER, "/customer"),
        (Role.CUSTOMER, "/gate"),
        (Role.GATE, "/organizer"),
    ],
)
async def test_each_role_receives_403_for_another_role(
    role: Role,
    forbidden_path: str,
) -> None:
    user = user_for(role)
    transport = ASGITransport(app=build_app(user))
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            forbidden_path,
            headers={"Authorization": f"Bearer {create_access_token(user)}"},
        )
    assert response.status_code == 403
    assert response.json() == {"detail": "Insufficient permissions"}


async def test_inactive_user_receives_401() -> None:
    user = user_for(Role.CUSTOMER, active=False)
    transport = ASGITransport(app=build_app(user))
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            "/customer",
            headers={"Authorization": f"Bearer {create_access_token(user)}"},
        )
    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


@pytest.mark.parametrize("token", ["not-a-jwt", "aaa.bbb.ccc"])
async def test_invalid_jwt_receives_401_without_echoing_token(token: str) -> None:
    transport = ASGITransport(app=build_app(None))
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            "/gate",
            headers={"Authorization": f"Bearer {token}"},
        )
    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"
    assert token not in response.text
