from __future__ import annotations

from django.db import models

from apps.core.models import TimeStampedModel, UUIDModel


class AIProvider(UUIDModel, TimeStampedModel):
    """Configured AI provider for an organization."""

    PROVIDER_CHOICES = [
        ("openai", "OpenAI"),
        ("anthropic", "Anthropic"),
        ("gemini", "Google Gemini"),
        ("ollama", "Ollama (Local)"),
        ("groq", "Groq"),
        ("openrouter", "OpenRouter"),
    ]

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="ai_providers",
    )
    name = models.CharField(max_length=100)
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES)
    model_name = models.CharField(max_length=100, default="gpt-4o-mini")
    api_key = models.CharField(max_length=500, blank=True, default="")
    api_base_url = models.URLField(blank=True, default="")
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    max_tokens = models.IntegerField(default=4096)
    temperature = models.FloatField(default=0.7)

    class Meta:
        ordering = ["-is_default", "name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.provider}/{self.model_name})"


class AIConversation(UUIDModel, TimeStampedModel):
    """AI chat conversation."""

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="ai_conversations",
    )
    store = models.ForeignKey(
        "stores.Store",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ai_conversations",
    )
    user = models.ForeignKey(
        "authentication.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="ai_conversations",
    )
    title = models.CharField(max_length=255, blank=True, default="New Conversation")
    context_type = models.CharField(
        max_length=50,
        choices=[
            ("chat", "General Chat"),
            ("product_gen", "Product Generation"),
            ("content_gen", "Content Generation"),
            ("analytics", "Analytics Assistant"),
            ("support", "Customer Support"),
        ],
        default="chat",
    )
    provider = models.ForeignKey(
        AIProvider,
        on_delete=models.SET_NULL,
        null=True,
        related_name="conversations",
    )
    model_name = models.CharField(max_length=100, blank=True, default="")
    is_active = models.BooleanField(default=True)
    total_tokens_used = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.title or f"Conversation {self.id}"


class AIMessage(UUIDModel, TimeStampedModel):
    """Message in an AI conversation."""

    ROLE_CHOICES = [
        ("system", "System"),
        ("user", "User"),
        ("assistant", "Assistant"),
    ]

    conversation = models.ForeignKey(
        AIConversation, on_delete=models.CASCADE, related_name="messages"
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    tokens_used = models.PositiveIntegerField(default=0)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self) -> str:
        return f"{self.role}: {self.content[:50]}"


class AIGenerationLog(UUIDModel, TimeStampedModel):
    """Log of AI content generation requests."""

    TASK_CHOICES = [
        ("product_description", "Product Description"),
        ("product_title", "Product Title"),
        ("seo_title", "SEO Title"),
        ("seo_description", "SEO Description"),
        ("marketing_copy", "Marketing Copy"),
        ("blog_post", "Blog Post"),
        ("email", "Email"),
        ("store_description", "Store Description"),
    ]

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="ai_generation_logs",
    )
    user = models.ForeignKey(
        "authentication.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="ai_generation_logs",
    )
    task_type = models.CharField(max_length=30, choices=TASK_CHOICES)
    prompt = models.TextField()
    result = models.TextField(blank=True, default="")
    provider = models.CharField(max_length=50, blank=True, default="")
    model_name = models.CharField(max_length=100, blank=True, default="")
    tokens_used = models.PositiveIntegerField(default=0)
    latency_ms = models.PositiveIntegerField(default=0)
    is_success = models.BooleanField(default=True)
    error_message = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.task_type} - {self.created_at}"
