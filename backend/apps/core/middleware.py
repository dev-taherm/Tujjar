from __future__ import annotations

import logging

from django.http import HttpRequest, HttpResponse
from django.utils.deprecation import MiddlewareMixin
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken

from .threadlocals import clear, set_current_org_id

logger = logging.getLogger(__name__)


class TenantMiddleware(MiddlewareMixin):
    """
    Extract organization_id from JWT and set in thread-local storage.
    This enables TenantManager to filter queries automatically.

    Uses SimpleJWT's AccessToken for proper token validation including
    blacklist checks, expiry, and signature verification.
    """

    def process_request(self, request: HttpRequest) -> None:
        request.org_id = None

        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if auth_header.startswith("Bearer "):
            try:
                token_str = auth_header.split(" ")[1]
                token = AccessToken(token_str)
                org_id = token.get("org_id")
                if org_id:
                    from apps.organizations.models import Organization

                    if Organization.objects.filter(id=org_id, is_active=True).exists():
                        request.org_id = org_id
                    else:
                        request.org_id = None
                set_current_org_id(request.org_id)
            except (InvalidToken, TokenError, KeyError) as e:
                logger.debug("Token validation failed in TenantMiddleware: %s", e)
                pass

        if not request.org_id:
            set_current_org_id(None)

    def process_response(
        self, request: HttpRequest, response: HttpResponse
    ) -> HttpResponse:
        clear()
        return response
