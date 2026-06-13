from django.contrib import admin

from .models import AIConversation, AIGenerationLog, AIMessage, AIProvider


@admin.register(AIProvider)
class AIProviderAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "provider",
        "model_name",
        "organization",
        "is_active",
        "is_default",
        "max_tokens",
        "temperature",
        "created_at",
    ]
    list_filter = ["provider", "is_active", "is_default"]
    search_fields = ["name", "model_name", "organization__name"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(AIConversation)
class AIConversationAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "organization",
        "user",
        "context_type",
        "provider",
        "is_active",
        "total_tokens_used",
        "created_at",
    ]
    list_filter = ["context_type", "is_active"]
    search_fields = ["title", "user__email"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(AIMessage)
class AIMessageAdmin(admin.ModelAdmin):
    list_display = ["conversation", "role", "content_preview", "tokens_used", "created_at"]
    list_filter = ["role"]
    search_fields = ["content", "conversation__title"]
    readonly_fields = ["created_at", "updated_at"]

    def content_preview(self, obj):
        return obj.content[:100] + "..." if len(obj.content) > 100 else obj.content

    content_preview.short_description = "Content"


@admin.register(AIGenerationLog)
class AIGenerationLogAdmin(admin.ModelAdmin):
    list_display = [
        "task_type",
        "user",
        "provider",
        "model_name",
        "tokens_used",
        "latency_ms",
        "is_success",
        "created_at",
    ]
    list_filter = ["task_type", "provider", "is_success"]
    search_fields = ["prompt", "result", "user__email"]
    readonly_fields = ["created_at", "updated_at"]
