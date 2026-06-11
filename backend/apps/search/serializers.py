from __future__ import annotations

from rest_framework import serializers

from apps.search.models import SearchIndex, SearchQuery


class SearchIndexSerializer(serializers.ModelSerializer):
    class Meta:
        model = SearchIndex
        fields = [
            "id", "entity_type", "entity_id", "title",
            "description", "tags", "boost", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class SearchQuerySerializer(serializers.ModelSerializer):
    class Meta:
        model = SearchQuery
        fields = [
            "id", "query", "results_count", "clicked_entity_type",
            "clicked_entity_id", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class SearchResultSerializer(serializers.Serializer):
    entity_type = serializers.CharField()
    entity_id = serializers.UUIDField()
    title = serializers.CharField()
    description = serializers.CharField()
    score = serializers.FloatField()
    highlight = serializers.CharField()


class SearchRequestSerializer(serializers.Serializer):
    q = serializers.CharField(max_length=500)
    entity_types = serializers.ListField(
        child=serializers.ChoiceField(choices=SearchIndex.EntityType.choices),
        required=False,
        default=[],
    )
    limit = serializers.IntegerField(min_value=1, max_value=50, default=20)
