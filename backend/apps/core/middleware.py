from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from django.core.cache import cache
from django.utils.deprecation import MiddlewareMixin
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken

from .threadlocals import clear, set_current_org_id

if TYPE_CHECKING:
    from django.http import HttpRequest, HttpResponse

logger = logging.getLogger(__name__)

ORG_CACHE_TTL = 60  # seconds


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
                    cache_key = f"tenant:org_active:{org_id}"
                    org_active = cache.get(cache_key)
                    if org_active is None:
                        from apps.organizations.models import Organization

                        org_active = Organization.objects.filter(id=org_id, is_active=True).exists()
                        cache.set(cache_key, org_active, ORG_CACHE_TTL)
                    request.org_id = org_id if org_active else None
                set_current_org_id(request.org_id)
            except (InvalidToken, TokenError, KeyError) as e:
                logger.debug("Token validation failed in TenantMiddleware: %s", e)

        if not request.org_id:
            set_current_org_id(None)

    def process_response(self, request: HttpRequest, response: HttpResponse) -> HttpResponse:
        clear()
        return response
