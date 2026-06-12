from __future__ import annotations

from django.http import HttpRequest, HttpResponse
from django.utils.deprecation import MiddlewareMixin

from .threadlocals import clear, set_current_org_id


class TenantMiddleware(MiddlewareMixin):
    """
    Extract organization_id from JWT and set in thread-local storage.
    This enables TenantManager to filter queries automatically.

    Note: DRF's JWTAuthentication handles user authentication and token
    decoding. We only extract org_id here for thread-local tenant scoping.
    """

    def process_request(self, request: HttpRequest) -> None:
        request.org_id = None

        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if auth_header.startswith("Bearer "):
            try:
                import jwt
                from django.conf import settings

                token = auth_header.split(" ")[1]
                jwt_settings = settings.SIMPLE_JWT
                signing_key = jwt_settings.get("SIGNING_KEY", settings.SECRET_KEY)
                algorithms = jwt_settings.get("ALGORITHMS", ["HS256"])
                payload = jwt.decode(
                    token,
                    signing_key,
                    algorithms=algorithms,
                )
                request.org_id = payload.get("org_id")
                set_current_org_id(request.org_id)
            except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, KeyError):
                pass

        if not request.org_id:
            set_current_org_id(None)

    def process_response(
        self, request: HttpRequest, response: HttpResponse
    ) -> HttpResponse:
        clear()
        return response
