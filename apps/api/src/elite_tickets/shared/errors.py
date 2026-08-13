from typing import ClassVar

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel


class ErrorBody(BaseModel):
    code: str
    message: str


class ErrorResponse(BaseModel):
    error: ErrorBody


class DomainError(Exception):
    status_code: ClassVar[int] = 500
    code: ClassVar[str] = "internal_error"
    public_message: ClassVar[str] = "The operation could not be completed"

    def __init__(self, internal_detail: str | None = None) -> None:
        super().__init__(internal_detail or self.public_message)


class DomainValidationError(DomainError):
    status_code = 422
    code = "validation_error"
    public_message = "The supplied data is invalid"


class ResourceNotFoundError(DomainError):
    status_code = 404
    code = "not_found"
    public_message = "The requested resource was not found"


class PermissionDeniedError(DomainError):
    status_code = 403
    code = "forbidden"
    public_message = "The operation is not permitted"


class ConflictError(DomainError):
    status_code = 409
    code = "conflict"
    public_message = "A operação conflita com o estado atual do recurso"


class DependencyUnavailableError(DomainError):
    status_code = 503
    code = "dependency_unavailable"
    public_message = "A required service is temporarily unavailable"


async def domain_error_handler(_: Request, exc: Exception) -> JSONResponse:
    if not isinstance(exc, DomainError):
        raise exc

    response = ErrorResponse(
        error=ErrorBody(code=exc.code, message=exc.public_message),
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=response.model_dump(),
    )


def install_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(DomainError, domain_error_handler)
