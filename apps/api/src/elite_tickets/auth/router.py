from typing import Annotated, Literal

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from elite_tickets.auth.models import Role, User
from elite_tickets.auth.security import (
    ACCESS_TOKEN_TTL,
    create_access_token,
    hash_password,
    unauthorized,
    verify_password,
)
from elite_tickets.db.session import get_session
from elite_tickets.shared.errors import ConflictError

router = APIRouter(prefix="/auth", tags=["Auth"])

_DUMMY_PASSWORD_HASH = (
    "$argon2id$v=19$m=65536,t=3,p=4$4/JJsbvbHUalQHnn4twXkg$"
    "4eQahjsBM6aI8qFw0RZDJjV6STc4xluTbJoGnSZQ3hs"
)


class LoginRequest(BaseModel):
    email: str = Field(
        min_length=3,
        max_length=320,
        pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$",
        json_schema_extra={"format": "email"},
    )
    password: str = Field(min_length=8)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()


class TokenResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int
    role: Role


class RegisterRequest(BaseModel):
    email: str = Field(
        min_length=3,
        max_length=320,
        pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$",
        json_schema_extra={"format": "email"},
    )
    password: str = Field(min_length=8, max_length=128)
    display_name: str = Field(min_length=1, max_length=120)
    role: Role

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()

    @field_validator("display_name", mode="before")
    @classmethod
    def normalize_display_name(cls, value: str) -> str:
        return value.strip() if isinstance(value, str) else value


@router.post("/token", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> TokenResponse:
    user = await session.scalar(select(User).where(User.email == payload.email))
    encoded_hash = user.password_hash if user is not None else _DUMMY_PASSWORD_HASH
    password_matches = verify_password(payload.password, encoded_hash)

    if user is None or not user.is_active or not password_matches:
        raise unauthorized()

    return TokenResponse(
        access_token=create_access_token(user),
        expires_in=int(ACCESS_TOKEN_TTL.total_seconds()),
        role=user.role,
    )


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    payload: RegisterRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> TokenResponse:
    existing = await session.scalar(select(User).where(User.email == payload.email))
    if existing is not None:
        raise ConflictError("email is already registered")

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        display_name=payload.display_name,
        role=payload.role,
    )
    session.add(user)
    try:
        await session.flush()
    except IntegrityError:
        raise ConflictError("email is already registered") from None

    return TokenResponse(
        access_token=create_access_token(user),
        expires_in=int(ACCESS_TOKEN_TTL.total_seconds()),
        role=user.role,
    )
