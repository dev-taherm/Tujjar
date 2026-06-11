from __future__ import annotations

import logging
from typing import Any

from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger("apps")


class TujjarException(APIException):
    """Base exception for Tujjar application errors."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "An error occurred."
    default_code = "error"

    def __init__(self, detail: str | None = None, code: str | None = None) -> None:
        super().__init__(detail or self.default_detail, code or self.default_code)


class NotFoundException(TujjarException):
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = "Resource not found."
    default_code = "not_found"


class ConflictException(TujjarException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "Resource already exists."
    default_code = "conflict"


class ForbiddenException(TujjarException):
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "You do not have permission to perform this action."
    default_code = "forbidden"


def custom_exception_handler(
    exc: Exception, context: dict[str, Any]
) -> Response | None:
    """Custom exception handler that returns consistent error format."""
    response = exception_handler(exc, context)

    if response is not None:
        error_data = {
            "status": "error",
            "error": {
                "code": getattr(exc, "default_code", "error"),
                "message": str(exc.detail) if hasattr(exc, "detail") else str(exc),
            },
        }
        response.data = error_data
        return response

    # Handle uncaught exceptions
    logger.exception("Unhandled exception: %s", exc)
    return Response(
        {
            "status": "error",
            "error": {
                "code": "internal_error",
                "message": "An internal server error occurred.",
            },
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
