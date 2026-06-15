from __future__ import annotations

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.viewsets import TenantViewSet


from .models import AIGenerationLog, AIProvider, AIConversation, AIMessage
from .serializers import (
    AIConversationSerializer,
    AIConversationListSerializer,
    AIGenerationLogSerializer,
    AIProviderSerializer,
    ChatMessageSerializer,
    GenerateContentSerializer,
    ProductGenerateSerializer,
)
from .services.chat import AIChatAssistant
from .services.content import ContentGenerator


def _get_active_provider(organization_id) -> dict | None:
    """Get the default active AI provider for an organization."""
    provider = AIProvider.objects.filter(
        organization_id=organization_id, is_active=True, is_default=True
    ).first()
    if not provider:
        provider = AIProvider.objects.filter(
            organization_id=organization_id, is_active=True
        ).first()
    if not provider:
        return None
    return {
        "provider": provider.provider,
        "api_key": provider.get_api_key(),
        "model_name": provider.model_name,
        "api_base_url": provider.api_base_url,
        "max_tokens": provider.max_tokens,
        "temperature": provider.temperature,
    }


class AIProviderViewSet(TenantViewSet):
    """AI provider configuration."""

    serializer_class = AIProviderSerializer
    required_permission = "ai.use"

    def get_queryset(self):
        return AIProvider.objects.filter(organization_id=self.request.org_id)

    def perform_create(self, serializer):
        serializer.save(organization_id=self.request.org_id)


class AIConversationViewSet(TenantViewSet):
    """AI chat conversations."""

    required_permission = "ai.use"

    def get_serializer_class(self):
        if self.action == "list":
            return AIConversationListSerializer
        return AIConversationSerializer

    def get_queryset(self):
        return AIConversation.objects.filter(
            organization_id=self.request.org_id
        ).prefetch_related("messages")

    def perform_create(self, serializer):
        serializer.save(organization_id=self.request.org_id, user=self.request.user)

    @action(detail=True, methods=["post"])
    def send_message(self, request, pk=None):
        """Send a message to a conversation and get AI response."""
        conversation = self.get_object()
        serializer = ChatMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_message = serializer.validated_data["message"]

        AIMessage.objects.create(
            conversation=conversation,
            role="user",
            content=user_message,
        )

        provider_config = _get_active_provider(self.request.org_id)
        if not provider_config:
            return Response(
                {"detail": "No active AI provider configured."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        chat = AIChatAssistant(provider_config)
        history = list(conversation.messages.order_by("created_at").values("role", "content"))
        result = chat.chat(history)

        AIMessage.objects.create(
            conversation=conversation,
            role="assistant",
            content=result["content"],
            tokens_used=result.get("tokens_used", 0),
            metadata={"latency_ms": result.get("latency_ms", 0)},
        )

        conversation.total_tokens_used += result.get("tokens_used", 0)
        conversation.save(update_fields=["total_tokens_used", "updated_at"])

        return Response({
            "content": result["content"],
            "tokens_used": result.get("tokens_used", 0),
            "latency_ms": result.get("latency_ms", 0),
        })


class AIGenerationViewSet(viewsets.GenericViewSet):
    """AI content generation endpoints."""
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["post"])
    def generate_content(self, request):
        """Generate AI content (descriptions, SEO, marketing copy)."""
        serializer = GenerateContentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        provider_config = _get_active_provider(self.request.org_id)
        if not provider_config:
            return Response(
                {"detail": "No active AI provider configured."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        gen = ContentGenerator(provider_config)
        result = gen.generate(
            task_type=serializer.validated_data["task_type"],
            prompt=serializer.validated_data["prompt"],
            context=serializer.validated_data.get("context", {}),
            max_tokens=serializer.validated_data.get("max_tokens", 1024),
            temperature=serializer.validated_data.get("temperature", 0.7),
        )

        AIGenerationLog.objects.create(
            organization_id=self.request.org_id,
            user=self.request.user,
            task_type=serializer.validated_data["task_type"],
            prompt=serializer.validated_data["prompt"],
            result=result.get("content", ""),
            provider=provider_config.get("provider", ""),
            model_name=provider_config.get("model_name", ""),
            tokens_used=result.get("tokens_used", 0),
            latency_ms=result.get("latency_ms", 0),
            is_success=result.get("is_success", False),
            error_message=result.get("error", ""),
        )

        return Response(result)

    @action(detail=False, methods=["post"], url_path="generate-product")
    def generate_product_content(self, request):
        """Generate product description and SEO content."""
        serializer = ProductGenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        provider_config = _get_active_provider(self.request.org_id)
        if not provider_config:
            return Response(
                {"detail": "No active AI provider configured."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        gen = ContentGenerator(provider_config)

        prompt = f"""Generate product content for:
Title: {serializer.validated_data["title"]}
Type: {serializer.validated_data.get("product_type", "physical")}
Price: {serializer.validated_data.get("price", "N/A")}
Category: {serializer.validated_data.get("category", "General")}

Generate:
1. A compelling product description (2-3 paragraphs)
2. An SEO title (under 60 chars)
3. A meta description (under 160 chars)
4. 3-5 marketing bullet points

Tone: {serializer.validated_data.get("tone", "professional")}

Return as JSON: {{"description": "...", "seo_title": "...", "seo_description": "...", "bullet_points": ["..."]}}"""

        result = gen.generate("product_description", prompt)

        try:
            import json
            parsed = json.loads(result.get("content", "{}"))
        except (json.JSONDecodeError, TypeError):
            parsed = {
                "description": result.get("content", ""),
                "seo_title": serializer.validated_data["title"],
                "seo_description": "",
                "bullet_points": [],
            }

        AIGenerationLog.objects.create(
            organization_id=self.request.org_id,
            user=self.request.user,
            task_type="product_description",
            prompt=prompt,
            result=result.get("content", ""),
            provider=provider_config.get("provider", ""),
            model_name=provider_config.get("model_name", ""),
            tokens_used=result.get("tokens_used", 0),
            latency_ms=result.get("latency_ms", 0),
            is_success=result.get("is_success", False),
            error_message=result.get("error", ""),
        )

        return Response(parsed)

    @action(detail=False, methods=["get"], url_path="logs")
    def generation_logs(self, request):
        """List recent AI generation logs."""
        logs = AIGenerationLog.objects.filter(
            organization_id=self.request.org_id
        )[:50]
        return Response(AIGenerationLogSerializer(logs, many=True).data)
