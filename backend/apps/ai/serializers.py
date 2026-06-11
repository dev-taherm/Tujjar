from __future__ import annotations

from rest_framework import serializers

from .models import AIGenerationLog, AIProvider, AIConversation, AIMessage


class AIProviderSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIProvider
        fields = [
            "id", "organization", "name", "provider", "model_name",
            "api_key", "api_base_url", "is_active", "is_default",
            "max_tokens", "temperature", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "organization", "created_at", "updated_at"]
        extra_kwargs = {"api_key": {"write_only": True}}


class AIMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIMessage
        fields = ["id", "conversation", "role", "content", "tokens_used", "metadata", "created_at"]
        read_only_fields = ["id", "tokens_used", "created_at"]


class AIConversationSerializer(serializers.ModelSerializer):
    messages = AIMessageSerializer(many=True, read_only=True)

    class Meta:
        model = AIConversation
        fields = [
            "id", "organization", "store", "user", "title",
            "context_type", "provider", "model_name", "is_active",
            "total_tokens_used", "messages", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "organization", "total_tokens_used", "created_at", "updated_at"]


class AIConversationListSerializer(serializers.ModelSerializer):
    message_count = serializers.SerializerMethodField()

    class Meta:
        model = AIConversation
        fields = [
            "id", "title", "context_type", "model_name",
            "total_tokens_used", "message_count", "created_at", "updated_at",
        ]

    def get_message_count(self, obj) -> int:
        return obj.messages.count()


class AIGenerationLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIGenerationLog
        fields = [
            "id", "organization", "user", "task_type", "prompt",
            "result", "provider", "model_name", "tokens_used",
            "latency_ms", "is_success", "error_message", "created_at",
        ]
        read_only_fields = ["id", "organization", "created_at"]


class GenerateContentSerializer(serializers.Serializer):
    task_type = serializers.ChoiceField(choices=AIGenerationLog.TASK_CHOICES)
    prompt = serializers.CharField()
    context = serializers.JSONField(required=False, default=dict)
    tone = serializers.CharField(required=False, default="professional")
    max_tokens = serializers.IntegerField(required=False, default=1024)
    temperature = serializers.FloatField(required=False, default=0.7)


class ChatMessageSerializer(serializers.Serializer):
    message = serializers.CharField()
    conversation_id = serializers.UUIDField(required=False)


class ProductGenerateSerializer(serializers.Serializer):
    title = serializers.CharField()
    product_type = serializers.CharField(required=False, default="physical")
    price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    category = serializers.CharField(required=False, default="")
    tone = serializers.CharField(required=False, default="professional")
