from django.contrib import admin

from .models import SearchIndex, SearchQuery


@admin.register(SearchIndex)
class SearchIndexAdmin(admin.ModelAdmin):
    list_display = ["title", "entity_type", "entity_id", "store", "boost", "created_at"]
    list_filter = ["entity_type", "store"]
    search_fields = ["title", "description"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(SearchQuery)
class SearchQueryAdmin(admin.ModelAdmin):
    list_display = [
        "query",
        "store",
        "results_count",
        "clicked_entity_type",
        "visitor_id",
        "created_at",
    ]
    list_filter = ["store"]
    search_fields = ["query", "visitor_id", "session_id"]
    readonly_fields = ["created_at", "updated_at"]
