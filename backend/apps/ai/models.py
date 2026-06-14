from __future__ import annotations

import base64
import hashlib

from django.conf import settings
from django.db import models

from apps.core.managers import TenantManager, UnscopedManager
from apps.core.models import TimeStampedModel, UUIDModel


def _get_fernet():
    """Get Fernet instance for encryption/decryption."""
    from cryptography.fernet import Fernet

    key = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    return Fernet(base64.urlsafe_b64encode(key))


class AIProvider(UUIDModel, TimeStampedModel):
    """Configured AI provider for an organization."""

    objects = TenantManager()
    unscoped = UnscopedManager()

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

    def set_api_key(self, key: str) -> None:
        """Encrypt and store the API key."""
        if key:
            fernet = _get_fernet()
            self.api_key = fernet.encrypt(key.encode()).decode()
        else:
            self.api_key = ""

    def get_api_key(self) -> str:
        """Decrypt and return the API key."""
        if not self.api_key:
            return ""
        try:
            fernet = _get_fernet()
            return fernet.decrypt(self.api_key.encode()).decode()
        except Exception:
            # Key may be stored in plaintext from before encryption was added
            return self.api_key


class AIConversation(UUIDModel, TimeStampedModel):
    """AI chat conversation."""

    objects = TenantManager()
    unscoped = UnscopedManager()

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

    objects = TenantManager()
    unscoped = UnscopedManager()

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
