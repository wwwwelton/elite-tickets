import uuid
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from datetime import timedelta
from typing import Annotated, Any

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt import InvalidTokenError
from pwdlib import PasswordHash
from pwdlib.exceptions import PwdlibError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from elite_tickets.auth.models import Role, User
from elite_tickets.db.base import utc_now, uuid7
from elite_tickets.db.session import get_session
from elite_tickets.shared.config import get_settings

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_TTL = timedelta(minutes=15)

password_hash = PasswordHash.recommended()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")


@dataclass(frozen=True)
class TokenClaims:
    subject: uuid.UUID
    role: Role


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, encoded_hash: str) -> bool:
    try:
        return password_hash.verify(password, encoded_hash)
    except PwdlibError:
        return False


def create_access_token(user: User) -> str:
    now = utc_now()
    payload = {
        "sub": str(user.id),
        "role": user.role.value,
        "iat": now,
        "exp": now + ACCESS_TOKEN_TTL,
        "jti": str(uuid7()),
    }
    secret = get_settings().jwt_secret.get_secret_value()
    return jwt.encode(payload, secret, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> TokenClaims:
    secret = get_settings().jwt_secret.get_secret_value()
    payload: dict[str, Any] = jwt.decode(
        token,
        secret,
        algorithms=[JWT_ALGORITHM],
        options={"require": ["sub", "role", "iat", "exp", "jti"]},
    )
    return TokenClaims(
        subject=uuid.UUID(payload["sub"]),
        role=Role(payload["role"]),
    )


def unauthorized() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> User:
    try:
        claims = decode_access_token(token)
    except (InvalidTokenError, ValueError, TypeError):
        raise unauthorized() from None

    user = await session.scalar(select(User).where(User.id == claims.subject))
    if user is None or not user.is_active or user.role is not claims.role:
        raise unauthorized()
    return user


def require_roles(*allowed_roles: Role) -> Callable[..., Awaitable[User]]:
    if not allowed_roles:
        raise ValueError("at least one role is required")
    allowed = frozenset(allowed_roles)

    async def dependency(
        user: Annotated[User, Depends(get_current_user)],
    ) -> User:
        if user.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user

    return dependency
