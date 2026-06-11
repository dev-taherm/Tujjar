from __future__ import annotations

from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardPagination(PageNumberPagination):
    """Standard pagination with consistent response format."""

    page_size = 25
    page_size_query_param = "per_page"
    max_page_size = 100

    def get_paginated_response(self, data: list) -> Response:
        return Response(
            {
                "pagination": {
                    "page": self.page.number,
                    "per_page": self.get_page_size(self.request),
                    "total": self.page.paginator.count,
                    "total_pages": self.page.paginator.num_pages,
                    "has_next": self.page.has_next(),
                    "has_previous": self.page.has_previous(),
                },
                "results": data,
            }
        )
