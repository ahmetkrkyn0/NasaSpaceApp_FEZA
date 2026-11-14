"""API error types and FastAPI error handlers."""

from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


class ApiError(Exception):
    """Base class for errors that map to a JSON error response."""

    status_code: int = 500
    code: str = "internal_error"

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class SiteNotFound(ApiError):
    """The requested landing site does not exist."""

    status_code = 404
    code = "site_not_found"


class InvalidParameter(ApiError):
    """A request parameter is missing or out of bounds."""

    status_code = 422
    code = "invalid_parameter"


class DateOutOfRange(ApiError):
    """The requested date is outside the computable ephemeris range."""

    status_code = 422
    code = "date_out_of_range"


class TooManyScenarios(ApiError):
    """The request asks for more scenarios than allowed."""

    status_code = 422
    code = "too_many_scenarios"


class DataUnavailable(ApiError):
    """A required data file or kernel is not available."""

    status_code = 503
    code = "data_unavailable"


def _error_response(status_code: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"error": {"code": code, "message": message}},
    )


def _validation_message(exc: RequestValidationError) -> str:
    parts: list[str] = []
    for error in exc.errors():
        location = [str(item) for item in error.get("loc", ()) if item not in ("body", "query", "path")]
        name = ".".join(location) or "request"
        parts.append(f"Invalid parameter '{name}': {error.get('msg', 'invalid value')}")
    return "; ".join(parts) or "Invalid request parameters."


def install_error_handlers(app: FastAPI) -> None:
    """Register the JSON error handlers on the application."""

    @app.exception_handler(ApiError)
    async def _handle_api_error(request: Request, exc: ApiError) -> JSONResponse:
        return _error_response(exc.status_code, exc.code, exc.message)

    @app.exception_handler(RequestValidationError)
    async def _handle_validation_error(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        return _error_response(422, InvalidParameter.code, _validation_message(exc))
