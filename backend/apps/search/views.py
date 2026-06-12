from __future__ import annotations

from django.conf import settings
from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.search.models import SearchIndex, SearchQuery
from apps.search.serializers import (
    SearchIndexSerializer,
    SearchQuerySerializer,
    SearchRequestSerializer,
)

# Trigram requires pg_trgm extension (PostgreSQL only)
USE_TRIGRAM = "postgresql" in settings.DATABASES.get("default", {}).get("ENGINE", "")

if USE_TRIGRAM:
    from django.contrib.postgres.search import TrigramSimilarity
    from django.db.models import Value, FloatField
    from django.db.models.functions import Greatest
class SearchIndexViewSet(viewsets.ModelViewSet):
    queryset = SearchIndex.objects.all()
    serializer_class = SearchIndexSerializer

    @action(detail=False, methods=["post"])
    def search(self, request):
        serializer = SearchRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        query = serializer.validated_data["q"]
        entity_types = serializer.validated_data["entity_types"]
        limit = serializer.validated_data["limit"]

        org = getattr(request, "organization", None)
        store = getattr(request, "store", None)

        qs = SearchIndex.objects.filter(organization=org, store=store)
        if entity_types:
            qs = qs.filter(entity_type__in=entity_types)

        if USE_TRIGRAM:
            qs = qs.annotate(
                similarity=Greatest(
                    TrigramSimilarity("title", query),
                    TrigramSimilarity("description", query),
                    Value(0, output_field=FloatField()),
                )
            ).filter(similarity__gt=0.05).order_by("-similarity")[:limit]

            results = [
                {
                    "entity_type": item.entity_type,
                    "entity_id": item.entity_id,
                    "title": item.title,
                    "description": item.description[:200],
                    "score": round(item.similarity, 4),
                    "highlight": item.title,
                }
                for item in qs
            ]
        else:
            qs = qs.filter(
                Q(title__icontains=query) | Q(description__icontains=query)
            )[:limit]

            results = [
                {
                    "entity_type": item.entity_type,
                    "entity_id": item.entity_id,
                    "title": item.title,
                    "description": item.description[:200],
                    "score": 0.5,
                    "highlight": item.title,
                }
                for item in qs
            ]

        # Log the search query
        SearchQuery.objects.create(
            organization=org,
            store=store,
            query=query,
            results_count=len(results),
        )

        return Response({"results": results, "query": query})

    @action(detail=False, methods=["get"])
    def search_suggestions(self, request):
        q = request.query_params.get("q", "").strip()
        if len(q) < 2:
            return Response({"suggestions": []})

        org = getattr(request, "organization", None)
        store = getattr(request, "store", None)

        qs = SearchIndex.objects.filter(
            organization=org, store=store,
            title__icontains=q,
        ).values_list("title", flat=True).distinct()[:8]

        return Response({"suggestions": list(qs)})


class SearchQueryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SearchQuery.objects.all()
    serializer_class = SearchQuerySerializer
